// Background service worker for CacheCat
// Handles routing, cookies API, and agent injection

const ACTIVE_TABS = new Map(); // tabId -> { origin, url, timestamp }
const DASHBOARD_TO_TAB = new Map(); // dashboardTabId -> targetTabId (which website tab this dashboard is viewing)

// Keep service worker alive using chrome.alarms (optimized for Chrome extensions)
// This is more reliable than fetch-based approaches for extension service workers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepalive') {
    // Just handling this event keeps the service worker alive
    // Check if we have active tabs
    if (ACTIVE_TABS.size > 0) {
      // Service worker is needed, reset alarm for another 20 seconds
      chrome.alarms.create('keepalive', { delayInMinutes: 20 / 60 }); // 20 seconds
    }
  }
});

// Create alarm when we have active tabs
// This ensures the service worker stays alive while there are attached tabs
function ensureKeepaliveAlarm() {
  if (ACTIVE_TABS.size > 0) {
    // Create alarm that fires every 20 seconds (before 30s timeout)
    chrome.alarms.create('keepalive', { delayInMinutes: 20 / 60, periodInMinutes: 20 / 60 });
  } else {
    chrome.alarms.clear('keepalive');
  }
}

// Listen for extension icon click
chrome.action.onClicked.addListener(async () => {
  // Get the active tab (the website user wants to inspect)
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let targetTabId = null;

  if (activeTab && activeTab.url && !activeTab.url.startsWith('chrome-extension://')) {
    try {
      // Immediately attach to this tab
      const url = new URL(activeTab.url);
      if (url.protocol !== 'chrome:' && url.protocol !== 'chrome-extension:') {
        // Inject scripts into the target tab
        try {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js'],
          });
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['agent.js'],
          });

          // Store attachment info
          ACTIVE_TABS.set(activeTab.id, {
            origin: url.origin,
            url: activeTab.url,
            timestamp: Date.now(),
          });

          ensureKeepaliveAlarm();

          targetTabId = activeTab.id;
        } catch (error) {
          console.error('Failed to inject scripts:', error);
        }
      }
    } catch (error) {
      console.error('Failed to attach:', error);
    }
  }

  // Open dashboard and map it to the target tab
  const dashboardTab = await chrome.tabs.create({
    url: chrome.runtime.getURL('dashboard.html'),
  });

  // Map this dashboard to the target tab (if we attached to one)
  if (targetTabId) {
    DASHBOARD_TO_TAB.set(dashboardTab.id, targetTabId);
  }
});

