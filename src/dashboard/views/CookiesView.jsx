import React, { useState, useEffect } from 'react';
import { useAttach } from '../contexts/AttachContext';
import CookieTable from '../components/CookieTable';
import CookieForm from '../components/CookieForm';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

export default function CookiesView() {
  const { attachedTab, isAttached } = useAttach();
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCookie, setEditingCookie] = useState(null);
  const [maskValues, setMaskValues] = useState(true);

  useEffect(() => {
    if (isAttached && attachedTab?.origin) {
      loadCookies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAttached, attachedTab?.origin]); // Only depend on origin, not entire object

  const loadCookies = async () => {
    if (!attachedTab?.origin) return;
    setLoading(true);
    try {
      const response = await sendMessage({
        type: 'GET_COOKIES',
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setCookies(response.cookies || []);
    } catch (error) {
      console.error('Failed to load cookies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCookie(null);
    setShowForm(true);
  };

  const handleEdit = (cookie) => {
    setEditingCookie(cookie);
    setShowForm(true);
  };

  const handleDelete = async (cookie) => {
    if (!confirm(`Delete cookie "${cookie.name}"?`)) return;
    try {
      const response = await sendMessage({
        type: 'REMOVE_COOKIE',
        payload: { name: cookie.name },
      });
      if (response.error) {
        throw new Error(response.error);
      }
      await loadCookies();
    } catch (error) {
      alert(`Failed to delete cookie: ${error.message}`);
    }
  };

  const handleSave = async (cookieData) => {
    try {
      const response = await sendMessage({
        type: 'SET_COOKIE',
        payload: cookieData,
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setShowForm(false);
      setEditingCookie(null);
      await loadCookies();
    } catch (error) {
      alert(`Failed to save cookie: ${error.message}`);
    }
  };

  if (!isAttached) {
    return (
      <EmptyState
        icon="🍪"
        title="Not Attached"
        message="Attach to a tab to view and edit cookies"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cookies</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage cookies for {attachedTab?.origin}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={maskValues}
              onChange={(e) => setMaskValues(e.target.checked)}
              className="rounded"
            />
            Mask Values
          </label>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
          >
            + Add Cookie
          </button>
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCookie(null);
        }}
        title={editingCookie ? 'Edit Cookie' : 'Add Cookie'}
      >
        <CookieForm
          cookie={editingCookie}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCookie(null);
          }}
          defaultUrl={attachedTab?.origin}
        />
      </Modal>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading cookies...</div>
      ) : cookies.length === 0 ? (
        <EmptyState icon="🍪" title="No Cookies" message="No cookies found for this origin" />
      ) : (
        <CookieTable
          cookies={cookies}
          onEdit={handleEdit}
          onDelete={handleDelete}
          maskValues={maskValues}
        />
      )}
    </div>
  );
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}
