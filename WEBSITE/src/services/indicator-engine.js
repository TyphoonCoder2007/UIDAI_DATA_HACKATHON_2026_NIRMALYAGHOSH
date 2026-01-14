/**
 * Indicator Calculation Engine
 * 
 * Implements deterministic, explainable indicator calculations for policy-ready intelligence.
 * All formulas are transparent and can be audited.
 */

import { THRESHOLDS, HEALTH_SCORE_WEIGHTS, STATE_POPULATION, WINDOWS } from '../config/constants.js';

// ═══════════════════════════════════════════════════════════════════════════
// CORE INDICATOR CALCULATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate Aadhaar Enrollment Saturation Index
 * 
 * Formula: (cumulative_enrollments / estimated_population) × 100
 * 
 * Interpretation:
 * - 0-40: Critical - Significant enrollment gaps
 * - 40-60: Warning - Moderate coverage, needs attention
 * - 60-80: Moderate - Good coverage with room for improvement
 * - 80-100: Healthy - Near-saturation coverage
 * - >100: Over-saturation (possible due to population mobility)
 * 
 * @param {number} totalEnrollments - Total cumulative enrollments
 * @param {string} state - State name for population lookup
 * @returns {Object} Index value and interpretation
 */
export const calculateSaturationIndex = (totalEnrollments, state) => {
    const population = (STATE_POPULATION[state] || 50) * 1_000_000; // Convert millions to actual
    const index = Math.min((totalEnrollments / population) * 100, 120); // Cap at 120%

    let status, interpretation;

    if (index < THRESHOLDS.saturation.critical) {
        status = 'critical';
        interpretation = `Only ${index.toFixed(1)}% coverage — significant enrollment gaps persist`;
    } else if (index < THRESHOLDS.saturation.warning) {
        status = 'warning';
        interpretation = `${index.toFixed(1)}% coverage — moderate gaps need targeted outreach`;
    } else if (index < THRESHOLDS.saturation.healthy) {
        status = 'moderate';
        interpretation = `${index.toFixed(1)}% coverage — good progress, focus on remaining populations`;
    } else {
        status = 'healthy';
        interpretation = `${index.toFixed(1)}% coverage — near-saturation achieved`;
    }

    return {
        value: Math.round(index * 10) / 10,
        status,
        interpretation,
        formula: 'saturation = (enrollments / population) × 100'
    };
};

/**
 * Calculate Update Volatility Index
 * 
 * Formula: (stddev(daily_updates) / mean(daily_updates)) × 100
 * This is the Coefficient of Variation (CV)
 * 
 * Interpretation:
 * - 0-50: Stable - Consistent update patterns
 * - 50-100: Moderate - Some variation but expected
 * - 100-150: High - Notable irregularities
 * - >150: Critical - Requires investigation
 * 
 * @param {Array<number>} dailyUpdates - Array of daily update counts
 * @returns {Object} Index value and interpretation
 */
export const calculateVolatilityIndex = (dailyUpdates) => {
    if (!dailyUpdates || dailyUpdates.length < 2) {
        return { value: 0, status: 'insufficient_data', interpretation: 'Insufficient data for volatility calculation' };
    }

    const mean = dailyUpdates.reduce((a, b) => a + b, 0) / dailyUpdates.length;
    if (mean === 0) {
        return { value: 0, status: 'no_activity', interpretation: 'No update activity recorded' };
    }

    const variance = dailyUpdates.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyUpdates.length;
    const stddev = Math.sqrt(variance);
    const cv = (stddev / mean) * 100;

    let status, interpretation;

    if (cv < THRESHOLDS.volatility.stable) {
        status = 'stable';
        interpretation = `Low volatility (${cv.toFixed(1)}%) — consistent update patterns`;
    } else if (cv < THRESHOLDS.volatility.moderate) {
        status = 'moderate';
        interpretation = `Moderate volatility (${cv.toFixed(1)}%) — within expected variation`;
    } else if (cv < THRESHOLDS.volatility.high) {
        status = 'high';
        interpretation = `High volatility (${cv.toFixed(1)}%) — significant irregularities detected`;
    } else {
        status = 'critical';
        interpretation = `Critical volatility (${cv.toFixed(1)}%) — immediate investigation needed`;
    }

    return {
        value: Math.round(cv * 10) / 10,
        status,
        interpretation,
        formula: 'volatility = (σ / μ) × 100'
    };
};