// Handle messages from dashboard and agent
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Security: Validate message structure
  if (!message || typeof message !== 'object' || !message.type) {
    sendResponse({ error: 'Invalid message format' });
    return false;
  }

  const { type, payload } = message;

  // Handle keepalive messages (keeps service worker alive)
  if (type === 'KEEPALIVE') {
    // Reset the alarm to keep service worker alive
    if (ACTIVE_TABS.size > 0) {
      ensureKeepaliveAlarm();
    }
    sendResponse({ success: true });
    return false; // Synchronous response
  }

  switch (type) {
    case 'ATTACH_TO_TAB':
      handleAttachToTab(payload, sender.tab?.id)
        .then(sendResponse)
        .catch((error) => sendResponse({ error: error.message }));
      return true; // Async response

    case 'DETACH_TAB': {
      // Clear the attachment for this specific dashboard
      const dashboardTabIdForDetach = sender.tab?.id;
      if (dashboardTabIdForDetach && DASHBOARD_TO_TAB.has(dashboardTabIdForDetach)) {
        const attachedTabId = DASHBOARD_TO_TAB.get(dashboardTabIdForDetach);
        DASHBOARD_TO_TAB.delete(dashboardTabIdForDetach);
        // Only remove from ACTIVE_TABS if no other dashboard is using it
        const isUsedByOtherDashboard = Array.from(DASHBOARD_TO_TAB.values()).includes(
          attachedTabId
        );
        if (!isUsedByOtherDashboard) {
          ACTIVE_TABS.delete(attachedTabId);
        }
        ensureKeepaliveAlarm();
      }
      sendResponse({ success: true });
      break;
    }

    case 'GET_ATTACHED_TAB': {
      // Find the tab associated with this specific dashboard
      const dashboardTabId = sender.tab?.id;
      let targetTabId = null;

      if (dashboardTabId && DASHBOARD_TO_TAB.has(dashboardTabId)) {
        // This dashboard has a specific tab mapped to it
        targetTabId = DASHBOARD_TO_TAB.get(dashboardTabId);
      } else if (ACTIVE_TABS.size > 0) {
        // Fallback: Get the most recently attached tab
        const entries = Array.from(ACTIVE_TABS.entries());
        const mostRecent = entries.sort((a, b) => b[1].timestamp - a[1].timestamp)[0];
        targetTabId = mostRecent[0];

        // Map this dashboard to that tab for future requests
        if (dashboardTabId) {
          DASHBOARD_TO_TAB.set(dashboardTabId, targetTabId);
        }
      }

      if (targetTabId && ACTIVE_TABS.has(targetTabId)) {
        const tabInfo = ACTIVE_TABS.get(targetTabId);
        chrome.tabs.get(targetTabId, (tab) => {
          if (chrome.runtime.lastError) {
            // Tab was closed, remove it
            ACTIVE_TABS.delete(targetTabId);
            if (dashboardTabId) {
              DASHBOARD_TO_TAB.delete(dashboardTabId);
            }
            sendResponse({ tabId: null });
          } else {
            sendResponse({
              tabId: targetTabId,
              origin: tabInfo.origin,
              url: tabInfo.url,
              title: tab?.title || 'Unknown',
            });
          }
        });
        return true;
      }
      sendResponse({ tabId: null });
      break;
    }

    case 'GET_COOKIES': {
      // Security: Validate sender is from dashboard
      const dashboardUrl = chrome.runtime.getURL('dashboard.html');
      if (sender.tab?.url && !sender.tab.url.startsWith(dashboardUrl)) {
        sendResponse({ error: 'Invalid sender' });
        return false;
      }

      // Get cookies for the tab associated with this dashboard
      const dashboardTabIdForCookies = sender.tab?.id;
      let targetTabIdForCookies = null;

      if (dashboardTabIdForCookies && DASHBOARD_TO_TAB.has(dashboardTabIdForCookies)) {
        targetTabIdForCookies = DASHBOARD_TO_TAB.get(dashboardTabIdForCookies);
      } else if (ACTIVE_TABS.size > 0) {
        const entries = Array.from(ACTIVE_TABS.entries());
        const mostRecent = entries.sort((a, b) => b[1].timestamp - a[1].timestamp)[0];
        targetTabIdForCookies = mostRecent[0];
      }

      if (targetTabIdForCookies && ACTIVE_TABS.has(targetTabIdForCookies)) {
        const tabInfo = ACTIVE_TABS.get(targetTabIdForCookies);
        handleGetCookies(tabInfo.origin)
          .then(sendResponse)
          .catch((error) => sendResponse({ error: error.message }));
        return true;
      }
      sendResponse({ error: 'No attached tab found' });
      break;
    }

    case 'SET_COOKIE': {
      // Security: Validate sender is from dashboard
      const dashboardUrl = chrome.runtime.getURL('dashboard.html');
      if (sender.tab?.url && !sender.tab.url.startsWith(dashboardUrl)) {
        sendResponse({ error: 'Invalid sender' });
        return false;
      }

      // Set cookie for the tab associated with this dashboard
      const dashboardTabIdForSetCookie = sender.tab?.id;
      let targetTabIdForSetCookie = null;

      if (dashboardTabIdForSetCookie && DASHBOARD_TO_TAB.has(dashboardTabIdForSetCookie)) {
        targetTabIdForSetCookie = DASHBOARD_TO_TAB.get(dashboardTabIdForSetCookie);
      } else if (ACTIVE_TABS.size > 0) {
        const entries = Array.from(ACTIVE_TABS.entries());
        const mostRecent = entries.sort((a, b) => b[1].timestamp - a[1].timestamp)[0];
        targetTabIdForSetCookie = mostRecent[0];
      }

      if (targetTabIdForSetCookie && ACTIVE_TABS.has(targetTabIdForSetCookie)) {
        const tabInfo = ACTIVE_TABS.get(targetTabIdForSetCookie);
        handleSetCookie({ ...payload, url: tabInfo.origin })
          .then(sendResponse)
          .catch((error) => sendResponse({ error: error.message }));
        return true;
      }
      sendResponse({ error: 'No attached tab found' });
      break;
    }

    case 'REMOVE_COOKIE': {
      // Security: Validate sender is from dashboard
      const dashboardUrl = chrome.runtime.getURL('dashboard.html');
      if (sender.tab?.url && !sender.tab.url.startsWith(dashboardUrl)) {
        sendResponse({ error: 'Invalid sender' });
        return false;
      }

      // Remove cookie for the tab associated with this dashboard
      const dashboardTabIdForRemoveCookie = sender.tab?.id;
      let targetTabIdForRemoveCookie = null;

      if (dashboardTabIdForRemoveCookie && DASHBOARD_TO_TAB.has(dashboardTabIdForRemoveCookie)) {
        targetTabIdForRemoveCookie = DASHBOARD_TO_TAB.get(dashboardTabIdForRemoveCookie);
      } else if (ACTIVE_TABS.size > 0) {
        const entries = Array.from(ACTIVE_TABS.entries());
        const mostRecent = entries.sort((a, b) => b[1].timestamp - a[1].timestamp)[0];
        targetTabIdForRemoveCookie = mostRecent[0];
      }

      if (targetTabIdForRemoveCookie && ACTIVE_TABS.has(targetTabIdForRemoveCookie)) {
        const tabInfo = ACTIVE_TABS.get(targetTabIdForRemoveCookie);
        handleRemoveCookie({ ...payload, url: tabInfo.origin })
          .then(sendResponse)
          .catch((error) => sendResponse({ error: error.message }));
        return true;
      }
      sendResponse({ error: 'No attached tab found' });
      break;
    }

    case 'TAB_UPDATED':
      // Check if attached tab navigated away
      if (ACTIVE_TABS.has(payload.tabId)) {
        const info = ACTIVE_TABS.get(payload.tabId);
        const newOrigin = new URL(payload.url).origin;
        if (info.origin !== newOrigin) {
          ACTIVE_TABS.delete(payload.tabId);
          // Notify dashboard
          chrome.runtime.sendMessage({
            type: 'TAB_NAVIGATED_AWAY',
            payload: { tabId: payload.tabId, oldOrigin: info.origin, newOrigin },
          });
        }
      }
      break;

    default: {
      // Forward agent messages from dashboard to its specific attached tab
      const dashboardTabIdForMessage = sender.tab?.id;
      let targetTabIdForMessage = null;

      if (dashboardTabIdForMessage && DASHBOARD_TO_TAB.has(dashboardTabIdForMessage)) {
        targetTabIdForMessage = DASHBOARD_TO_TAB.get(dashboardTabIdForMessage);
      } else if (ACTIVE_TABS.size > 0) {
        // Fallback: use most recent
        const entries = Array.from(ACTIVE_TABS.entries());
        const mostRecent = entries.sort((a, b) => b[1].timestamp - a[1].timestamp)[0];
        targetTabIdForMessage = mostRecent[0];
      }

      if (targetTabIdForMessage && ACTIVE_TABS.has(targetTabIdForMessage)) {
        forwardToAgent(targetTabIdForMessage, message)
          .then(sendResponse)
          .catch((error) => sendResponse({ error: error.message }));
        return true; // Async response
      }
      sendResponse({ error: 'No attached tab found' });
    }
  }
});

