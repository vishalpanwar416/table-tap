// Cache version for development - increments on each reload
let CACHE_VERSION = Date.now();

// Function to clear all caches
export function clearAllCaches() {
  if ('caches' in window) {
    return caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
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
      // Always register the service worker, no dev-only logic
      registerServiceWorker(swUrl);
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
              
            } else {
              // At this point, everything has been precached.
            }
          }
        };
      };
    })
    .catch((error) => {
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
      });
  }
} 