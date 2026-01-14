/**
 * System Constants for Aadhaar Intelligence Platform
 * 
 * Contains thresholds, indicator formulas, state mappings, and configuration.
 * All values are derived from UIDAI operational guidelines and India census data.
 */

// ═══════════════════════════════════════════════════════════════════════════
// INDICATOR THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════
export const THRESHOLDS = {
    // Enrollment Saturation Index (0-100)
    saturation: {
        critical: 40,    // Below 40% is critical concern
        warning: 60,     // Below 60% needs attention
        healthy: 80      // Above 80% is healthy
    },

    // Update Volatility Index (coefficient of variation %)
    volatility: {
        stable: 50,      // < 50% is stable
        moderate: 100,   // 50-100% is moderate
        high: 150        // > 150% is high volatility (alert)
    },

    // Biometric Stability Score (0-100)
    biometricStability: {
        critical: 40,
        warning: 60,
        healthy: 80
    },

    // Enrollment Velocity Drop (% decline from 30-day baseline)
    velocityDrop: {
        warning: 30,     // 30% drop triggers warning
        critical: 50     // 50% drop triggers critical
    },

    // Migration Stress (% above baseline)
    migrationStress: {
        info: 100,       // 100-150% above baseline
        warning: 150,    // 150-200% above baseline
        critical: 200    // > 200% above baseline
    },

    // Regional Health Score (composite, 0-100)
    healthScore: {
        critical: 40,
        warning: 50,
        moderate: 70,
        healthy: 85
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// ROLLING WINDOW CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════
export const WINDOWS = {
    short: 7,          // 7-day rolling window
    medium: 30,        // 30-day rolling window
    long: 90           // 90-day rolling window (historical)
};

// ═══════════════════════════════════════════════════════════════════════════
// INDICATOR WEIGHTS FOR HEALTH SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════
export const HEALTH_SCORE_WEIGHTS = {
    saturation: 0.30,
    enrollmentVelocity: 0.25,
    updateCompliance: 0.20,
    biometricStability: 0.15,
    infrastructureAccess: 0.10
};

// ═══════════════════════════════════════════════════════════════════════════
// ALERT SEVERITY LEVELS
// ═══════════════════════════════════════════════════════════════════════════
export const SEVERITY = {
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical'
};

// ═══════════════════════════════════════════════════════════════════════════
// ALERT TYPES
// ═══════════════════════════════════════════════════════════════════════════
export const ALERT_TYPES = {
    ENROLLMENT_DROP: 'enrollment_drop',
    MIGRATION_STRESS: 'migration_stress',
    BIOMETRIC_PRESSURE: 'biometric_pressure',
    SATURATION_RISK: 'saturation_risk',
    VOLATILITY_SPIKE: 'volatility_spike',
    INFRASTRUCTURE_GAP: 'infrastructure_gap'
};

// ═══════════════════════════════════════════════════════════════════════════
// INDIAN STATES (28 States Only)
// ═══════════════════════════════════════════════════════════════════════════
export const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Union Territories (8 UTs) - for reference
export const UNION_TERRITORIES = [
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Combined list for validation
export const ALL_STATES_AND_UTS = [...STATES, ...UNION_TERRITORIES];

// Set for fast lookup (includes common variations)
export const VALID_STATE_NAMES = new Set([
    ...ALL_STATES_AND_UTS,
    // Common variations/abbreviations in data
    'Andhra pradesh', 'Tamil nadu', 'West bengal', 'Madhya pradesh',
    'Uttar pradesh', 'Himachal pradesh', 'Arunachal pradesh',
    'Jammu And Kashmir', 'Jammu & Kashmir', 'J&K',
    'Dadra And Nagar Haveli', 'Daman And Diu', 'D&N Haveli',
    'NCT of Delhi', 'NCT Delhi', 'New Delhi'
]);

// ═══════════════════════════════════════════════════════════════════════════
// ESTIMATED POPULATION BY STATE (2024 estimates, in millions)
// Used for saturation index calculation
// ═══════════════════════════════════════════════════════════════════════════
export const STATE_POPULATION = {
    'Uttar Pradesh': 240.0,
    'Maharashtra': 130.0,
    'Bihar': 128.0,
    'West Bengal': 100.0,
    'Madhya Pradesh': 87.0,
    'Tamil Nadu': 80.0,
    'Rajasthan': 82.0,
    'Karnataka': 70.0,
    'Gujarat': 72.0,
    'Andhra Pradesh': 53.0,
    'Odisha': 47.0,
    'Telangana': 40.0,
    'Kerala': 36.0,
    'Jharkhand': 40.0,
    'Assam': 36.0,
    'Punjab': 31.0,
    'Chhattisgarh': 30.0,
    'Haryana': 30.0,
    'Delhi': 21.0,
    'Jammu and Kashmir': 14.0,
    'Uttarakhand': 12.0,
    'Himachal Pradesh': 8.0,
    'Tripura': 4.5,
    'Meghalaya': 4.0,
    'Manipur': 3.5,
    'Nagaland': 2.5,
    'Goa': 1.6,
    'Arunachal Pradesh': 1.7,
    'Puducherry': 1.7,
    'Mizoram': 1.3,
    'Chandigarh': 1.2,
    'Sikkim': 0.7,
    'Andaman and Nicobar Islands': 0.4,
    'Dadra and Nagar Haveli and Daman and Diu': 0.6,
    'Ladakh': 0.3,
    'Lakshadweep': 0.07
};

// ═══════════════════════════════════════════════════════════════════════════
// UI CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
export const UI_CONFIG = {
    refreshInterval: 5000,     // 5 seconds for live updates
    chartAnimationDuration: 300,
    maxAlertsDisplay: 10,
    maxInsightsDisplay: 5
};

// ═══════════════════════════════════════════════════════════════════════════
// FIRESTORE COLLECTION NAMES
// ═══════════════════════════════════════════════════════════════════════════
export const COLLECTIONS = {
    ENROLLMENT_EVENTS: 'enrollment_events',
    DEMOGRAPHIC_EVENTS: 'demographic_update_events',
    BIOMETRIC_EVENTS: 'biometric_update_events',
    LIVE_METRICS: 'live_metrics',
    ROLLING_WINDOWS: 'rolling_windows',
    ALERTS: 'alerts',
    INSIGHTS: 'insights'
};
