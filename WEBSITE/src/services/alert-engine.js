/**
 * Alert Engine - Rule-Based Anomaly Detection
 * 
 * Implements deterministic, explainable alert rules for policy-relevant anomalies.
 * All alerts include plain-language explanations and suggested actions.
 */

import { THRESHOLDS, SEVERITY, ALERT_TYPES } from '../config/constants.js';

// ═══════════════════════════════════════════════════════════════════════════
// ALERT RULE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rule: Enrollment Drop Detection
 * 
 * Condition: 7-day velocity < 30-day velocity × threshold
 * Triggers when enrollment rate drops significantly vs baseline
 */
export const checkEnrollmentDrop = (velocity7d, velocity30d, state, district = null) => {
    if (velocity30d === 0) return null;

    const ratio = velocity7d / velocity30d;
    const dropPercent = (1 - ratio) * 100;

    if (dropPercent >= THRESHOLDS.velocityDrop.critical) {
        return {
            type: ALERT_TYPES.ENROLLMENT_DROP,
            severity: SEVERITY.CRITICAL,
            state,
            district,
            indicator: 'Enrollment Velocity',
            currentValue: velocity7d,
            baselineValue: velocity30d,
            deviationPct: -dropPercent,
            explanation: `Enrollment velocity in ${state}${district ? `, ${district}` : ''} has dropped ${dropPercent.toFixed(0)}% compared to the 30-day baseline. Current rate is ${velocity7d.toFixed(0)}/day vs baseline ${velocity30d.toFixed(0)}/day.`,
            suggestedAction: 'Investigate potential infrastructure outages, resource allocation gaps, or operational disruptions. Coordinate with regional enrollment centers to identify root cause.',
            confidence: 0.9
        };
    }

    if (dropPercent >= THRESHOLDS.velocityDrop.warning) {
        return {
            type: ALERT_TYPES.ENROLLMENT_DROP,
            severity: SEVERITY.WARNING,
            state,
            district,
            indicator: 'Enrollment Velocity',
            currentValue: velocity7d,
            baselineValue: velocity30d,
            deviationPct: -dropPercent,
            explanation: `Enrollment velocity in ${state}${district ? `, ${district}` : ''} has declined ${dropPercent.toFixed(0)}% from baseline. Current rate is ${velocity7d.toFixed(0)}/day.`,
            suggestedAction: 'Monitor for continued decline. Review enrollment center capacity and accessibility. Consider proactive outreach to underserved areas.',
            confidence: 0.85
        };
    }

    return null;
};

/**
 * Rule: Migration Stress Detection
 * 
 * Condition: Demographic updates significantly above baseline
 * Indicates potential population movement or address changes
 */
export const checkMigrationStress = (currentUpdates, baselineUpdates, state, district = null) => {
    if (baselineUpdates === 0) return null;

    const ratio = currentUpdates / baselineUpdates;
    const aboveBaseline = (ratio - 1) * 100;

    if (aboveBaseline >= THRESHOLDS.migrationStress.critical) {
        return {
            type: ALERT_TYPES.MIGRATION_STRESS,
            severity: SEVERITY.CRITICAL,
            state,
            district,
            indicator: 'Migration Stress',
            currentValue: currentUpdates,
            baselineValue: baselineUpdates,
            deviationPct: aboveBaseline,
            explanation: `Demographic update volume in ${state}${district ? `, ${district}` : ''} is ${aboveBaseline.toFixed(0)}% above normal. This indicates potential major population movement, seasonal migration, or policy-driven address changes.`,
            suggestedAction: 'Coordinate with district administration for population verification. Assess if this correlates with known migration patterns, employment shifts, or recent policy changes.',
            confidence: 0.85
        };
    }

    if (aboveBaseline >= THRESHOLDS.migrationStress.warning) {
        return {
            type: ALERT_TYPES.MIGRATION_STRESS,
            severity: SEVERITY.WARNING,
            state,
            district,
            indicator: 'Migration Stress',
            currentValue: currentUpdates,
            baselineValue: baselineUpdates,
            deviationPct: aboveBaseline,
            explanation: `Elevated demographic update activity in ${state}${district ? `, ${district}` : ''} (+${aboveBaseline.toFixed(0)}% above baseline). May indicate emerging migration pattern.`,
            suggestedAction: 'Track trend over next 7 days. Cross-reference with neighboring districts for regional patterns.',
            confidence: 0.75
        };
    }

    if (aboveBaseline >= THRESHOLDS.migrationStress.info) {
        return {
            type: ALERT_TYPES.MIGRATION_STRESS,
            severity: SEVERITY.INFO,
            state,
            district,
            indicator: 'Migration Stress',
            currentValue: currentUpdates,
            baselineValue: baselineUpdates,
            deviationPct: aboveBaseline,
            explanation: `Demographic update volume in ${state}${district ? `, ${district}` : ''} is moderately elevated (+${aboveBaseline.toFixed(0)}%).`,
            suggestedAction: 'Continue monitoring. No immediate action required.',
            confidence: 0.65
        };
    }

    return null;
};

