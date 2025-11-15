import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AttachContext = createContext();

// Helper to compare tab objects
function tabsEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.tabId === b.tabId && a.origin === b.origin && a.url === b.url;
}

export function AttachProvider({ children }) {
  const [attachedTab, setAttachedTab] = useState(null);
  const [isAttached, setIsAttached] = useState(false);
  const attachedTabRef = useRef(null);
  const isCheckingRef = useRef(false);
  const hasExplicitlyDetachedRef = useRef(false);

  const checkAttachedTab = useCallback(() => {
    // Prevent concurrent checks
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    chrome.runtime.sendMessage({ type: 'GET_ATTACHED_TAB' }, (response) => {
      isCheckingRef.current = false;

      if (chrome.runtime.lastError) {
        // Only update if state actually changed
        if (attachedTabRef.current !== null) {
          attachedTabRef.current = null;
          setAttachedTab(null);
          setIsAttached(false);
        }
        return;
      }

      const newTab = response && response.tabId ? response : null;

      // Only update state if values actually changed
      if (!tabsEqual(attachedTabRef.current, newTab)) {
        attachedTabRef.current = newTab;
        setAttachedTab(newTab);
        setIsAttached(newTab !== null);
      }
    });
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkAttachedTab();

    // Check if user explicitly detached (stored in sessionStorage)
    const wasDetached = sessionStorage.getItem('cachecat-detached') === 'true';
    if (wasDetached) {
      hasExplicitlyDetachedRef.current = true;
      // Clear the flag since we've checked it
      sessionStorage.removeItem('cachecat-detached');
    }

    // If not attached, check if there's an attachment from background script
    // (This happens when user clicks extension icon - background auto-attaches)
    const checkForAttachment = async () => {
      // Don't check if user explicitly detached
      if (hasExplicitlyDetachedRef.current) {
        return;
      }

      const response = await sendMessage({ type: 'GET_ATTACHED_TAB' });
      if (response && response.tabId) {
        // Already attached (from extension icon click), update ref
        attachedTabRef.current = response;
        setAttachedTab(response);
        setIsAttached(true);
      }
    };

    // Check for attachment after a short delay to let background script finish
    const checkTimer = setTimeout(checkForAttachment, 500);

    // Check periodically to verify attachment is still valid
    // Only check if we're attached (to detect if tab was closed)
    const checkInterval = setInterval(() => {
      if (attachedTabRef.current && !hasExplicitlyDetachedRef.current) {
        checkAttachedTab();
      }
    }, 3000);

    // Send keepalive messages every 15 seconds to keep service worker alive
    // Combined with chrome.alarms in background.js, this ensures the service worker stays active
    const keepaliveInterval = setInterval(() => {
      chrome.runtime.sendMessage({ type: 'KEEPALIVE' }, () => {
        // Ignore errors - service worker might be inactive, that's ok
      });
    }, 15000);

    return () => {
      clearTimeout(checkTimer);
      clearInterval(checkInterval);
      clearInterval(keepaliveInterval);
    };
  }, [checkAttachedTab]);

  const attachToTab = useCallback(async () => {
    const response = await sendMessage({ type: 'ATTACH_TO_TAB' });
    if (response.error) {
      throw new Error(response.error);
    }
    if (response.success) {
      const newTab = {
        tabId: response.tabId,
        origin: response.origin,
        url: response.url,
        title: response.title,
      };
      attachedTabRef.current = newTab;
      setAttachedTab(newTab);
      setIsAttached(true);
      // Clear the detached flag since user manually attached
      hasExplicitlyDetachedRef.current = false;
      sessionStorage.removeItem('cachecat-detached');
      return response;
    }
    throw new Error('Attach failed');
  }, []);

  const detachTab = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'DETACH_TAB' }, () => {
      if (chrome.runtime.lastError) {
        console.error('Detach error:', chrome.runtime.lastError);
      }
      // Always clear local state, even if there was an error
      attachedTabRef.current = null;
      setAttachedTab(null);
      setIsAttached(false);
      // Mark that user explicitly detached - prevents auto-attach on refresh
      hasExplicitlyDetachedRef.current = true;
      sessionStorage.setItem('cachecat-detached', 'true');
    });
  }, []);

  const refresh = useCallback(() => {
    checkAttachedTab();
  }, [checkAttachedTab]);

  return (
    <AttachContext.Provider
      value={{
        attachedTab,
        isAttached,
        attachToTab,
        detachTab,
        refresh,
      }}
    >
      {children}
    </AttachContext.Provider>
  );
}

export function useAttach() {
  const context = useContext(AttachContext);
  if (!context) {
    throw new Error('useAttach must be used within AttachProvider');
  }
  return context;
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}
