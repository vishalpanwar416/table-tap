import React from 'react';
import ReactDOM from 'react-dom/client';
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