// Forward message from dashboard to agent in attached tab via content script
async function forwardToAgent(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response || {});
      }
    });
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && ACTIVE_TABS.has(tabId)) {
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      payload: { tabId, url: changeInfo.url },
    });
  }
});

// Inject agent script into target tab
async function handleAttachToTab(payload, dashboardTabId) {
  try {
    let targetTabId = null;
    let tab = null;

    // Check if this dashboard already has a mapped tab
    if (dashboardTabId && DASHBOARD_TO_TAB.has(dashboardTabId)) {
      targetTabId = DASHBOARD_TO_TAB.get(dashboardTabId);
      try {
        tab = await chrome.tabs.get(targetTabId);
      } catch (error) {
        // Tab might have been closed, fall through to finding another tab
        tab = null;
        DASHBOARD_TO_TAB.delete(dashboardTabId);
      }
    }

    // If no stored tab or it's invalid, find the most recent non-dashboard tab
    if (!tab || !tab.url) {
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      const dashboardUrl = chrome.runtime.getURL('dashboard.html');

      // Find the most recent tab that's not the dashboard and not a chrome:// page
      tab = allTabs
        .filter((t) => {
          if (!t.url) return false;
          if (t.url === dashboardUrl) return false;
          if (t.url.startsWith('chrome://')) return false;
          if (t.url.startsWith('chrome-extension://')) return false;
          return true;
        })
        .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
    }

    if (!tab || !tab.url) {
      throw new Error(
        'No suitable tab found. Please open a website first, then click the extension icon.'
      );
    }

    const url = new URL(tab.url);
    if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') {
      throw new Error('Cannot attach to chrome:// or chrome-extension:// pages');
    }

    const origin = url.origin;

    // Inject content script bridge and agent script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['agent.js'],
      });
    } catch (error) {
      throw new Error(`Failed to inject scripts: ${error.message}`);
    }

    // Store attachment info
    ACTIVE_TABS.set(tab.id, {
      origin,
      url: tab.url,
      timestamp: Date.now(),
    });

    ensureKeepaliveAlarm();

    return {
      success: true,
      tabId: tab.id,
      origin,
      url: tab.url,
      title: tab.title || 'Unknown',
    };
  } catch (error) {
    throw new Error(`Attach failed: ${error.message}`);
  }
}

