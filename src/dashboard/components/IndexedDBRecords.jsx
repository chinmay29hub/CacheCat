import React, { useState, useEffect, useRef } from 'react';
import JSONEditor from './JSONEditor';
import Modal from './Modal';

export default function IndexedDBRecords({ databaseName, store }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  
  // Track current database/store combination to prevent race conditions
  const currentLoadRef = useRef({ databaseName: null, storeName: null, page: null });

  const pageSize = 50;

  useEffect(() => {
    // Reset page when database or store changes
    setPage(0);
    setError(null);
    setRecords([]);
    setTotal(0);
    setHasMore(false);
    // Cancel any pending loads by updating the ref
    currentLoadRef.current = { databaseName: null, storeName: null, page: null };
  }, [databaseName, store?.name]);

  useEffect(() => {
    setError(null); // Clear error when store changes
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [databaseName, store?.name, page]);

  const loadRecords = async () => {
    if (!databaseName || !store?.name) {
      setError(null);
      setRecords([]);
      setTotal(0);
      setHasMore(false);
      return;
    }
    
    // Track this load request
    const loadId = { databaseName, storeName: store.name, page };
    currentLoadRef.current = loadId;
    
    setLoading(true);
    setError(null); // Clear error when starting a new load
    
    try {
      // First, verify the store exists in the database before attempting to load
      const storesResponse = await sendMessageToAgent({
        type: 'GET_INDEXEDDB_OBJECT_STORES',
        payload: { databaseName },
      });
      
      // Check if this is still the current load (prevent race conditions)
      if (
        currentLoadRef.current.databaseName !== loadId.databaseName ||
        currentLoadRef.current.storeName !== loadId.storeName ||
        currentLoadRef.current.page !== loadId.page
      ) {
        // This check is for an old request, ignore it
        return;
      }
      
      if (storesResponse.error) {
        throw new Error(storesResponse.error);
      }
      
      const availableStores = storesResponse.stores || [];
      const storeExists = availableStores.find((s) => s.name === store.name);
      
      if (!storeExists) {
        // Store doesn't exist - this shouldn't happen if validation is correct, but handle it gracefully
        const storeNames = availableStores.map((s) => s.name).join(', ');
        throw new Error(`Object store "${store.name}" not found in database "${databaseName}". Available stores: ${storeNames || 'none'}`);
      }
      
      // Store exists, proceed with loading records
      const response = await sendMessageToAgent({
        type: 'GET_INDEXEDDB_RECORDS',
        payload: {
          databaseName,
          storeName: store.name,
          page,
          pageSize,
        },
      });
      
      // Check if this is still the current load (prevent race conditions)
      if (
        currentLoadRef.current.databaseName !== loadId.databaseName ||
        currentLoadRef.current.storeName !== loadId.storeName ||
        currentLoadRef.current.page !== loadId.page
      ) {
        // This response is for an old request, ignore it
        return;
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      setRecords(response.records || []);
      setTotal(response.total || 0);
      setHasMore(response.hasMore || false);
      setError(null); // Clear any previous errors
    } catch (error) {
      // Check if this is still the current load before doing anything
      const isCurrentLoad = 
        currentLoadRef.current.databaseName === loadId.databaseName &&
        currentLoadRef.current.storeName === loadId.storeName &&
        currentLoadRef.current.page === loadId.page;
      
      if (!isCurrentLoad) {
        // This error is for an old request, silently ignore it (don't log or show error)
        return;
      }
      
      // Only handle errors for the current load
      // Suppress "not found" errors - these are likely race conditions from rapid database switching
      const isNotFoundError = error.message && error.message.includes('not found');
      if (isNotFoundError) {
        // Silently handle - component will be unmounted/remounted with correct props
        setRecords([]);
        setTotal(0);
        setHasMore(false);
        setError(null);
        setLoading(false);
        return;
      }
      
      // Only log non-race-condition errors
      console.error('Failed to load records:', error);
      setRecords([]);
      setTotal(0);
      setHasMore(false);
      setError(`Failed to load records: ${error.message}`);
    } finally {
      // Only update loading state if this is still the current load
      if (
        currentLoadRef.current.databaseName === loadId.databaseName &&
        currentLoadRef.current.storeName === loadId.storeName &&
        currentLoadRef.current.page === loadId.page
      ) {
        setLoading(false);
      }
    }
  };

  const handleAdd = () => {
    setEditingRecord('__NEW__');
    setNewKey('');
    setNewValue('');
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    // Convert key to string for the input field
    setNewKey(String(record.key));
    setNewValue(JSON.stringify(record.value, null, 2));
  };

  const handleSave = async () => {
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }

      // For stores with inline keys (keyPath), use the key from the value object
      // For stores without inline keys, use the key from the form field
      let parsedKey = newKey;
      
      if (store.keyPath) {
        // Store uses inline keys - extract key from value object
        if (typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)) {
          parsedKey = parsedValue[store.keyPath];
          if (parsedKey === undefined) {
            // If keyPath doesn't exist in value, fall back to form field key
            const keyStr = String(newKey || '').trim();
            if (keyStr !== '') {
              const numKey = Number(keyStr);
              parsedKey = (!isNaN(numKey) && isFinite(numKey) && keyStr === String(numKey)) ? numKey : keyStr;
            }
          }
        }
      } else {
        // Store uses out-of-line keys - parse key from form field
        const keyStr = String(newKey || '').trim();
        if (keyStr !== '') {
          const numKey = Number(keyStr);
          parsedKey = (!isNaN(numKey) && isFinite(numKey) && keyStr === String(numKey)) ? numKey : keyStr;
        }
      }

      // If editing and key changed, we need to delete the old record first
      // This applies to both inline keys (keyPath) and out-of-line keys
      if (editingRecord !== '__NEW__' && editingRecord) {
        const oldKey = editingRecord.key;
        // Compare keys (handle type differences)
        const oldKeyStr = String(oldKey);
        const newKeyStr = String(parsedKey);
        if (oldKeyStr !== newKeyStr && oldKey !== parsedKey) {
          // Key changed - delete old record first
          try {
            await sendMessageToAgent({
              type: 'DELETE_INDEXEDDB_RECORD',
              payload: {
                databaseName,
                storeName: store.name,
                key: oldKey,
              },
            });
          } catch (error) {
            console.warn('Failed to delete old record:', error);
          }
        }
      }

      const response = await sendMessageToAgent({
        type: 'SET_INDEXEDDB_RECORD',
        payload: {
          databaseName,
          storeName: store.name,
          key: parsedKey,
          value: parsedValue,
        },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setEditingRecord(null);
      await loadRecords();
    } catch (error) {
      alert(`Failed to save record: ${error.message}`);
    }
  };

  const handleDelete = async (record) => {
    if (!confirm(`Delete record with key "${record.key}"?`)) return;
    try {
      const response = await sendMessageToAgent({
        type: 'DELETE_INDEXEDDB_RECORD',
        payload: {
          databaseName,
          storeName: store.name,
          key: record.key,
        },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadRecords();
    } catch (error) {
      alert(`Failed to delete record: ${error.message}`);
    }
  };

  const handleClear = async () => {
    if (!confirm(`Clear all records in "${store.name}"? This cannot be undone.`)) return;
    try {
      const response = await sendMessageToAgent({
        type: 'CLEAR_INDEXEDDB_STORE',
        payload: {
          databaseName,
          storeName: store.name,
        },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadRecords();
    } catch (error) {
      alert(`Failed to clear store: ${error.message}`);
    }
  };

  const handleExport = () => {
    const data = records.map((r) => ({ key: r.key, value: r.value }));
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indexeddb-${databaseName}-${store.name}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = records.filter((record) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const keyStr = String(record.key).toLowerCase();
    const valueStr = JSON.stringify(record.value).toLowerCase();
    return keyStr.includes(search) || valueStr.includes(search);
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{store.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} record{total !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors font-medium text-sm"
            >
              Export
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors font-medium text-sm"
            >
              Clear Store
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium text-sm"
            >
              + Add Record
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-start gap-3">
              <span className="text-amber-600 dark:text-amber-400 text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                  Store Not Found
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {error}
                </p>
                <button
                  onClick={() => {
                    setError(null);
                    loadRecords();
                  }}
                  className="mt-2 text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <Modal
        isOpen={!!editingRecord}
        onClose={() => {
          setEditingRecord(null);
          setNewKey('');
          setNewValue('');
        }}
        title={editingRecord === '__NEW__' ? 'Add Record' : 'Edit Record'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {store.keyPath 
                ? `Key (${store.keyPath} field)` 
                : 'Key'}
              {editingRecord !== '__NEW__' && store.keyPath && ' (read-only)'}
              {store.keyPath && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (inline key - will set {store.keyPath} in value object)
                </span>
              )}
              {!store.keyPath && editingRecord !== '__NEW__' && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (editable - changing key will create new record)
                </span>
              )}
            </label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              disabled={editingRecord !== '__NEW__' && store.keyPath}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              placeholder={store.keyPath ? `Enter ${store.keyPath} value` : 'Enter key'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value (JSON)
            </label>
            <JSONEditor value={newValue} onChange={setNewValue} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setEditingRecord(null);
                setNewKey('');
                setNewValue('');
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading records...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No records match your search' : 'No records found'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record, idx) => (
                  <tr
                    key={`${record.key}-${idx}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">
                      {String(record.key)}
                    </td>
                    <td className="px-4 py-3">
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto max-w-2xl">
                        {JSON.stringify(record.value, null, 2)}
                      </pre>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(record)}
                          className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {page + 1} • Showing {records.length} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function sendMessageToAgent(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
      } else {
        resolve(response || {});
      }
    });
  });
}
