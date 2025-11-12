import React, { useState, useEffect } from 'react';
import JSONEditor from './JSONEditor';

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

  const pageSize = 50;

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [databaseName, store.name, page]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await sendMessageToAgent({
        type: 'GET_INDEXEDDB_RECORDS',
        payload: {
          databaseName,
          storeName: store.name,
          page,
          pageSize,
        },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setRecords(response.records || []);
      setTotal(response.total || 0);
      setHasMore(response.hasMore || false);
    } catch (error) {
      console.error('Failed to load records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord('__NEW__');
    setNewKey('');
    setNewValue('');
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setNewKey(record.key);
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

      const response = await sendMessageToAgent({
        type: 'SET_INDEXEDDB_RECORD',
        payload: {
          databaseName,
          storeName: store.name,
          key: newKey,
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

        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {editingRecord && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {editingRecord === '__NEW__' ? 'Add Record' : 'Edit Record'}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key {editingRecord !== '__NEW__' && '(read-only)'}
              </label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                disabled={editingRecord !== '__NEW__'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Value (JSON)
              </label>
              <JSONEditor value={newValue} onChange={setNewValue} />
            </div>
            <div className="flex justify-end gap-3">
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
        </div>
      )}

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
