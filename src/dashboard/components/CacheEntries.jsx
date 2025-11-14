import React, { useState, useEffect } from 'react';

export default function CacheEntries({ cacheName, onRefresh }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const pageSize = 50;

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheName, page]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const response = await sendMessageToAgent({
        type: 'GET_CACHE_STORAGE_ENTRIES',
        payload: {
          cacheName,
          page,
          pageSize,
        },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setEntries(response.entries || []);
      setTotal(response.total || 0);
      setHasMore(response.hasMore || false);
    } catch (error) {
      console.error('Failed to load entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (requestUrl) => {
    if (!confirm(`Delete cache entry for "${requestUrl}"?`)) return;
    try {
      const response = await sendMessageToAgent({
        type: 'DELETE_CACHE_STORAGE_ENTRY',
        payload: { cacheName, requestUrl },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadEntries();
    } catch (error) {
      alert(`Failed to delete entry: ${error.message}`);
    }
  };

  const handleDeleteCache = async () => {
    if (!confirm(`Delete entire cache "${cacheName}"? This cannot be undone.`)) return;
    try {
      const response = await sendMessageToAgent({
        type: 'DELETE_CACHE_STORAGE',
        payload: { cacheName },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      onRefresh();
    } catch (error) {
      alert(`Failed to delete cache: ${error.message}`);
    }
  };

  const handleRefetch = async (requestUrl) => {
    try {
      const response = await sendMessageToAgent({
        type: 'REFETCH_CACHE_STORAGE_ENTRY',
        payload: { cacheName, requestUrl },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadEntries();
    } catch (error) {
      alert(`Failed to refetch entry: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cacheName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} entr{total !== 1 ? 'ies' : 'y'} total
            </p>
          </div>
          <button
            onClick={handleDeleteCache}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors font-medium text-sm"
          >
            Delete Cache
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading entries...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-500 dark:text-gray-400">No entries found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Request URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry, idx) => (
                  <tr
                    key={`${entry.request.url}-${idx}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <button
                          onClick={() => setSelectedEntry(selectedEntry === idx ? null : idx)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono truncate block"
                        >
                          {entry.request.url}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {entry.request.method}
                    </td>
                    <td className="px-4 py-3">
                      {entry.response ? (
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            entry.response.status >= 200 && entry.response.status < 300
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : entry.response.status >= 400
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}
                        >
                          {entry.response.status} {entry.response.statusText}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-500">
                      {entry.response?.type || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRefetch(entry.request.url)}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded transition-colors"
                          title="Refetch"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleDelete(entry.request.url)}
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
          {selectedEntry !== null && entries[selectedEntry] && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Request
                  </h4>
                  <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded overflow-x-auto">
                    {JSON.stringify(entries[selectedEntry].request, null, 2)}
                  </pre>
                </div>
                {entries[selectedEntry].response && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Response
                    </h4>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Status: {entries[selectedEntry].response.status}{' '}
                        {entries[selectedEntry].response.statusText}
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Headers
                        </h5>
                        <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded overflow-x-auto">
                          {JSON.stringify(entries[selectedEntry].response.headers, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Body
                        </h5>
                        <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded overflow-x-auto max-h-64">
                          {typeof entries[selectedEntry].response.body === 'object'
                            ? JSON.stringify(entries[selectedEntry].response.body, null, 2)
                            : String(entries[selectedEntry].response.body)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {page + 1} • Showing {entries.length} of {total}
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
