import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// PWA Service Worker Registration
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('PWA ServiceWorker registration skipped or failed:', err);
    });
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}
