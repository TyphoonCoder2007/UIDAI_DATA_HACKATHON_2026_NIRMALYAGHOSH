/**
 * Aggregation Engine
 * 
 * Implements incremental aggregation for real-time metric updates.
 * Uses rolling windows and state/district granularity.
 */

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    increment,
    Timestamp
} from 'firebase/firestore';
import { db, isDemoMode } from '../config/firebase-config.js';
import { COLLECTIONS, WINDOWS, STATES } from '../config/constants.js';
import { calculateAllIndicators } from './indicator-engine.js';
import { evaluateAlerts, prioritizeAlerts } from './alert-engine.js';
import { createAlert, createInsight, liveMetricsRef, alertsRef, insightsRef } from './firestore-schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// INCREMENTAL AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update state metrics incrementally when new event arrives
 * 
 * @param {string} state - State name
 * @param {string} eventType - 'enrollment' | 'demographic' | 'biometric'
 * @param {Object} eventData - Event data with totals
 */
export const updateStateMetrics = async (state, eventType, eventData) => {
    if (isDemoMode()) {
        console.log('[Demo Mode] Would update metrics for', state, eventType);
        return;
    }

    const metricsRef = doc(db, COLLECTIONS.LIVE_METRICS, state);
    const metricsDoc = await getDoc(metricsRef);

    const updates = {
        last_updated: serverTimestamp()
    };

    switch (eventType) {
        case 'enrollment':
            updates.total_enrollments = increment(eventData.total || 0);
            updates[`enrollment_${eventData.date}`] = increment(eventData.total || 0);
            break;
        case 'demographic':
            updates.total_demographic_updates = increment(eventData.total || 0);
            updates[`demographic_${eventData.date}`] = increment(eventData.total || 0);
            break;
        case 'biometric':
            updates.total_biometric_updates = increment(eventData.total || 0);
            updates[`biometric_${eventData.date}`] = increment(eventData.total || 0);
            break;
    }

    if (metricsDoc.exists()) {
        await updateDoc(metricsRef, updates);
    } else {
        // Initialize new state metrics document
        await setDoc(metricsRef, {
            state: state,
            total_enrollments: eventType === 'enrollment' ? eventData.total : 0,
            total_demographic_updates: eventType === 'demographic' ? eventData.total : 0,
            total_biometric_updates: eventType === 'biometric' ? eventData.total : 0,
            enrollment_velocity_7d: 0,
            enrollment_velocity_30d: 0,
            update_frequency_7d: 0,
            biometric_refresh_rate: 0,
            saturation_index: 0,
            volatility_index: 0,
            stability_score: 100,
            health_score: 50,
            trend: 'stable',
            districts: {},
            last_updated: serverTimestamp()
        });
    }
};

/**
 * Compute rolling window aggregates for a state
 * 
 * @param {string} state - State name
 * @param {number} windowDays - Window size (7 or 30)
 * @returns {Object} Rolling window metrics
 */
export const computeRollingWindow = async (state, windowDays = WINDOWS.short) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Query enrollment events in window
    const enrollmentQuery = query(
        collection(db, COLLECTIONS.ENROLLMENT_EVENTS),
        where('state', '==', state),
        where('date', '>=', startStr),
        where('date', '<=', endStr)
    );

    const demographicQuery = query(
        collection(db, COLLECTIONS.DEMOGRAPHIC_EVENTS),
        where('state', '==', state),
        where('date', '>=', startStr),
        where('date', '<=', endStr)
    );

    const biometricQuery = query(
        collection(db, COLLECTIONS.BIOMETRIC_EVENTS),
        where('state', '==', state),
        where('date', '>=', startStr),
        where('date', '<=', endStr)
    );

    const [enrollmentSnap, demographicSnap, biometricSnap] = await Promise.all([
        getDocs(enrollmentQuery),
        getDocs(demographicQuery),
        getDocs(biometricQuery)
    ]);

    // Aggregate by date
    const dailyEnrollments = {};
    const dailyDemographic = {};
    const dailyBiometric = {};

    enrollmentSnap.forEach(doc => {
        const data = doc.data();
        dailyEnrollments[data.date] = (dailyEnrollments[data.date] || 0) + (data.total || 0);
    });

    demographicSnap.forEach(doc => {
        const data = doc.data();
        dailyDemographic[data.date] = (dailyDemographic[data.date] || 0) + (data.total || 0);
    });

    biometricSnap.forEach(doc => {
        const data = doc.data();
        dailyBiometric[data.date] = (dailyBiometric[data.date] || 0) + (data.total || 0);
    });

    return {
        windowDays,
        startDate: startStr,
        endDate: endStr,
        enrollmentTotal: Object.values(dailyEnrollments).reduce((a, b) => a + b, 0),
        demographicTotal: Object.values(dailyDemographic).reduce((a, b) => a + b, 0),
        biometricTotal: Object.values(dailyBiometric).reduce((a, b) => a + b, 0),
        dailyEnrollments: Object.values(dailyEnrollments),
        dailyDemographic: Object.values(dailyDemographic),
        dailyBiometric: Object.values(dailyBiometric)
    };
};

