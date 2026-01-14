/**
 * Firestore Schema Definitions and Helper Functions
 * 
 * This module defines the structure of all Firestore collections
 * and provides type-safe helper functions for data access.
 */

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db, isDemoMode } from '../config/firebase-config.js';
import { COLLECTIONS } from '../config/constants.js';

// ═══════════════════════════════════════════════════════════════════════════
// COLLECTION REFERENCES
// ═══════════════════════════════════════════════════════════════════════════

export const getCollectionRef = (collectionName) => collection(db, collectionName);

export const enrollmentEventsRef = () => getCollectionRef(COLLECTIONS.ENROLLMENT_EVENTS);
export const demographicEventsRef = () => getCollectionRef(COLLECTIONS.DEMOGRAPHIC_EVENTS);
export const biometricEventsRef = () => getCollectionRef(COLLECTIONS.BIOMETRIC_EVENTS);
export const liveMetricsRef = () => getCollectionRef(COLLECTIONS.LIVE_METRICS);
export const alertsRef = () => getCollectionRef(COLLECTIONS.ALERTS);
export const insightsRef = () => getCollectionRef(COLLECTIONS.INSIGHTS);
export const rollingWindowsRef = () => getCollectionRef(COLLECTIONS.ROLLING_WINDOWS);

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT SCHEMA CREATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates an enrollment event document
 */
export const createEnrollmentEvent = (data) => ({
    timestamp: serverTimestamp(),
    date: data.date,
    state: data.state,
    district: data.district,
    pincode: data.pincode,
    age_0_5: parseInt(data.age_0_5) || 0,
    age_5_17: parseInt(data.age_5_17) || 0,
    age_18_plus: parseInt(data.age_18_plus) || 0,
    total: (parseInt(data.age_0_5) || 0) +
        (parseInt(data.age_5_17) || 0) +
        (parseInt(data.age_18_plus) || 0),
    processed: false
});

/**
 * Creates a demographic update event document
 */
export const createDemographicEvent = (data) => ({
    timestamp: serverTimestamp(),
    date: data.date,
    state: data.state,
    district: data.district,
    pincode: data.pincode,
    demo_age_5_17: parseInt(data.demo_age_5_17) || 0,
    demo_age_17_plus: parseInt(data.demo_age_17_plus) || 0,
    total: (parseInt(data.demo_age_5_17) || 0) +
        (parseInt(data.demo_age_17_plus) || 0),
    processed: false
});

/**
 * Creates a biometric update event document
 */
export const createBiometricEvent = (data) => ({
    timestamp: serverTimestamp(),
    date: data.date,
    state: data.state,
    district: data.district,
    pincode: data.pincode,
    bio_age_5_17: parseInt(data.bio_age_5_17) || 0,
    bio_age_17_plus: parseInt(data.bio_age_17_plus) || 0,
    total: (parseInt(data.bio_age_5_17) || 0) +
        (parseInt(data.bio_age_17_plus) || 0),
    processed: false
});

/**
 * Creates a live metrics document for a state
 */
export const createLiveMetrics = (state) => ({
    state: state,
    last_updated: serverTimestamp(),
    total_enrollments: 0,
    total_demographic_updates: 0,
    total_biometric_updates: 0,
    enrollment_velocity_7d: 0,
    enrollment_velocity_30d: 0,
    update_frequency_7d: 0,
    biometric_refresh_rate: 0,
    saturation_index: 0,
    volatility_index: 0,
    stability_score: 100,
    health_score: 50,
    trend: 'stable',
    districts: {}
});

/**
 * Creates an alert document
 */
export const createAlert = (data) => ({
    timestamp: serverTimestamp(),
    type: data.type,
    severity: data.severity,
    state: data.state,
    district: data.district || null,
    indicator: data.indicator,
    current_value: data.currentValue,
    baseline_value: data.baselineValue,
    deviation_pct: data.deviationPct,
    explanation: data.explanation,
    suggested_action: data.suggestedAction,
    confidence: data.confidence || 0.8,
    acknowledged: false
});

/**
 * Creates an insight document
 */
export const createInsight = (data) => ({
    timestamp: serverTimestamp(),
    category: data.category,
    title: data.title,
    description: data.description,
    affected_regions: data.affectedRegions || [],
    data_points: data.dataPoints || {},
    recommendation: data.recommendation,
    priority: data.priority,
    expiry: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
});

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get recent alerts with optional filters
 */
export const queryRecentAlerts = (options = {}) => {
    const { state, severity, acknowledged, limitCount = 10 } = options;
    let q = alertsRef();

    const constraints = [orderBy('timestamp', 'desc'), limit(limitCount)];

    if (state) constraints.push(where('state', '==', state));
    if (severity) constraints.push(where('severity', '==', severity));
    if (acknowledged !== undefined) constraints.push(where('acknowledged', '==', acknowledged));

    return query(q, ...constraints);
};

/**
 * Get live metrics for a specific state
 */
export const getStateMetrics = async (state) => {
    const docRef = doc(liveMetricsRef(), state);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

/**
 * Get all state metrics
 */
export const getAllStateMetrics = async () => {
    const snapshot = await getDocs(liveMetricsRef());
    const metrics = {};
    snapshot.forEach((doc) => {
        metrics[doc.id] = doc.data();
    });
    return metrics;
};

/**
 * Subscribe to real-time updates for live metrics
 */
export const subscribeToLiveMetrics = (callback) => {
    return onSnapshot(liveMetricsRef(), (snapshot) => {
        const metrics = {};
        snapshot.forEach((doc) => {
            metrics[doc.id] = doc.data();
        });
        callback(metrics);
    });
};

/**
 * Subscribe to real-time alerts
 */
export const subscribeToAlerts = (callback, options = {}) => {
    const q = queryRecentAlerts(options);
    return onSnapshot(q, (snapshot) => {
        const alerts = [];
        snapshot.forEach((doc) => {
            alerts.push({ id: doc.id, ...doc.data() });
        });
        callback(alerts);
    });
};

/**
 * Subscribe to insights
 */
export const subscribeToInsights = (callback, limitCount = 5) => {
    const q = query(insightsRef(), orderBy('timestamp', 'desc'), limit(limitCount));
    return onSnapshot(q, (snapshot) => {
        const insights = [];
        snapshot.forEach((doc) => {
            insights.push({ id: doc.id, ...doc.data() });
        });
        callback(insights);
    });
};