/**
 * Calculate Biometric Stability Score
 * 
 * Formula: 100 - (biometric_updates / total_enrollments × aging_factor × 100)
 * 
 * Higher score = more stable biometrics (less update pressure)
 * Lower score = aging population or quality degradation
 * 
 * @param {number} biometricUpdates - Total biometric updates
 * @param {number} totalEnrollments - Total enrollments
 * @param {number} agingFactor - Adjustment for population age distribution (0.5-2.0)
 * @returns {Object} Score and interpretation
 */
export const calculateBiometricStability = (biometricUpdates, totalEnrollments, agingFactor = 1.0) => {
    if (totalEnrollments === 0) {
        return { value: 100, status: 'no_data', interpretation: 'No enrollment data available' };
    }

    const updateRatio = biometricUpdates / totalEnrollments;
    const adjustedRatio = updateRatio * agingFactor;
    const score = Math.max(0, Math.min(100, 100 - (adjustedRatio * 100)));

    let status, interpretation;

    if (score < THRESHOLDS.biometricStability.critical) {
        status = 'critical';
        interpretation = `Low stability (${score.toFixed(0)}) — high biometric refresh pressure, possible aging/quality issues`;
    } else if (score < THRESHOLDS.biometricStability.warning) {
        status = 'warning';
        interpretation = `Moderate stability (${score.toFixed(0)}) — elevated update activity detected`;
    } else if (score < THRESHOLDS.biometricStability.healthy) {
        status = 'moderate';
        interpretation = `Good stability (${score.toFixed(0)}) — normal biometric maintenance levels`;
    } else {
        status = 'healthy';
        interpretation = `Excellent stability (${score.toFixed(0)}) — minimal biometric update requirements`;
    }

    return {
        value: Math.round(score),
        status,
        interpretation,
        formula: 'stability = 100 - (bio_updates / enrollments × aging_factor × 100)'
    };
};

/**
 * Calculate Enrollment Velocity
 * 
 * Formula: sum(enrollments_in_window) / window_days
 * 
 * @param {Array<{date: string, count: number}>} enrollmentData - Daily enrollment data
 * @param {number} windowDays - Window size (default 7)
 * @returns {Object} Velocity and trend
 */
export const calculateEnrollmentVelocity = (enrollmentData, windowDays = WINDOWS.short) => {
    if (!enrollmentData || enrollmentData.length === 0) {
        return { value: 0, trend: 'stable', interpretation: 'No enrollment data available' };
    }

    // Get data for the window period
    const sortedData = [...enrollmentData].sort((a, b) => new Date(b.date) - new Date(a.date));
    const windowData = sortedData.slice(0, windowDays);
    const previousWindowData = sortedData.slice(windowDays, windowDays * 2);

    const currentVelocity = windowData.reduce((sum, d) => sum + d.count, 0) / Math.max(windowData.length, 1);
    const previousVelocity = previousWindowData.length > 0
        ? previousWindowData.reduce((sum, d) => sum + d.count, 0) / previousWindowData.length
        : currentVelocity;

    const changePercent = previousVelocity > 0
        ? ((currentVelocity - previousVelocity) / previousVelocity) * 100
        : 0;

    let trend, interpretation;

    if (changePercent > 10) {
        trend = 'up';
        interpretation = `Velocity increasing (+${changePercent.toFixed(1)}%) — ${currentVelocity.toFixed(0)}/day average`;
    } else if (changePercent < -10) {
        trend = 'down';
        interpretation = `Velocity decreasing (${changePercent.toFixed(1)}%) — ${currentVelocity.toFixed(0)}/day average`;
    } else {
        trend = 'stable';
        interpretation = `Velocity stable — ${currentVelocity.toFixed(0)}/day average`;
    }

    return {
        value: Math.round(currentVelocity),
        velocity7d: Math.round(currentVelocity),
        velocity30d: Math.round(previousVelocity),
        changePercent: Math.round(changePercent * 10) / 10,
        trend,
        interpretation,
        formula: 'velocity = Σ(daily_enrollments) / days'
    };
};

