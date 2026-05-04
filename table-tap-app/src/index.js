import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Ensure Supabase is in main bundle so lazy chunks (e.g. admin dashboard) never see undefined
import './modules/shared/supabase';
import App from './App';
import 'react-alice-carousel/lib/alice-carousel.css';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

// Initialize Sentry for error tracking
import initSentry from './sentry';

// GLOBAL: Silence AbortError popups in development.
// These are harmless cancellations during re-renders/navigation but cause intrusive overlays.
if (typeof window !== 'undefined') {
  const isAbortError = (reason) => {
    if (!reason) return false;
    if (reason.name === 'AbortError') return true;
    const msg = reason.message || '';
    return (
      msg.includes('aborted') ||
      msg.includes('The operation was aborted') ||
      msg.includes('signal is aborted') ||
      msg.includes('without reason')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isAbortError(event.reason)) {
      event.preventDefault(); // Silently suppress — these are harmless fetch cancellations
    }
  });

  window.addEventListener('error', (event) => {
    if (isAbortError(event.error)) {
      event.preventDefault();
    }
  });
}
initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
