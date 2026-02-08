const DB_NAME = 'TableTapDB';
const DB_VERSION = 1;
const STORES = {
    ORDERS: 'orders',
    PENDING_UPDATES: 'pending_updates'
};

// Initialize DB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject('IndexedDB error: ' + event.target.error);

        request.onsuccess = (event) => resolve(event.target.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORES.ORDERS)) {
                db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.PENDING_UPDATES)) {
                db.createObjectStore(STORES.PENDING_UPDATES, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

export const offlineStorage = {
    // Save all orders (bulk overwrite for simplicity/cache freshness)
    saveOrders: async (orders) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORES.ORDERS], 'readwrite');
            const store = transaction.objectStore(STORES.ORDERS);

            // Clear old cache first to ensure we don't keep deleted orders
            store.clear();

            orders.forEach(order => store.put(order));

            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('Failed to save orders offline:', error);
        }
    },

    // Get all cached orders
    getOrders: async () => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORES.ORDERS], 'readonly');
            const store = transaction.objectStore(STORES.ORDERS);
            const request = store.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get offline orders:', error);
            return [];
        }
    },

    // Get single cached order
    getOrder: async (id) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORES.ORDERS], 'readonly');
            const store = transaction.objectStore(STORES.ORDERS);
            const request = store.get(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get offline order:', error);
            return null;
        }
    },

    // Update a single order (used for optimistic UI updates)
    updateOrder: async (order) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORES.ORDERS], 'readwrite');
            const store = transaction.objectStore(STORES.ORDERS);
            store.put(order);
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('Failed to update offline order:', error);
        }
    },

    // Queue an action for sync
    queueAction: async (actionType, payload) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORES.PENDING_UPDATES], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_UPDATES);

            const action = {
                type: actionType,
                payload,
                timestamp: Date.now()
            };

            store.add(action);

            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('Failed to queue offline action:', error);
        }
    },

    // Get all pending actions
    getPendingActions: async () => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORES.PENDING_UPDATES], 'readonly');
            const store = transaction.objectStore(STORES.PENDING_UPDATES);
            const request = store.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            return [];
        }
    },

    // Clear pending actions after sync
    clearPendingActions: async (ids) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORES.PENDING_UPDATES], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_UPDATES);

            ids.forEach(id => store.delete(id));

            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('Failed to clear pending actions:', error);
        }
    }
};