/**
 * Calculate Migration Stress Indicator
 * 
 * Formula: (current_demographic_updates / baseline_updates) - 1
 * Expressed as percentage above/below baseline
 * 
 * @param {number} currentUpdates - Current period demographic updates
 * @param {number} baselineUpdates - Baseline (historical average) updates
 * @returns {Object} Stress level and interpretation
 */
export const calculateMigrationStress = (currentUpdates, baselineUpdates) => {
    if (baselineUpdates === 0) {
        return { value: 0, status: 'no_baseline', interpretation: 'No baseline data for comparison' };
    }

    const ratio = currentUpdates / baselineUpdates;
    const stressPercent = (ratio - 1) * 100;

    let status, interpretation;

    if (stressPercent < 0) {
        status = 'below_baseline';
        interpretation = `${Math.abs(stressPercent).toFixed(0)}% below baseline — reduced migration activity`;
    } else if (stressPercent < THRESHOLDS.migrationStress.info) {
        status = 'normal';
        interpretation = `Within normal range (+${stressPercent.toFixed(0)}%) — no stress indicators`;
    } else if (stressPercent < THRESHOLDS.migrationStress.warning) {
        status = 'elevated';
        interpretation = `Elevated activity (+${stressPercent.toFixed(0)}%) — potential migration pattern`;
    } else if (stressPercent < THRESHOLDS.migrationStress.critical) {
        status = 'high';
        interpretation = `High stress (+${stressPercent.toFixed(0)}%) — significant demographic movement`;
    } else {
        status = 'critical';
        interpretation = `Critical stress (+${stressPercent.toFixed(0)}%) — major migration event detected`;
    }

    return {
        value: Math.round(stressPercent),
        ratio: Math.round(ratio * 100) / 100,
        status,
        interpretation,
        formula: 'stress = (current / baseline) - 1'
    };
};

/**
 * Calculate Regional Inclusion Health Score
 * 
 * Composite indicator combining multiple factors with weighted average
 * 
 * Formula: Σ(weight_i × normalized_score_i) for all indicators
 * 
 * @param {Object} metrics - State metrics containing all sub-indicators
 * @returns {Object} Health score and breakdown
 */
