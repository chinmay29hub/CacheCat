import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAttach } from '../contexts/AttachContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const navItems = [
  { id: 'cookies', label: 'Cookies', icon: '🍪' },
  { id: 'local', label: 'Local Storage', icon: '💾' },
  { id: 'session', label: 'Session Storage', icon: '📝' },
  { id: 'indexeddb', label: 'IndexedDB', icon: '🗄️' },
  { id: 'cache', label: 'Cache Storage', icon: '⚡' },
];

export default function Layout({ children, currentView, setCurrentView }) {
  const { theme, toggleTheme } = useTheme();
  const { attachedTab, isAttached, detachTab, refresh } = useAttach();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <TopBar
        attachedTab={attachedTab}
        isAttached={isAttached}
        detachTab={detachTab}
        refresh={refresh}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} items={navItems} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">{children}</main>
      </div>
    </div>
  );
}