/**
 * Rule: Biometric Pressure Detection
 * 
 * Condition: Biometric refresh rate exceeds expected thresholds
 * May indicate aging population, quality degradation, or fraudulent attempts
 */
export const checkBiometricPressure = (biometricUpdates, totalEnrollments, state, district = null) => {
    if (totalEnrollments === 0) return null;

    const refreshRate = (biometricUpdates / totalEnrollments) * 100;

    // Expected refresh rate is ~5-15% based on 5-year biometric validity
    if (refreshRate > 30) {
        return {
            type: ALERT_TYPES.BIOMETRIC_PRESSURE,
            severity: SEVERITY.CRITICAL,
            state,
            district,
            indicator: 'Biometric Refresh Rate',
            currentValue: refreshRate,
            baselineValue: 15,
            deviationPct: ((refreshRate - 15) / 15) * 100,
            explanation: `Biometric update rate in ${state}${district ? `, ${district}` : ''} is exceptionally high (${refreshRate.toFixed(1)}% of enrollments). This may indicate systematic quality issues, aging population effects, or unusual refresh patterns.`,
            suggestedAction: 'Audit biometric capture quality at enrollment centers. Review demographic distribution for aging patterns. Consider targeted infrastructure upgrades.',
            confidence: 0.8
        };
    }

    if (refreshRate > 20) {
        return {
            type: ALERT_TYPES.BIOMETRIC_PRESSURE,
            severity: SEVERITY.WARNING,
            state,
            district,
            indicator: 'Biometric Refresh Rate',
            currentValue: refreshRate,
            baselineValue: 15,
            deviationPct: ((refreshRate - 15) / 15) * 100,
            explanation: `Elevated biometric update activity in ${state}${district ? `, ${district}` : ''} (${refreshRate.toFixed(1)}% of enrollments).`,
            suggestedAction: 'Monitor trend and correlate with population demographics. Schedule preventive equipment maintenance.',
            confidence: 0.7
        };
    }

    return null;
};

/**
 * Rule: Saturation Risk Detection
 * 
 * Condition: Low enrollment saturation in a region
 * Indicates potential exclusion or access issues
 */
export const checkSaturationRisk = (saturationIndex, state, district = null) => {
    if (saturationIndex < THRESHOLDS.saturation.critical) {
        return {
            type: ALERT_TYPES.SATURATION_RISK,
            severity: SEVERITY.CRITICAL,
            state,
            district,
            indicator: 'Saturation Index',
            currentValue: saturationIndex,
            baselineValue: 80,
            deviationPct: ((saturationIndex - 80) / 80) * 100,
            explanation: `Critically low Aadhaar coverage in ${state}${district ? `, ${district}` : ''} (${saturationIndex.toFixed(1)}%). Significant population segments may lack identity credentials for accessing government services.`,
            suggestedAction: 'Deploy mobile enrollment camps. Partner with ASHA workers and local administration for door-to-door enrollment drives. Identify specific barriers to enrollment.',
            confidence: 0.95
        };
    }

    if (saturationIndex < THRESHOLDS.saturation.warning) {
        return {
            type: ALERT_TYPES.SATURATION_RISK,
            severity: SEVERITY.WARNING,
            state,
            district,
            indicator: 'Saturation Index',
            currentValue: saturationIndex,
            baselineValue: 80,
            deviationPct: ((saturationIndex - 80) / 80) * 100,
            explanation: `Below-target Aadhaar coverage in ${state}${district ? `, ${district}` : ''} (${saturationIndex.toFixed(1)}%). Gaps exist in reaching the target population.`,
            suggestedAction: 'Analyze demographic gaps. Increase enrollment center hours or locations. Target awareness campaigns to underserved communities.',
            confidence: 0.85
        };
    }

    return null;
};

