/**
 * Firebase Sync Service
 * 
 * Handles real-time data synchronization with Firestore
 * Provides connection status and automatic reconnection
 */

import { db, isDemoMode } from '../config/firebase-config.js';

let unsubscribeListeners = [];
let connectionStatus = 'disconnected';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize Firebase sync
 * Returns true if connected, false if in demo mode
 */
export const initFirebaseSync = async (onDataUpdate, onStatusChange) => {
    if (isDemoMode()) {
        console.log('🔒 Firebase: Demo mode - no sync');
        updateStatus('demo', onStatusChange);
        return false;
    }

    try {
        updateStatus('connecting', onStatusChange);

        // Test connection
        const testDoc = await db.collection('_connection_test').doc('ping').get();

        updateStatus('connected', onStatusChange);
        console.log('✅ Firebase: Connected');

        // Setup real-time listeners
        setupListeners(onDataUpdate, onStatusChange);

        return true;
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        updateStatus('error', onStatusChange);

        // Attempt reconnection
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(() => initFirebaseSync(onDataUpdate, onStatusChange), 5000);
        }

        return false;
    }
};

/**
 * Setup real-time Firestore listeners
 */
const setupListeners = (onDataUpdate, onStatusChange) => {
    // Cleanup existing listeners
    unsubscribeListeners.forEach(unsub => unsub());
    unsubscribeListeners = [];

    // Listen to metrics collection
    if (db) {
        try {
            const unsubMetrics = db.collection('metrics')
                .orderBy('updated_at', 'desc')
                .limit(100)
                .onSnapshot(
                    (snapshot) => {
                        const metrics = {};
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            if (data.state) {
                                metrics[data.state] = data;
                            }
                        });

                        if (Object.keys(metrics).length > 0) {
                            onDataUpdate({ type: 'metrics', data: metrics });
                        }
                    },
                    (error) => {
                        console.error('Metrics listener error:', error);
                        updateStatus('error', onStatusChange);
                    }
                );

            unsubscribeListeners.push(unsubMetrics);

            // Listen to alerts collection
            const unsubAlerts = db.collection('alerts')
                .where('active', '==', true)
                .orderBy('created_at', 'desc')
                .limit(50)
                .onSnapshot(
                    (snapshot) => {
                        const alerts = [];
                        snapshot.forEach(doc => {
                            alerts.push({ id: doc.id, ...doc.data() });
                        });

                        onDataUpdate({ type: 'alerts', data: alerts });
                    },
                    (error) => {
                        console.error('Alerts listener error:', error);
                    }
                );

            unsubscribeListeners.push(unsubAlerts);

        } catch (error) {
            console.error('Failed to setup listeners:', error);
        }
    }
};

/**
 * Push data to Firestore
 */
export const pushToFirestore = async (collection, data) => {
    if (isDemoMode() || !db) return false;

    try {
        const docRef = db.collection(collection).doc();
        await docRef.set({
            ...data,
            created_at: new Date(),
            updated_at: new Date()
        });
        return true;
    } catch (error) {
        console.error('Failed to push to Firestore:', error);
        return false;
    }
};

/**
 * Update connection status
 */
const updateStatus = (status, callback) => {
    connectionStatus = status;
    if (callback) {
        callback(status);
    }

    // Update UI status indicator
    const statusEl = document.querySelector('.firebase-status');
    if (statusEl) {
        statusEl.className = `firebase-status ${status}`;
        statusEl.innerHTML = `
            <span class="status-icon"></span>
            <span>${getStatusText(status)}</span>
        `;
    }
};

/**
 * Get human readable status text
 */
const getStatusText = (status) => {
    switch (status) {
        case 'connected': return 'Firebase Connected';
        case 'connecting': return 'Connecting...';
        case 'disconnected': return 'Disconnected';
        case 'error': return 'Connection Error';
        case 'demo': return 'Demo Mode';
        default: return status;
    }
};

/**
 * Get current connection status
 */
export const getConnectionStatus = () => connectionStatus;

/**
 * Cleanup listeners on unmount
 */
export const cleanup = () => {
    unsubscribeListeners.forEach(unsub => unsub());
    unsubscribeListeners = [];
};

export default {
    initFirebaseSync,
    pushToFirestore,
    getConnectionStatus,
    cleanup
};
