// Jest setup for CRA tests.
// Provide minimal browser-like globals so Supabase auth client and other
// modules don't crash during import in the test environment.

// Dummy env values so code paths that expect Supabase credentials still work.
process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder';

// Lightweight mock to avoid opening realtime/WebSocket handles during tests.
jest.mock('@supabase/supabase-js', () => {
  const builder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    eq: () => builder,
    order: () => builder,
    single: () => builder,
    then: (resolve) => resolve({ data: [], error: null }),
  };

  return {
    createClient: () => ({
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: (callback) => {
          callback?.('SIGNED_OUT', { session: null });
          return { data: { subscription: { unsubscribe: () => {} } }, error: null };
        },
      },
      from: () => builder,
      channel: () => ({
        on: () => ({
          subscribe: () => ({ unsubscribe: () => {} }),
        }),
      }),
    }),
  };
});

// Mock Vercel client-only analytics modules to avoid ESM/SSR issues in Jest.
jest.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}), { virtual: true });

jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}), { virtual: true });

// jsdom exposes document but some libs read visibilityState; provide a default.
if (typeof document !== 'undefined' && !document.visibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  });
}

// Guard against window.matchMedia absence when components call it.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {}, // deprecated but used by some libs
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
