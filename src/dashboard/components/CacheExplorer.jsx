import React from 'react';
import CacheEntries from './CacheEntries';

export default function CacheExplorer({ caches, selectedCache, onSelectCache, onRefresh }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Caches</h3>
          {caches.length === 0 ? (
            <div className="text-sm text-gray-500">No caches</div>
          ) : (
            <ul className="space-y-1">
              {caches.map((cacheName) => (
                <li key={cacheName}>
                  <button
                    onClick={() => onSelectCache(cacheName)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCache === cacheName
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-mono truncate">{cacheName}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="col-span-9">
        {selectedCache ? (
          <CacheEntries cacheName={selectedCache} onRefresh={onRefresh} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <p className="text-gray-500 dark:text-gray-400">Select a cache to view entries</p>
          </div>
        )}
      </div>
    </div>
  );
}
