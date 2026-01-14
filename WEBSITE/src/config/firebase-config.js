/**
 * Firebase Configuration for Aadhaar Intelligence Platform
 * 
 * IMPORTANT: Replace these placeholder values with your actual Firebase project credentials.
 * See docs/FIREBASE_SETUP.md for detailed setup instructions.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE CONFIGURATION (Replace with your project credentials)
// ═══════════════════════════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence for better UX
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistence not supported by browser');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// DEMO MODE CONFIGURATION
// When Firebase is not configured, the system uses sample data
// ═══════════════════════════════════════════════════════════════════════════
export const isDemoMode = () => {
    return firebaseConfig.apiKey === "YOUR_API_KEY";
};

export { app, db };
