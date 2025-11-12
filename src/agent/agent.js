// Agent script injected into page context
// Provides safe wrappers for storage APIs

(function () {
  'use strict';

  // Prevent re-injection
  if (window.__CACHECAT_AGENT__) {
    return;
  }
  window.__CACHECAT_AGENT__ = true;

  // Security: Whitelist of allowed message types
  const ALLOWED_MESSAGE_TYPES = [
    'GET_LOCAL_STORAGE',
    'SET_LOCAL_STORAGE',
    'REMOVE_LOCAL_STORAGE',
    'CLEAR_LOCAL_STORAGE',
    'GET_SESSION_STORAGE',
    'SET_SESSION_STORAGE',
    'REMOVE_SESSION_STORAGE',
    'CLEAR_SESSION_STORAGE',
    'GET_INDEXEDDB_DATABASES',
    'GET_INDEXEDDB_STORES',
    'GET_INDEXEDDB_RECORDS',
    'SET_INDEXEDDB_RECORD',
    'DELETE_INDEXEDDB_RECORD',
    'CLEAR_INDEXEDDB_STORE',
    'GET_CACHE_STORAGE_CACHES',
    'GET_CACHE_STORAGE_ENTRIES',
    'DELETE_CACHE_STORAGE_ENTRY',
    'DELETE_CACHE_STORAGE',
    'REFETCH_CACHE_STORAGE_ENTRY',
  ];

  const MESSAGE_HANDLERS = {
    // Local Storage
    GET_LOCAL_STORAGE: () => {
      try {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return { success: true, items };
      } catch (error) {
        return { error: error.message };
      }
    },

    SET_LOCAL_STORAGE: ({ key, value }) => {
      try {
        // Security: Validate input
        if (typeof key !== 'string' || key.length === 0 || key.length > 10000) {
          return { error: 'Invalid key: must be a non-empty string under 10000 characters' };
        }
        if (typeof value !== 'string' || value.length > 10 * 1024 * 1024) {
          return { error: 'Invalid value: must be a string under 10MB' };
        }
        localStorage.setItem(key, value);
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    REMOVE_LOCAL_STORAGE: ({ key }) => {
      try {
        localStorage.removeItem(key);
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    CLEAR_LOCAL_STORAGE: () => {
      try {
        localStorage.clear();
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    // Session Storage
    GET_SESSION_STORAGE: () => {
      try {
        const items = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          items[key] = sessionStorage.getItem(key);
        }
        return { success: true, items };
      } catch (error) {
        return { error: error.message };
      }
    },

    SET_SESSION_STORAGE: ({ key, value }) => {
      try {
        // Security: Validate input
        if (typeof key !== 'string' || key.length === 0 || key.length > 10000) {
          return { error: 'Invalid key: must be a non-empty string under 10000 characters' };
        }
        if (typeof value !== 'string' || value.length > 10 * 1024 * 1024) {
          return { error: 'Invalid value: must be a string under 10MB' };
        }
        sessionStorage.setItem(key, value);
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    REMOVE_SESSION_STORAGE: ({ key }) => {
      try {
        sessionStorage.removeItem(key);
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    CLEAR_SESSION_STORAGE: () => {
      try {
        sessionStorage.clear();
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    // IndexedDB
    GET_INDEXEDDB_DATABASES: async () => {
      try {
        const databases = await indexedDB.databases();
        return {
          success: true,
          databases: databases.map((db) => ({ name: db.name, version: db.version })),
        };
      } catch (error) {
        return { error: error.message };
      }
    },

    GET_INDEXEDDB_OBJECT_STORES: async ({ databaseName }) => {
      try {
        const db = await openDatabase(databaseName);
        const stores = [];
        if (db.objectStoreNames) {
          for (const storeName of db.objectStoreNames) {
            const store = db.transaction(storeName, 'readonly').objectStore(storeName);
            const indexes = [];
            if (store.indexNames) {
              for (const indexName of store.indexNames) {
                const index = store.index(indexName);
                indexes.push({
                  name: indexName,
                  keyPath: index.keyPath,
                  unique: index.unique,
                  multiEntry: index.multiEntry,
                });
              }
            }
            stores.push({
              name: storeName,
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement,
              indexes,
            });
          }
        }
        db.close();
        return { success: true, stores };
      } catch (error) {
        return { error: error.message };
      }
    },

    GET_INDEXEDDB_RECORDS: async ({ databaseName, storeName, page = 0, pageSize = 50 }) => {
      try {
        const db = await openDatabase(databaseName);
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const records = [];
        let index = 0;
        let skip = page * pageSize;

        return new Promise((resolve, reject) => {
          const request = store.openCursor();
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) {
              db.close();
              resolve({ success: true, records, total: index });
              return;
            }

            if (skip > 0) {
              skip--;
              cursor.continue();
              return;
            }

            if (records.length < pageSize) {
              records.push({
                key: cursor.key,
                value: cursor.value,
              });
              index++;
              cursor.continue();
            } else {
              db.close();
              resolve({ success: true, records, total: index + 1, hasMore: true });
            }
          };
          request.onerror = () => {
            db.close();
            reject(new Error('Failed to read records'));
          };
        });
      } catch (error) {
        return { error: error.message };
      }
    },

    SET_INDEXEDDB_RECORD: async ({ databaseName, storeName, key, value }) => {
      try {
        const db = await openDatabase(databaseName);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        await promisifyRequest(store.put(value, key));
        db.close();
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    DELETE_INDEXEDDB_RECORD: async ({ databaseName, storeName, key }) => {
      try {
        const db = await openDatabase(databaseName);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        await promisifyRequest(store.delete(key));
        db.close();
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    CLEAR_INDEXEDDB_STORE: async ({ databaseName, storeName }) => {
      try {
        const db = await openDatabase(databaseName);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        await promisifyRequest(store.clear());
        db.close();
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    // Cache Storage
    GET_CACHE_STORAGE_NAMES: async () => {
      try {
        const names = await caches.keys();
        return { success: true, names };
      } catch (error) {
        return { error: error.message };
      }
    },

    GET_CACHE_STORAGE_ENTRIES: async ({ cacheName, page = 0, pageSize = 50 }) => {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        const total = keys.length;
        const start = page * pageSize;
        const end = start + pageSize;
        const pageKeys = keys.slice(start, end);

        const entries = await Promise.all(
          pageKeys.map(async (request) => {
            const response = await cache.match(request);
            const headers = {};
            if (response) {
              response.headers.forEach((value, key) => {
                headers[key] = value;
              });
            }
            return {
              request: {
                url: request.url,
                method: request.method,
                headers: Object.fromEntries(request.headers.entries()),
              },
              response: response
                ? {
                    status: response.status,
                    statusText: response.statusText,
                    type: response.type,
                    headers,
                    body: await getResponseBody(response),
                  }
                : null,
            };
          })
        );

        return {
          success: true,
          entries,
          total,
          hasMore: end < total,
        };
      } catch (error) {
        return { error: error.message };
      }
    },

    DELETE_CACHE_STORAGE_ENTRY: async ({ cacheName, requestUrl }) => {
      try {
        const cache = await caches.open(cacheName);
        await cache.delete(requestUrl);
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    DELETE_CACHE_STORAGE: async ({ cacheName }) => {
      try {
        await caches.delete(cacheName);
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    REFETCH_CACHE_STORAGE_ENTRY: async ({ cacheName, requestUrl }) => {
      try {
        const response = await fetch(requestUrl);
        const cache = await caches.open(cacheName);
        await cache.put(requestUrl, response.clone());
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },
  };

  // Helper functions
  function openDatabase(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getResponseBody(response) {
    try {
      const clone = response.clone();
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await clone.json();
      } else if (contentType.includes('text/')) {
        return await clone.text();
      } else {
        const blob = await clone.blob();
        return {
          type: blob.type,
          size: blob.size,
          preview: 'Binary data',
        };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  // Message queue for pending requests
  const pendingMessages = new Map();
  let messageIdCounter = 0;

  // Listen for messages from content script bridge
  window.addEventListener('message', (event) => {
    // Security: Only accept messages from the same window and origin
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;

    // Handle responses from content script
    if (event.data && event.data.__CACHECAT_RESPONSE__ === true) {
      const { messageId, response } = event.data;
      const resolver = pendingMessages.get(messageId);
      if (resolver) {
        resolver(response);
        pendingMessages.delete(messageId);
      }
      return;
    }

    // Handle incoming messages from content script
    if (event.data && event.data.__CACHECAT_MESSAGE__ === true) {
      const { message, requestId } = event.data;
      const { type, payload } = message;
      
      // Security: Validate message type
      if (!ALLOWED_MESSAGE_TYPES.includes(type)) {
        window.postMessage(
          {
            __CACHECAT_AGENT_RESPONSE__: true,
            requestId,
            response: { error: `Invalid message type: ${type}` },
          },
          '*'
        );
        return;
      }
      
      const handler = MESSAGE_HANDLERS[type];

      if (handler) {
        const result = handler(payload);
        if (result instanceof Promise) {
          result
            .then((response) => {
              window.postMessage(
                {
                  __CACHECAT_AGENT_RESPONSE__: true,
                  requestId,
                  response,
                },
                '*'
              );
            })
            .catch((error) => {
              window.postMessage(
                {
                  __CACHECAT_AGENT_RESPONSE__: true,
                  requestId,
                  response: { error: error.message },
                },
                '*'
              );
            });
        } else {
          window.postMessage(
            {
              __CACHECAT_AGENT_RESPONSE__: true,
              requestId,
              response: result,
            },
            '*'
          );
        }
      } else {
        window.postMessage(
          {
            __CACHECAT_AGENT_RESPONSE__: true,
            requestId,
            response: { error: `Unknown message type: ${type}` },
          },
          '*'
        );
      }
    }
  });

  // Send message to content script bridge
  function sendToContentScript(message) {
    return new Promise((resolve) => {
      const messageId = ++messageIdCounter;
      pendingMessages.set(messageId, resolve);

      window.postMessage(
        {
          __CACHECAT__: true,
          messageId,
          type: message.type,
          payload: message.payload,
        },
        '*'
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingMessages.has(messageId)) {
          pendingMessages.delete(messageId);
          resolve({ error: 'Request timeout' });
        }
      }, 30000);
    });
  }

  // Expose send function for direct calls (if needed)
  window.__CACHECAT_SEND__ = sendToContentScript;
})();
