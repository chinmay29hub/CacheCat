import React, { useState, useEffect } from 'react';
import { useAttach } from '../contexts/AttachContext';
import StorageTable from '../components/StorageTable';
import EmptyState from '../components/EmptyState';

export default function SessionStorageView() {
  const { attachedTab, isAttached } = useAttach();
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAttached && attachedTab?.tabId) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAttached, attachedTab?.tabId]); // Only depend on tabId, not entire object

  const loadItems = async () => {
    if (!attachedTab?.tabId) return;
    setLoading(true);
    try {
      const response = await sendMessageToAgent({
        type: 'GET_SESSION_STORAGE',
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setItems(response.items || {});
    } catch (error) {
      console.error('Failed to load session storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSet = async (key, value) => {
    try {
      const response = await sendMessageToAgent({
        type: 'SET_SESSION_STORAGE',
        payload: { key, value },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadItems();
    } catch (error) {
      alert(`Failed to set item: ${error.message}`);
    }
  };

  const handleDelete = async (key) => {
    if (!confirm(`Delete "${key}"?`)) return;
    try {
      const response = await sendMessageToAgent({
        type: 'REMOVE_SESSION_STORAGE',
        payload: { key },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadItems();
    } catch (error) {
      alert(`Failed to delete item: ${error.message}`);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all session storage items? This cannot be undone.')) return;
    try {
      const response = await sendMessageToAgent({
        type: 'CLEAR_SESSION_STORAGE',
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadItems();
    } catch (error) {
      alert(`Failed to clear storage: ${error.message}`);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessionStorage-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (typeof data !== 'object') {
          throw new Error('Invalid JSON format');
        }
        if (
          !confirm(`Import ${Object.keys(data).length} items? This will overwrite existing keys.`)
        ) {
          return;
        }
        for (const [key, value] of Object.entries(data)) {
          await handleSet(key, String(value));
        }
        await loadItems();
      } catch (error) {
        alert(`Failed to import: ${error.message}`);
      }
    };
    input.click();
  };

  const filteredItems = Object.entries(items).filter(([key]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAttached) {
    return (
      <EmptyState
        icon="📝"
        title="Not Attached"
        message="Attach to a tab to view and edit session storage"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Storage</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tab-scoped storage (this tab only) for {attachedTab?.origin}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors font-medium"
          >
            Export JSON
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors font-medium"
          >
            Import JSON
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search keys..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="📝"
          title={searchTerm ? 'No Matches' : 'No Items'}
          message={searchTerm ? 'No items match your search' : 'Session storage is empty'}
        />
      ) : (
        <StorageTable
          items={filteredItems}
          onSet={handleSet}
          onDelete={handleDelete}
          storageType="session"
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
