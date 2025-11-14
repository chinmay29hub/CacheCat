import React, { useState, useEffect } from 'react';
import IndexedDBRecords from './IndexedDBRecords';

export default function IndexedDBExplorer({
  databases,
  selectedDb,
  selectedStore,
  onSelectDb,
  onSelectStore,
  onRefresh,
}) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDb) {
      // Clear selected store when database changes
      onSelectStore(null);
      loadStores();
    } else {
      setStores([]);
      onSelectStore(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDb]);

  const loadStores = async () => {
    if (!selectedDb) return;
    setLoading(true);
    try {
      const response = await sendMessageToAgent({
        type: 'GET_INDEXEDDB_OBJECT_STORES',
        payload: { databaseName: selectedDb },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const loadedStores = response.stores || [];
      setStores(loadedStores);

      // Validate that the currently selected store exists in the loaded stores
      // If not, clear the selection (this handles database switches)
      if (selectedStore && !loadedStores.find((s) => s.name === selectedStore.name)) {
        onSelectStore(null);
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
      setStores([]);
      // Clear selected store on error
      onSelectStore(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Databases</h3>
          <ul className="space-y-1">
            {databases.map((db) => (
              <li key={db.name}>
                <button
                  onClick={() => onSelectDb(db.name)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedDb === db.name
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-mono">{db.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">v{db.version}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selectedDb && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Object Stores
            </h3>
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : stores.length === 0 ? (
              <div className="text-sm text-gray-500">No stores</div>
            ) : (
              <ul className="space-y-1">
                {stores.map((store) => (
                  <li key={store.name}>
                    <button
                      onClick={() => onSelectStore(store)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedStore?.name === store.name
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-mono">{store.name}</div>
                      {store.keyPath && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          key: {store.keyPath}
                        </div>
                      )}
                      {store.indexes.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {store.indexes.length} index{store.indexes.length !== 1 ? 'es' : ''}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="col-span-9">
        {selectedStore && selectedDb && stores.find((s) => s.name === selectedStore.name) ? (
          <IndexedDBRecords
            key={`${selectedDb}-${selectedStore.name}`}
            databaseName={selectedDb}
            store={selectedStore}
            onRefresh={onRefresh}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-4xl mb-4">🗄️</div>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedDb ? 'Select an object store to view records' : 'Select a database to begin'}
            </p>
          </div>
        )}
      </div>
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
