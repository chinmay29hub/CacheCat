import React, { useState, useEffect } from 'react';
import { useAttach } from '../contexts/AttachContext';
import EmptyState from '../components/EmptyState';
import IndexedDBExplorer from '../components/IndexedDBExplorer';

export default function IndexedDBView() {
  const { attachedTab, isAttached } = useAttach();
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDb, setSelectedDb] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    if (isAttached && attachedTab?.tabId) {
      loadDatabases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAttached, attachedTab?.tabId]); // Only depend on tabId, not entire object

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const response = await sendMessageToAgent({
        type: 'GET_INDEXEDDB_DATABASES',
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setDatabases(response.databases || []);
    } catch (error) {
      console.error('Failed to load databases:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAttached) {
    return (
      <EmptyState
        icon="🗄️"
        title="Not Attached"
        message="Attach to a tab to view and edit IndexedDB"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">IndexedDB</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Origin-scoped databases for {attachedTab?.origin}
          </p>
        </div>
        <button
          onClick={loadDatabases}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading databases...</div>
      ) : databases.length === 0 ? (
        <EmptyState icon="🗄️" title="No Databases" message="No IndexedDB databases found" />
      ) : (
        <IndexedDBExplorer
          databases={databases}
          selectedDb={selectedDb}
          selectedStore={selectedStore}
          onSelectDb={setSelectedDb}
          onSelectStore={setSelectedStore}
          onRefresh={loadDatabases}
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
