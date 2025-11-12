import React, { useState, useEffect } from 'react';
import { useAttach } from '../contexts/AttachContext';
import EmptyState from '../components/EmptyState';
import CacheExplorer from '../components/CacheExplorer';

export default function CacheStorageView() {
  const { attachedTab, isAttached } = useAttach();
  const [caches, setCaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCache, setSelectedCache] = useState(null);

  useEffect(() => {
    if (isAttached && attachedTab?.tabId) {
      loadCaches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAttached, attachedTab?.tabId]); // Only depend on tabId, not entire object

  const loadCaches = async () => {
    setLoading(true);
    try {
      const response = await sendMessageToAgent({
        type: 'GET_CACHE_STORAGE_NAMES',
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setCaches(response.names || []);
    } catch (error) {
      console.error('Failed to load caches:', error);
      setCaches([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAttached) {
    return (
      <EmptyState
        icon="⚡"
        title="Not Attached"
        message="Attach to a tab to view and edit cache storage"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cache Storage</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Origin-scoped caches for {attachedTab?.origin}
          </p>
        </div>
        <button
          onClick={loadCaches}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading caches...</div>
      ) : caches.length === 0 ? (
        <EmptyState icon="⚡" title="No Caches" message="No cache storage found" />
      ) : (
        <CacheExplorer
          caches={caches}
          selectedCache={selectedCache}
          onSelectCache={setSelectedCache}
          onRefresh={loadCaches}
        />
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
