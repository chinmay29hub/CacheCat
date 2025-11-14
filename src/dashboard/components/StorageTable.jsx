import React, { useState } from 'react';
import JSONEditor from './JSONEditor';
import Modal from './Modal';

export default function StorageTable({ items, onSet, onDelete }) {
  const [editingKey, setEditingKey] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    setEditingKey('__NEW__');
    setNewKey('');
    setNewValue('');
  };

  const handleSave = async () => {
    if (!newKey.trim()) {
      alert('Key cannot be empty');
      return;
    }
    await onSet(newKey, newValue);
    setEditingKey(null);
    setNewKey('');
    setNewValue('');
  };

  const handleEdit = (key, value) => {
    setEditingKey(key);
    setNewKey(key);
    setNewValue(value);
  };

  const isJSON = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
        >
          + Add Item
        </button>
      </div>

      <Modal
        isOpen={!!editingKey}
        onClose={() => {
          setEditingKey(null);
          setNewKey('');
          setNewValue('');
        }}
        title={editingKey === '__NEW__' ? 'Add Item' : 'Edit Item'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key {editingKey !== '__NEW__' && '(read-only)'}
            </label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              disabled={editingKey !== '__NEW__'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value {isJSON(newValue) && <span className="text-xs text-green-600">(JSON)</span>}
              {!isJSON(newValue) && newValue.trim() && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (plain string)
                </span>
              )}
            </label>
            <JSONEditor value={newValue} onChange={setNewValue} />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter a JSON object/array or a plain string value
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setEditingKey(null);
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
            {items.map(([key, value]) => (
              <tr
                key={key}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">
                  {key}
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-2xl">
                    {isJSON(value) ? (
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(JSON.parse(value), null, 2)}
                      </pre>
                    ) : (
                      <span className="text-sm text-gray-700 dark:text-gray-300 break-all">
                        {value}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(key, value)}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(key)}
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
    </div>
  );
}
