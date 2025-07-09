// Cache version for development - increments on each reload
let CACHE_VERSION = Date.now();

// Function to clear all caches
export function clearAllCaches() {
  if ('caches' in window) {
    return caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
  return Promise.resolve();
}

// Function to unregister service worker
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.getRegistrations().then(registrations => {
      return Promise.all(
        registrations.map(registration => {
          console.log('Unregistering service worker');
          return registration.unregister();
        })
      );
    });
  }
  return Promise.resolve();
}

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js?v=${CACHE_VERSION}`;

      // In development mode, clear caches and unregister old service workers
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Clearing caches and unregistering service workers');
        Promise.all([
          clearAllCaches(),
          unregisterServiceWorker()
        ]).then(() => {
          registerServiceWorker(swUrl);
        });
      } else {
        registerServiceWorker(swUrl);
      }
    });
  }
}

function registerServiceWorker(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // onupdatefound will be called if a new service worker is found
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log(
                'New content is available and will be used when all ' +
                  'tabs for this page are closed.'
              );
              
              // In development, force reload to get latest content
              if (process.env.NODE_ENV === 'development') {
                console.log('Development mode: Reloading to get latest content');
                window.location.reload();
              }
            } else {
              // At this point, everything has been precached.
              console.log('Content is cached for offline use.');
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Development helper functions
export const devHelpers = {
  // Force clear all caches and reload
  forceRefresh: () => {
    if (process.env.NODE_ENV === 'development') {
      clearAllCaches().then(() => {
        unregisterServiceWorker().then(() => {
          window.location.reload();
        });
      });
    }
  },
  
  // Clear caches without reload
  clearCaches: () => {
    if (process.env.NODE_ENV === 'development') {
      clearAllCaches().then(() => {
        console.log('All caches cleared');
      });
    }
  },
  
  // Unregister service worker
  unregisterSW: () => {
    if (process.env.NODE_ENV === 'development') {
      unregisterServiceWorker().then(() => {
        console.log('Service worker unregistered');
      });
    }
  }
};

// Make dev helpers available globally in development
if (process.env.NODE_ENV === 'development') {
  window.devHelpers = devHelpers;
  console.log('Development helpers available: window.devHelpers');
  console.log('Use window.devHelpers.forceRefresh() to clear cache and reload');
} 