/**
 * Full indicator recalculation for a state
 * Called periodically or on significant data changes
 */
export const recalculateStateIndicators = async (state) => {
    if (isDemoMode()) {
        console.log('[Demo Mode] Would recalculate indicators for', state);
        return null;
    }

    // Get current metrics
    const metricsRef = doc(db, COLLECTIONS.LIVE_METRICS, state);
    const metricsDoc = await getDoc(metricsRef);

    if (!metricsDoc.exists()) {
        console.warn('No metrics document for state:', state);
        return null;
    }

    const currentMetrics = metricsDoc.data();

    // Compute rolling windows
    const window7d = await computeRollingWindow(state, 7);
    const window30d = await computeRollingWindow(state, 30);

    // Prepare raw metrics for indicator calculation
    const rawMetrics = {
        totalEnrollments: currentMetrics.total_enrollments || 0,
        totalDemographicUpdates: currentMetrics.total_demographic_updates || 0,
        totalBiometricUpdates: currentMetrics.total_biometric_updates || 0,
        dailyEnrollments: window7d.dailyEnrollments,
        dailyDemographicUpdates: window7d.dailyDemographic,
        baselineDemographicUpdates: window30d.demographicTotal / 30
    };

    // Calculate all indicators
    const indicators = calculateAllIndicators(state, rawMetrics);

    // Update metrics document
    await updateDoc(metricsRef, {
        enrollment_velocity_7d: indicators.enrollmentVelocity.velocity7d,
        enrollment_velocity_30d: indicators.enrollmentVelocity.velocity30d,
        saturation_index: indicators.saturationIndex.value,
        volatility_index: indicators.volatilityIndex.value,
        stability_score: indicators.biometricStability.value,
        health_score: indicators.healthScore.value,
        trend: indicators.trend,
        last_updated: serverTimestamp()
    });

    // Evaluate and store alerts
    const alertMetrics = {
        enrollmentVelocity7d: indicators.enrollmentVelocity.velocity7d,
        enrollmentVelocity30d: indicators.enrollmentVelocity.velocity30d,
        demographicUpdates7d: window7d.demographicTotal,
        demographicBaseline: window30d.demographicTotal / 30 * 7,
        biometricUpdates: currentMetrics.total_biometric_updates,
        totalEnrollments: currentMetrics.total_enrollments,
        saturationIndex: indicators.saturationIndex.value,
        volatilityIndex: indicators.volatilityIndex.value
    };

    const alerts = evaluateAlerts(state, alertMetrics);
    const prioritized = prioritizeAlerts(alerts);

    // Store new alerts
    for (const alert of prioritized.slice(0, 5)) { // Limit to top 5 per recalculation
        const alertDoc = createAlert(alert);
        await setDoc(doc(alertsRef(), `${state}_${Date.now()}_${alert.type}`), alertDoc);
    }

    return { indicators, alerts: prioritized };
};

// ═══════════════════════════════════════════════════════════════════════════
// BATCH RECALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recalculate indicators for all states
 * Should be run periodically (e.g., every hour)
 */
export const recalculateAllIndicators = async (onProgress = null) => {
    const results = {};

    for (let i = 0; i < STATES.length; i++) {
        const state = STATES[i];
        try {
            results[state] = await recalculateStateIndicators(state);
        } catch (err) {
            console.error(`Failed to recalculate for ${state}:`, err);
            results[state] = { error: err.message };
        }

        if (onProgress) {
            onProgress(i + 1, STATES.length, state);
        }
    }

    return results;
};

/**
 * Generate system-wide insights based on cross-state patterns
 */
export const generateSystemInsights = async () => {
    const allMetrics = {};

    for (const state of STATES) {
        const metricsRef = doc(db, COLLECTIONS.LIVE_METRICS, state);
        const metricsDoc = await getDoc(metricsRef);
        if (metricsDoc.exists()) {
            allMetrics[state] = metricsDoc.data();
        }
    }

    const insights = [];

    // Identify lowest saturation states
    const sortedBySaturation = Object.entries(allMetrics)
        .filter(([_, m]) => m.saturation_index > 0)
        .sort((a, b) => a[1].saturation_index - b[1].saturation_index);

    if (sortedBySaturation.length >= 3) {
        const bottomThree = sortedBySaturation.slice(0, 3);
        insights.push(createInsight({
            category: 'policy',
            title: 'Enrollment Coverage Gap Identified',
            description: `Three states show significantly lower Aadhaar saturation: ${bottomThree.map(([s, m]) => `${s} (${m.saturation_index.toFixed(0)}%)`).join(', ')}. These regions require targeted enrollment initiatives.`,
            affectedRegions: bottomThree.map(([s]) => s),
            dataPoints: Object.fromEntries(bottomThree.map(([s, m]) => [s, m.saturation_index])),
            recommendation: 'Prioritize mobile enrollment camps and ASHA worker integration in these states.',
            priority: 'high'
        }));
    }

    // Store insights
    for (const insight of insights) {
        await setDoc(doc(insightsRef(), `insight_${Date.now()}`), insight);
    }

    return insights;
};