/**
 * Rule: Volatility Spike Detection
 * 
 * Condition: High coefficient of variation in daily activity
 * May indicate irregular operations or data quality issues
 */
export const checkVolatilitySpike = (volatilityIndex, state, district = null) => {
    if (volatilityIndex > THRESHOLDS.volatility.high) {
        return {
            type: ALERT_TYPES.VOLATILITY_SPIKE,
            severity: SEVERITY.WARNING,
            state,
            district,
            indicator: 'Volatility Index',
            currentValue: volatilityIndex,
            baselineValue: 50,
            deviationPct: ((volatilityIndex - 50) / 50) * 100,
            explanation: `High operational volatility detected in ${state}${district ? `, ${district}` : ''} (CV: ${volatilityIndex.toFixed(0)}%). Daily activity patterns are highly irregular.`,
            suggestedAction: 'Review enrollment center operating hours and staffing consistency. Check for data reporting delays or batch uploads affecting metrics.',
            confidence: 0.7
        };
    }

    return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// BATCH ALERT EVALUATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run all alert rules against a state's metrics
 * 
 * @param {string} state - State name
 * @param {Object} metrics - Complete metrics object
 * @returns {Array} Array of triggered alerts
 */
export const evaluateAlerts = (state, metrics) => {
    const {
        enrollmentVelocity7d = 0,
        enrollmentVelocity30d = 1,
        demographicUpdates7d = 0,
        demographicBaseline = 1,
        biometricUpdates = 0,
        totalEnrollments = 1,
        saturationIndex = 50,
        volatilityIndex = 0,
        districts = {}
    } = metrics;

    const alerts = [];

    // State-level checks
    const enrollmentDrop = checkEnrollmentDrop(enrollmentVelocity7d, enrollmentVelocity30d, state);
    if (enrollmentDrop) alerts.push(enrollmentDrop);

    const migrationStress = checkMigrationStress(demographicUpdates7d, demographicBaseline, state);
    if (migrationStress) alerts.push(migrationStress);

    const biometricPressure = checkBiometricPressure(biometricUpdates, totalEnrollments, state);
    if (biometricPressure) alerts.push(biometricPressure);

    const saturationRisk = checkSaturationRisk(saturationIndex, state);
    if (saturationRisk) alerts.push(saturationRisk);

    const volatilityAlert = checkVolatilitySpike(volatilityIndex, state);
    if (volatilityAlert) alerts.push(volatilityAlert);

    // District-level checks (if available)
    Object.entries(districts).forEach(([districtName, districtMetrics]) => {
        const districtSaturation = checkSaturationRisk(districtMetrics.saturationIndex || 50, state, districtName);
        if (districtSaturation) alerts.push(districtSaturation);
    });

    return alerts;
};

/**
 * Prioritize alerts by severity and recency
 * 
 * @param {Array} alerts - Array of alert objects
 * @returns {Array} Sorted alerts (critical first, then by recency)
 */
export const prioritizeAlerts = (alerts) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };

    return [...alerts].sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;

        // If same severity, sort by confidence (higher first)
        return b.confidence - a.confidence;
    });
};

/**
 * Generate human-readable alert summary
 * 
 * @param {Array} alerts - Array of alert objects
 * @returns {string} Summary text
 */
export const generateAlertSummary = (alerts) => {
    const critical = alerts.filter(a => a.severity === SEVERITY.CRITICAL).length;
    const warning = alerts.filter(a => a.severity === SEVERITY.WARNING).length;
    const info = alerts.filter(a => a.severity === SEVERITY.INFO).length;

    if (alerts.length === 0) {
        return 'No active alerts. All indicators within normal ranges.';
    }

    const parts = [];
    if (critical > 0) parts.push(`${critical} critical`);
    if (warning > 0) parts.push(`${warning} warning`);
    if (info > 0) parts.push(`${info} informational`);

    return `${alerts.length} active alerts: ${parts.join(', ')}.`;
};
