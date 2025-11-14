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
    'GET_INDEXEDDB_OBJECT_STORES',
    'GET_INDEXEDDB_RECORDS',
    'SET_INDEXEDDB_RECORD',
    'DELETE_INDEXEDDB_RECORD',
    'CLEAR_INDEXEDDB_STORE',
    'GET_CACHE_STORAGE_CACHES',
    'GET_CACHE_STORAGE_NAMES',
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
        // First, verify database exists
        const allDatabases = await indexedDB.databases();
        const dbInfo = allDatabases.find((db) => db.name === databaseName);
        
        if (!dbInfo) {
          return { error: `Database ${databaseName} not found` };
        }
        
        // Open database - use current version automatically (safer than specifying version)
        const db = await openDatabaseWithVersion(databaseName, undefined);
        const stores = [];
        
        if (db && db.objectStoreNames && db.objectStoreNames.length > 0) {
          for (const storeName of db.objectStoreNames) {
            try {
              const transaction = db.transaction(storeName, 'readonly');
              const store = transaction.objectStore(storeName);
              const indexes = [];
              
              if (store && store.indexNames && store.indexNames.length > 0) {
                for (const indexName of store.indexNames) {
                  try {
                    const index = store.index(indexName);
                    indexes.push({
                      name: indexName,
                      keyPath: index.keyPath,
                      unique: index.unique,
                      multiEntry: index.multiEntry,
                    });
                  } catch (indexError) {
                    console.warn(`Failed to read index ${indexName}:`, indexError);
                  }
                }
              }
              
              stores.push({
                name: storeName,
                keyPath: store.keyPath || null,
                autoIncrement: store.autoIncrement || false,
                indexes,
              });
            } catch (storeError) {
              console.warn(`Failed to read store ${storeName}:`, storeError);
            }
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
        // Get the database version
        const allDatabases = await indexedDB.databases();
        const dbInfo = allDatabases.find((db) => db.name === databaseName);
        
        if (!dbInfo) {
          return { error: `Database ${databaseName} not found` };
        }
        
        // Open database - use current version automatically
        let db;
        try {
          db = await openDatabaseWithVersion(databaseName, undefined);
        } catch (error) {
          return { error: `Failed to open database "${databaseName}": ${error.message}` };
        }
        
        // Validate that the store exists
        if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
          const availableStores = db ? Array.from(db.objectStoreNames).join(', ') : 'none';
          db.close();
          return { error: `Object store "${storeName}" not found in database "${databaseName}". Available stores: ${availableStores}` };
        }
        
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
        // First, verify database exists
        const allDatabases = await indexedDB.databases();
        const dbInfo = allDatabases.find((db) => db.name === databaseName);
        
        if (!dbInfo) {
          return { error: `Database ${databaseName} not found` };
        }
        
        // Open database - use current version automatically
        let db;
        try {
          db = await openDatabaseWithVersion(databaseName, undefined);
        } catch (error) {
          return { error: `Failed to open database "${databaseName}": ${error.message}` };
        }
        
        // Validate that the store exists
        if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
          const availableStores = db ? Array.from(db.objectStoreNames).join(', ') : 'none';
          db.close();
          return { error: `Object store "${storeName}" not found in database "${databaseName}". Available stores: ${availableStores}` };
        }
        
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Check if store uses inline keys (keyPath)
        const keyPath = store.keyPath;
        
        if (keyPath) {
          // Store uses inline keys - key must be part of the value object
          // Ensure the key is in the value object
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Get existing value at keyPath to determine type
            const existingValue = value[keyPath];
            let finalKey = key;
            
            // If value object already has the keyPath, prefer that (for editing scenarios)
            if (existingValue !== undefined) {
              // Use the existing value's type, but allow key parameter to override
              if (key !== undefined && key !== null) {
                // Key parameter provided - use it but match the type
                if (typeof existingValue === 'number') {
                  if (typeof key === 'string') {
                    const numKey = Number(key);
                    finalKey = (!isNaN(numKey) && isFinite(numKey)) ? numKey : existingValue;
                  } else {
                    finalKey = key;
                  }
                } else if (typeof existingValue === 'string') {
                  finalKey = String(key);
                } else {
                  finalKey = key;
                }
              } else {
                // No key parameter - use existing value
                finalKey = existingValue;
              }
            } else {
              // No existing value, use key parameter and infer type
              if (typeof key === 'string') {
                const trimmedKey = key.trim();
                const numKey = Number(trimmedKey);
                if (!isNaN(numKey) && isFinite(numKey) && trimmedKey === String(numKey)) {
                  finalKey = numKey;
                }
              }
            }
            
            // Ensure the keyPath field is set
            value[keyPath] = finalKey;
          } else {
            return { error: 'Value must be an object when store uses inline keys' };
          }
          // Don't pass key as second parameter
          await promisifyRequest(store.put(value));
        } else {
          // Store uses out-of-line keys - pass key as second parameter
          // Ensure key type is correct (number if it's a number string)
          let finalKey = key;
          if (typeof key === 'string') {
            const trimmedKey = key.trim();
            const numKey = Number(trimmedKey);
            if (!isNaN(numKey) && isFinite(numKey) && trimmedKey === String(numKey)) {
              finalKey = numKey;
            }
          }
          await promisifyRequest(store.put(value, finalKey));
        }
        
        db.close();
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    },

    DELETE_INDEXEDDB_RECORD: async ({ databaseName, storeName, key }) => {
      try {
        // Verify database exists
        const allDatabases = await indexedDB.databases();
        const dbInfo = allDatabases.find((db) => db.name === databaseName);
        
        if (!dbInfo) {
          return { error: `Database ${databaseName} not found` };
        }
        
        // Open database - use current version automatically
        const db = await openDatabaseWithVersion(databaseName, undefined);
        
        // Validate that the store exists
        if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
          const availableStores = db ? Array.from(db.objectStoreNames).join(', ') : 'none';
          db.close();
          return { error: `Object store "${storeName}" not found in database "${databaseName}". Available stores: ${availableStores}` };
        }
        
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
        // Verify database exists
        const allDatabases = await indexedDB.databases();
        const dbInfo = allDatabases.find((db) => db.name === databaseName);
        
        if (!dbInfo) {
          return { error: `Database ${databaseName} not found` };
        }
        
        // Open database - use current version automatically
        const db = await openDatabaseWithVersion(databaseName, undefined);
        
        // Validate that the store exists
        if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
          const availableStores = db ? Array.from(db.objectStoreNames).join(', ') : 'none';
          db.close();
          return { error: `Object store "${storeName}" not found in database "${databaseName}". Available stores: ${availableStores}` };
        }
        
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
      request.onerror = () => reject(request.error || new Error('Failed to open database'));
      request.onupgradeneeded = () => {
        // Database upgrade needed, but we'll resolve after success
        // This prevents blocking if version changes
      };
      request.onblocked = () => {
        // Database is blocked, but we'll still try to resolve
        console.warn('Database open blocked, but continuing...');
      };
    });
  }

  function openDatabaseWithVersion(name, version) {
    return new Promise((resolve, reject) => {
      // First, try to open without version to get the current version
      // This handles cases where the version might have changed
      const request = version !== undefined && version !== null 
        ? indexedDB.open(name, version)
        : indexedDB.open(name);
      
      let upgradeCompleted = false;
      
      request.onsuccess = () => {
        const db = request.result;
        // Ensure database is ready by checking objectStoreNames
        if (db && db.objectStoreNames) {
          resolve(db);
        } else {
          // If objectStoreNames is not available, wait a bit and retry
          setTimeout(() => {
            if (request.result && request.result.objectStoreNames) {
              resolve(request.result);
            } else {
              reject(new Error('Database opened but object stores not available'));
            }
          }, 100);
        }
      };
      
      request.onerror = () => {
        reject(request.error || new Error('Failed to open database'));
      };
      
      request.onupgradeneeded = (event) => {
        // Mark that upgrade is happening
        upgradeCompleted = false;
        // Don't resolve/reject here - wait for onsuccess
      };
      
      request.onblocked = () => {
        console.warn('Database open blocked, but continuing...');
      };
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
