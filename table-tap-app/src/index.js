import React from 'react';
import ReactDOM from 'react-dom/client';

// Suppress console.log/debug in production to avoid leaking internals
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
}

// GLOBAL: Silence AbortError popups in development.
// These are harmless cancellations during re-renders/navigation but cause intrusive overlays.
//
// Both listeners use `capture: true` so they run BEFORE the CRA react-error-overlay
// listener. Without the capture phase, the overlay grabs the event first and shows
// the popup regardless of preventDefault() / stopImmediatePropagation().
if (typeof window !== 'undefined') {
  const isAbortError = (reason) => {
    if (!reason) return false;
    if (reason.name === 'AbortError') return true;
    if (reason.code === 20 /* DOMException.ABORT_ERR */) return true;
    const msg = reason.message || String(reason);
    return (
      msg.includes('aborted') ||
      msg.includes('The operation was aborted') ||
      msg.includes('signal is aborted') ||
      msg.includes('without reason') ||
      msg.includes('AbortError')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isAbortError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true); // capture phase

  window.addEventListener('error', (event) => {
    if (isAbortError(event.error)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true); // capture phase
}
import './index.css';
// Ensure Supabase is in main bundle so lazy chunks (e.g. admin dashboard) never see undefined
import './modules/shared/supabase';
import App from './App';
import 'react-alice-carousel/lib/alice-carousel.css';
import { BrowserRouter } from 'react-router-dom';
// Initialize Sentry for error tracking
import initSentry from './sentry';
import reportWebVitals from './reportWebVitals';
initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
