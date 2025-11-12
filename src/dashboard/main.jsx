import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Set favicon for dashboard tab
const setFavicon = () => {
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'shortcut icon';
  link.href = chrome.runtime.getURL('icons/icon16.png');
  document.getElementsByTagName('head')[0].appendChild(link);
};

setFavicon();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
