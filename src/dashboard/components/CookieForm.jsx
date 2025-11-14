import React, { useState, useEffect } from 'react';

export default function CookieForm({ cookie, onSave, onCancel, defaultUrl }) {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    domain: '',
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: 'unspecified',
    expirationDate: null,
  });

  useEffect(() => {
    if (cookie) {
      setFormData({
        name: cookie.name || '',
        value: cookie.value || '',
        domain: cookie.domain || '',
        path: cookie.path || '/',
        secure: cookie.secure || false,
        httpOnly: cookie.httpOnly || false,
        sameSite: cookie.sameSite || 'unspecified',
        expirationDate: cookie.expirationDate || null,
      });
    } else if (defaultUrl) {
      try {
        const url = new URL(defaultUrl);
        setFormData((prev) => ({ ...prev, domain: url.hostname }));
      } catch (e) {
        // Ignore
      }
    }
  }, [cookie, defaultUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.expirationDate) {
      delete data.expirationDate;
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Value
          </label>
          <input
            type="text"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Domain *
          </label>
          <input
            type="text"
            required
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Path
          </label>
          <input
            type="text"
            value={formData.path}
            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          SameSite
        </label>
        <select
          value={formData.sameSite}
          onChange={(e) => setFormData({ ...formData, sameSite: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="unspecified">Unspecified</option>
          <option value="no_restriction">No Restriction</option>
          <option value="lax">Lax</option>
          <option value="strict">Strict</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={formData.secure}
            onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
            className="rounded"
          />
          Secure
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={formData.httpOnly}
            onChange={(e) => setFormData({ ...formData, httpOnly: e.target.checked })}
            className="rounded"
          />
          HttpOnly
        </label>
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
        >
          Save
        </button>
      </div>
    </form>
  );
}
