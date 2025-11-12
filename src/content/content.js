// Content script bridge for messaging between agent and background
// Injected via executeScript, so it has chrome.runtime access

(function () {
  'use strict';

  const pendingRequests = new Map();
  let requestIdCounter = 0;

  // Listen for messages from agent (page context) via window.postMessage
  window.addEventListener('message', (event) => {
    // Security: Only accept messages from the same window and origin
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;

    // Handle agent requests
    if (event.data && event.data.__CACHECAT__ === true && event.data.messageId) {
      const { type, payload, messageId } = event.data;

      // Forward to background script
      chrome.runtime.sendMessage({ type, payload }, (response) => {
        // Send response back to agent
        window.postMessage(
          {
            __CACHECAT_RESPONSE__: true,
            messageId,
            response: response || { error: chrome.runtime.lastError?.message || 'No response' },
          },
          '*'
        );
      });
      return;
    }

    // Handle agent responses (for messages from background)
    if (event.data && event.data.__CACHECAT_AGENT_RESPONSE__ === true) {
      const { requestId, response } = event.data;
      const resolver = pendingRequests.get(requestId);
      if (resolver) {
        resolver(response);
        pendingRequests.delete(requestId);
      }
    }
  });

  // Listen for messages from background script and forward to agent
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Only handle agent messages (not cookies, etc.)
    if (
      message.type &&
      (message.type.startsWith('GET_') ||
        message.type.startsWith('SET_') ||
        message.type.startsWith('REMOVE_') ||
        message.type.startsWith('CLEAR_') ||
        message.type.startsWith('DELETE_') ||
        message.type.startsWith('REFETCH_'))
    ) {
      const requestId = ++requestIdCounter;
      pendingRequests.set(requestId, sendResponse);

      // Forward to agent via window.postMessage
      window.postMessage(
        {
          __CACHECAT_MESSAGE__: true,
          requestId,
          message,
        },
        '*'
      );

      // Set timeout
      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          sendResponse({ error: 'Request timeout' });
        }
      }, 30000);

      return true; // Keep channel open for async response
    }

    // For non-agent messages, handle normally
    return false;
  });
})();