export const calculateHealthScore = (metrics) => {
    const {
        saturationIndex = 50,
        enrollmentVelocity = 0,
        enrollmentVelocityBaseline = 1,
        updateCompliance = 50,
        biometricStability = 50,
        infrastructureAccess = 50
    } = metrics;

    // Normalize velocity to 0-100 scale
    const velocityScore = Math.min(100, (enrollmentVelocity / Math.max(enrollmentVelocityBaseline, 1)) * 100);

    // Calculate weighted score
    const score =
        (saturationIndex * HEALTH_SCORE_WEIGHTS.saturation) +
        (velocityScore * HEALTH_SCORE_WEIGHTS.enrollmentVelocity) +
        (updateCompliance * HEALTH_SCORE_WEIGHTS.updateCompliance) +
        (biometricStability * HEALTH_SCORE_WEIGHTS.biometricStability) +
        (infrastructureAccess * HEALTH_SCORE_WEIGHTS.infrastructureAccess);

    let status, interpretation;

    if (score < THRESHOLDS.healthScore.critical) {
        status = 'critical';
        interpretation = `Critical health (${score.toFixed(0)}/100) — immediate intervention required`;
    } else if (score < THRESHOLDS.healthScore.warning) {
        status = 'warning';
        interpretation = `Poor health (${score.toFixed(0)}/100) — multiple indicators need attention`;
    } else if (score < THRESHOLDS.healthScore.moderate) {
        status = 'moderate';
        interpretation = `Moderate health (${score.toFixed(0)}/100) — some areas need improvement`;
    } else if (score < THRESHOLDS.healthScore.healthy) {
        status = 'good';
        interpretation = `Good health (${score.toFixed(0)}/100) — system performing well`;
    } else {
        status = 'excellent';
        interpretation = `Excellent health (${score.toFixed(0)}/100) — model region`;
    }

    return {
        value: Math.round(score),
        status,
        interpretation,
        breakdown: {
            saturation: { weight: HEALTH_SCORE_WEIGHTS.saturation, value: saturationIndex },
            velocity: { weight: HEALTH_SCORE_WEIGHTS.enrollmentVelocity, value: velocityScore },
            compliance: { weight: HEALTH_SCORE_WEIGHTS.updateCompliance, value: updateCompliance },
            biometric: { weight: HEALTH_SCORE_WEIGHTS.biometricStability, value: biometricStability },
            infrastructure: { weight: HEALTH_SCORE_WEIGHTS.infrastructureAccess, value: infrastructureAccess }
        },
        formula: 'health = Σ(weight × normalized_indicator)'
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// TREND DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect trend from time series data
 * 
 * @param {Array<number>} values - Ordered array of values (oldest to newest)
 * @param {number} sensitivity - Percentage change threshold for trend detection
 * @returns {string} 'up' | 'down' | 'stable'
 */
export const detectTrend = (values, sensitivity = 10) => {
    if (!values || values.length < 2) return 'stable';

    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
    const earlier = values.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);

    if (earlier === 0) return recent > 0 ? 'up' : 'stable';

    const change = ((recent - earlier) / earlier) * 100;

    if (change > sensitivity) return 'up';
    if (change < -sensitivity) return 'down';
    return 'stable';
};

// ═══════════════════════════════════════════════════════════════════════════
// BATCH INDICATOR UPDATE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate all indicators for a state's metrics
 * 
 * @param {string} state - State name
 * @param {Object} rawMetrics - Raw aggregated metrics
 * @returns {Object} Complete indicator set
 */
export const calculateAllIndicators = (state, rawMetrics) => {
    const {
        totalEnrollments = 0,
        totalDemographicUpdates = 0,
        totalBiometricUpdates = 0,
        dailyEnrollments = [],
        dailyDemographicUpdates = [],
        baselineDemographicUpdates = 0
    } = rawMetrics;

    const saturation = calculateSaturationIndex(totalEnrollments, state);
    const volatility = calculateVolatilityIndex(dailyDemographicUpdates);
    const biometricStability = calculateBiometricStability(totalBiometricUpdates, totalEnrollments);
    const velocity = calculateEnrollmentVelocity(dailyEnrollments.map((count, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        count
    })));
    const migrationStress = calculateMigrationStress(
        dailyDemographicUpdates.slice(0, 7).reduce((a, b) => a + b, 0),
        baselineDemographicUpdates
    );

    const healthScore = calculateHealthScore({
        saturationIndex: saturation.value,
        enrollmentVelocity: velocity.value,
        enrollmentVelocityBaseline: velocity.velocity30d || 1,
        updateCompliance: 70, // Default compliance assumption
        biometricStability: biometricStability.value,
        infrastructureAccess: 65 // Default infrastructure assumption
    });

    return {
        saturationIndex: saturation,
        volatilityIndex: volatility,
        biometricStability,
        enrollmentVelocity: velocity,
        migrationStress,
        healthScore,
        trend: velocity.trend,
        lastUpdated: new Date().toISOString()
    };
};
