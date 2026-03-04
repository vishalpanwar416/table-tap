import React from 'react';
import ReactDOM from 'react-dom/client';

// GLOBAL: Silence AbortError popups in development.
// These are harmless cancellations during re-renders/navigation but cause intrusive overlays.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const isAbort = reason?.name === 'AbortError' || reason?.message?.includes('aborted') || reason?.message?.includes('The operation was aborted');
    if (isAbort) {
      event.preventDefault(); // Silently suppress — these are harmless fetch cancellations
    }
  });
}
import './index.css';
// Ensure Supabase is in main bundle so lazy chunks (e.g. admin dashboard) never see undefined
import './modules/shared/supabase';
import App from './App';
import 'react-alice-carousel/lib/alice-carousel.css';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react"

// Initialize Sentry for error tracking
import initSentry from './sentry';
initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