// Cookies API handlers
async function handleGetCookies(url) {
  if (!url) {
    throw new Error('URL required');
  }
  try {
    const cookies = await chrome.cookies.getAll({ url });
    return { cookies: cookies.map(formatCookie) };
  } catch (error) {
    throw new Error(`Failed to get cookies: ${error.message}`);
  }
}

async function handleSetCookie(cookieData) {
  const { name, value, url, domain, path, secure, httpOnly, sameSite, expirationDate } = cookieData;

  if (!name || !url) {
    throw new Error('Name and URL required');
  }

  try {
    const details = {
      url,
      name,
      value: value || '',
      domain,
      path: path || '/',
      secure: secure || false,
      httpOnly: httpOnly || false,
      sameSite: sameSite || 'unspecified',
    };

    if (expirationDate) {
      details.expirationDate = expirationDate;
    }

    await chrome.cookies.set(details);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to set cookie: ${error.message}`);
  }
}

async function handleRemoveCookie(cookieData) {
  const { name, url } = cookieData;
  if (!name || !url) {
    throw new Error('Name and URL required');
  }

  try {
    await chrome.cookies.remove({ url, name });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to remove cookie: ${error.message}`);
  }
}

function formatCookie(cookie) {
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    expirationDate: cookie.expirationDate,
    session: cookie.session,
    storeId: cookie.storeId,
    hostOnly: cookie.hostOnly,
  };
}
