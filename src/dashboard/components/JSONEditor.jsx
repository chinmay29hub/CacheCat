import React, { useState, useEffect } from 'react';

export default function JSONEditor({ value, onChange }) {
  const [isJSON, setIsJSON] = useState(false);
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    try {
      JSON.parse(value);
      setIsJSON(true);
      setJsonError(null);
    } catch {
      setIsJSON(false);
      if (value.trim()) {
        try {
          JSON.parse(value);
        } catch (e) {
          setJsonError(e.message);
        }
      } else {
        setJsonError(null);
      }
    }
  }, [value]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm min-h-[120px]"
        placeholder="Enter value..."
      />
      {isJSON && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 dark:text-green-400">✓ Valid JSON</span>
          <button
            onClick={handleFormat}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Format
          </button>
        </div>
      )}
      {jsonError && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          Not valid JSON (plain strings are also allowed)
        </div>
      )}
    </div>
  );
}
