import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import CookiesView from './views/CookiesView';
import LocalStorageView from './views/LocalStorageView';
import SessionStorageView from './views/SessionStorageView';
import IndexedDBView from './views/IndexedDBView';
import CacheStorageView from './views/CacheStorageView';
import { AttachProvider } from './contexts/AttachContext';

function App() {
  const [currentView, setCurrentView] = useState('cookies');

  const views = {
    cookies: <CookiesView />,
    local: <LocalStorageView />,
    session: <SessionStorageView />,
    indexeddb: <IndexedDBView />,
    cache: <CacheStorageView />,
  };

  return (
    <ThemeProvider>
      <AttachProvider>
        <Layout currentView={currentView} setCurrentView={setCurrentView}>
          {views[currentView]}
        </Layout>
      </AttachProvider>
    </ThemeProvider>
  );
}

export default App;
