/**
 * Real Data Loader Service
 * 
 * Loads and processes actual CSV files from the data directory.
 * Filters to only official 28 Indian states.
 */

import { STATE_POPULATION, THRESHOLDS, STATES, ALL_STATES_AND_UTS } from '../config/constants.js';

// ═══════════════════════════════════════════════════════════════════════════
// STATE NAME NORMALIZATION
// Maps variations in CSV data to official state names
// ═══════════════════════════════════════════════════════════════════════════

const STATE_NORMALIZATION_MAP = {
    // Standard names (case variations)
    'andhra pradesh': 'Andhra Pradesh',
    'arunachal pradesh': 'Arunachal Pradesh',
    'assam': 'Assam',
    'bihar': 'Bihar',
    'chhattisgarh': 'Chhattisgarh',
    'goa': 'Goa',
    'gujarat': 'Gujarat',
    'haryana': 'Haryana',
    'himachal pradesh': 'Himachal Pradesh',
    'jharkhand': 'Jharkhand',
    'karnataka': 'Karnataka',
    'kerala': 'Kerala',
    'madhya pradesh': 'Madhya Pradesh',
    'maharashtra': 'Maharashtra',
    'manipur': 'Manipur',
    'meghalaya': 'Meghalaya',
    'mizoram': 'Mizoram',
    'nagaland': 'Nagaland',
    'odisha': 'Odisha',
    'orissa': 'Odisha', // Old name
    'punjab': 'Punjab',
    'rajasthan': 'Rajasthan',
    'sikkim': 'Sikkim',
    'tamil nadu': 'Tamil Nadu',
    'tamilnadu': 'Tamil Nadu',
    'telangana': 'Telangana',
    'tripura': 'Tripura',
    'uttar pradesh': 'Uttar Pradesh',
    'uttarpradesh': 'Uttar Pradesh',
    'uttarakhand': 'Uttarakhand',
    'uttaranchal': 'Uttarakhand', // Old name
    'west bengal': 'West Bengal',
    'westbengal': 'West Bengal',
    // Union Territories
    'delhi': 'Delhi',
    'nct of delhi': 'Delhi',
    'new delhi': 'Delhi',
    'chandigarh': 'Chandigarh',
    'puducherry': 'Puducherry',
    'pondicherry': 'Puducherry', // Old name
    'jammu and kashmir': 'Jammu and Kashmir',
    'jammu & kashmir': 'Jammu and Kashmir',
    'j&k': 'Jammu and Kashmir',
    'j & k': 'Jammu and Kashmir',
    'ladakh': 'Ladakh',
    'lakshadweep': 'Lakshadweep',
    'andaman and nicobar islands': 'Andaman and Nicobar Islands',
    'andaman & nicobar islands': 'Andaman and Nicobar Islands',
    'andaman and nicobar': 'Andaman and Nicobar Islands',
    'a&n islands': 'Andaman and Nicobar Islands',
    'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'd&n haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu'
};

// Set of valid state names for fast lookup
const VALID_STATES_SET = new Set(ALL_STATES_AND_UTS.map(s => s.toLowerCase()));

/**
 * Normalize a state name from CSV to official name
 * Returns null if not a valid state
 */
export const normalizeStateName = (rawState) => {
    if (!rawState || typeof rawState !== 'string') return null;

    const cleaned = rawState.trim().toLowerCase();

    // Skip if it looks like a number (pincode/row id)
    if (/^\d+$/.test(cleaned)) return null;

    // Skip if too short (likely abbreviation or district code)
    if (cleaned.length < 3) return null;

    // Check normalization map first
    if (STATE_NORMALIZATION_MAP[cleaned]) {
        return STATE_NORMALIZATION_MAP[cleaned];
    }

    // Check if it's already a valid state name
    if (VALID_STATES_SET.has(cleaned)) {
        // Return properly capitalized version
        return ALL_STATES_AND_UTS.find(s => s.toLowerCase() === cleaned);
    }

    // Not a valid state (probably a district)
    return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// CSV DATA PATHS (Relative to project root)
// ═══════════════════════════════════════════════════════════════════════════

const DATA_PATHS = {
    enrollment: [
        'data/enrollment/api_data_aadhar_enrolment_0_500000.csv',
        'data/enrollment/api_data_aadhar_enrolment_500000_1000000.csv',
        'data/enrollment/api_data_aadhar_enrolment_1000000_1006029.csv'
    ],
    demographic: [
        'data/demographic/api_data_aadhar_demographic_0_500000.csv',
        'data/demographic/api_data_aadhar_demographic_500000_1000000.csv',
        'data/demographic/api_data_aadhar_demographic_1000000_1500000.csv',
        'data/demographic/api_data_aadhar_demographic_1500000_2000000.csv',
        'data/demographic/api_data_aadhar_demographic_2000000_2071700.csv'
    ],
    biometric: [
        'data/biometric/api_data_aadhar_biometric_0_500000.csv',
        'data/biometric/api_data_aadhar_biometric_500000_1000000.csv',
        'data/biometric/api_data_aadhar_biometric_1000000_1500000.csv',
        'data/biometric/api_data_aadhar_biometric_1500000_1861108.csv'
    ]
};

// ═══════════════════════════════════════════════════════════════════════════
// CSV PARSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse CSV text into array of objects
 */
export const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length) {
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index];
            });
            records.push(record);
        }
    }

    return records;
};

/**
 * Fetch and parse a CSV file
 */
export const fetchCSV = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            console.warn(`Failed to fetch ${path}: ${response.status}`);
            return [];
        }
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.warn(`Error fetching ${path}:`, error.message);
        return [];
    }
};

/**
 * Load all CSV files of a given type
 */
export const loadDataType = async (type, onProgress = null) => {
    const paths = DATA_PATHS[type] || [];
    let allRecords = [];

    for (let i = 0; i < paths.length; i++) {
        const records = await fetchCSV(paths[i]);
        // Use concat instead of push(...records) to avoid stack overflow with large arrays
        allRecords = allRecords.concat(records);

        if (onProgress) {
            onProgress(i + 1, paths.length, paths[i]);
        }
    }

    console.log(`Loaded ${allRecords.length} ${type} records from ${paths.length} files`);
    return allRecords;
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Aggregate enrollment data by state
 * Only includes officially recognized states and UTs
 */
export const aggregateEnrollmentByState = (records) => {
    const stateData = {};
    let skippedCount = 0;

    records.forEach(record => {
        // Normalize state name - filters out districts and invalid entries
        const state = normalizeStateName(record.state);
        if (!state) {
            skippedCount++;
            return;
        }

        if (!stateData[state]) {
            stateData[state] = {
                state: state,
                total_enrollments: 0,
                age_0_5: 0,
                age_5_17: 0,
                age_18_plus: 0,
                districts: new Set(),
                dates: new Set(),
                dailyEnrollments: {}
            };
        }

        // Parse age group columns (handle different column names)
        const age_0_5 = parseInt(record['age_0_5'] || record['0-5_years'] || record['0_5'] || 0) || 0;
        const age_5_17 = parseInt(record['age_5_17'] || record['5-17_years'] || record['5_17'] || 0) || 0;
        const age_18_plus = parseInt(record['age_18_greater'] || record['18+_years'] || record['age_18_plus'] || record['18_greater'] || 0) || 0;

        const total = age_0_5 + age_5_17 + age_18_plus;

        stateData[state].age_0_5 += age_0_5;
        stateData[state].age_5_17 += age_5_17;
        stateData[state].age_18_plus += age_18_plus;
        stateData[state].total_enrollments += total;

        if (record.district) stateData[state].districts.add(record.district);
        if (record.date) {
            stateData[state].dates.add(record.date);
            stateData[state].dailyEnrollments[record.date] =
                (stateData[state].dailyEnrollments[record.date] || 0) + total;
        }
    });

    // Convert sets to counts
    Object.values(stateData).forEach(state => {
        state.district_count = state.districts.size;
        state.date_count = state.dates.size;
        delete state.districts;
        delete state.dates;
    });

    return stateData;
};

/**
 * Aggregate demographic update data by state
 */
export const aggregateDemographicByState = (records) => {
    const stateData = {};

    records.forEach(record => {
        const state = normalizeStateName(record.state);
        if (!state) return;

        if (!stateData[state]) {
            stateData[state] = {
                state: state,
                total_demographic_updates: 0,
                demo_5_17: 0,
                demo_17_plus: 0,
                dailyUpdates: {}
            };
        }

        const demo_5_17 = parseInt(record['demo_age_5_17'] || record['5-17_years'] || 0) || 0;
        const demo_17_plus = parseInt(record['demo_age_17_'] || record['17+_years'] || record['demo_age_17_plus'] || 0) || 0;

        const total = demo_5_17 + demo_17_plus;

        stateData[state].demo_5_17 += demo_5_17;
        stateData[state].demo_17_plus += demo_17_plus;
        stateData[state].total_demographic_updates += total;

        if (record.date) {
            stateData[state].dailyUpdates[record.date] =
                (stateData[state].dailyUpdates[record.date] || 0) + total;
        }
    });

    return stateData;
};

/**
 * Aggregate biometric update data by state
 */
export const aggregateBiometricByState = (records) => {
    const stateData = {};

    records.forEach(record => {
        const state = normalizeStateName(record.state);
        if (!state) return;

        if (!stateData[state]) {
            stateData[state] = {
                state: state,
                total_biometric_updates: 0,
                bio_5_17: 0,
                bio_17_plus: 0
            };
        }

        const bio_5_17 = parseInt(record['bio_age_5_17'] || record['5-17_years'] || 0) || 0;
        const bio_17_plus = parseInt(record['bio_age_17_'] || record['17+_years'] || record['bio_age_17_plus'] || 0) || 0;

        stateData[state].bio_5_17 += bio_5_17;
        stateData[state].bio_17_plus += bio_17_plus;
        stateData[state].total_biometric_updates += bio_5_17 + bio_17_plus;
    });

    return stateData;
};

// ═══════════════════════════════════════════════════════════════════════════
// INDICATOR CALCULATIONS (REAL DATA)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate real indicators from aggregated data
 */
export const calculateRealIndicators = (enrollmentData, demographicData, biometricData) => {
    const metrics = {};

    // Combine all states from all data sources
    const allStates = new Set([
        ...Object.keys(enrollmentData),
        ...Object.keys(demographicData),
        ...Object.keys(biometricData)
    ]);

    allStates.forEach(state => {
        const enrollment = enrollmentData[state] || { total_enrollments: 0, dailyEnrollments: {} };
        const demographic = demographicData[state] || { total_demographic_updates: 0, dailyUpdates: {} };
        const biometric = biometricData[state] || { total_biometric_updates: 0 };

        // Get population (millions -> actual)
        const populationMillions = STATE_POPULATION[state] || 50;
        const population = populationMillions * 1_000_000;

        // Calculate Saturation Index
        const saturationIndex = Math.min((enrollment.total_enrollments / population) * 100, 120);

        // Calculate Enrollment Velocity (from daily data)
        const dailyValues = Object.values(enrollment.dailyEnrollments || {});
        const velocity7d = dailyValues.length > 0
            ? dailyValues.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, dailyValues.length)
            : 0;
        const velocity30d = dailyValues.length > 0
            ? dailyValues.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, dailyValues.length)
            : velocity7d;

        // Calculate Volatility Index
        let volatilityIndex = 0;
        if (dailyValues.length >= 2) {
            const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
            if (mean > 0) {
                const variance = dailyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyValues.length;
                volatilityIndex = (Math.sqrt(variance) / mean) * 100;
            }
        }

        // Calculate Biometric Stability Score
        let stabilityScore = 100;
        if (enrollment.total_enrollments > 0) {
            const refreshRate = (biometric.total_biometric_updates / enrollment.total_enrollments) * 100;
            stabilityScore = Math.max(0, 100 - refreshRate);
        }

        // Calculate Health Score (weighted composite)
        const healthScore = (
            saturationIndex * 0.30 +
            Math.min(100, (velocity7d / Math.max(velocity30d, 1)) * 50) * 0.25 +
            70 * 0.20 + // Default compliance
            stabilityScore * 0.15 +
            65 * 0.10 // Default infrastructure
        );

        // Determine trend
        let trend = 'stable';
        if (velocity30d > 0) {
            const change = ((velocity7d - velocity30d) / velocity30d) * 100;
            if (change > 10) trend = 'up';
            else if (change < -10) trend = 'down';
        }

        metrics[state] = {
            state,
            total_enrollments: enrollment.total_enrollments,
            total_demographic_updates: demographic.total_demographic_updates,
            total_biometric_updates: biometric.total_biometric_updates,
            population_millions: populationMillions,
            saturation_index: Math.round(saturationIndex * 10) / 10,
            enrollment_velocity_7d: Math.round(velocity7d),
            enrollment_velocity_30d: Math.round(velocity30d),
            volatility_index: Math.round(volatilityIndex * 10) / 10,
            stability_score: Math.round(stabilityScore),
            health_score: Math.round(healthScore),
            trend,
            district_count: enrollment.district_count || 0,
            date_count: enrollment.date_count || 0,
            last_updated: new Date().toISOString()
        };
    });

    return metrics;
};

// ═══════════════════════════════════════════════════════════════════════════
// ALERT GENERATION (REAL DATA)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate alerts from real metrics
 */
export const generateRealAlerts = (metrics) => {
    const alerts = [];

    Object.values(metrics).forEach(m => {
        // Saturation Risk
        if (m.saturation_index < THRESHOLDS.saturation.critical) {
            alerts.push({
                id: `sat_${m.state}`,
                type: 'saturation_risk',
                severity: 'critical',
                state: m.state,
                indicator: 'Saturation Index',
                currentValue: m.saturation_index,
                baselineValue: 80,
                deviationPct: ((m.saturation_index - 80) / 80) * 100,
                explanation: `Critically low Aadhaar coverage in ${m.state} (${m.saturation_index.toFixed(1)}%). Population: ${m.population_millions}M, Enrollments: ${m.total_enrollments.toLocaleString()}`,
                suggestedAction: 'Deploy mobile enrollment camps. Partner with ASHA workers for door-to-door enrollment drives.',
                confidence: 0.95,
                timestamp: new Date()
            });
        } else if (m.saturation_index < THRESHOLDS.saturation.warning) {
            alerts.push({
                id: `sat_${m.state}`,
                type: 'saturation_risk',
                severity: 'warning',
                state: m.state,
                indicator: 'Saturation Index',
                currentValue: m.saturation_index,
                baselineValue: 80,
                deviationPct: ((m.saturation_index - 80) / 80) * 100,
                explanation: `Below-target Aadhaar coverage in ${m.state} (${m.saturation_index.toFixed(1)}%). Gaps exist in reaching target population.`,
                suggestedAction: 'Increase enrollment center hours. Target awareness campaigns to underserved communities.',
                confidence: 0.85,
                timestamp: new Date()
            });
        }

        // Velocity Drop
        if (m.enrollment_velocity_30d > 0) {
            const dropPercent = ((m.enrollment_velocity_30d - m.enrollment_velocity_7d) / m.enrollment_velocity_30d) * 100;
            if (dropPercent >= 50) {
                alerts.push({
                    id: `vel_${m.state}`,
                    type: 'enrollment_drop',
                    severity: 'critical',
                    state: m.state,
                    indicator: 'Enrollment Velocity',
                    currentValue: m.enrollment_velocity_7d,
                    baselineValue: m.enrollment_velocity_30d,
                    deviationPct: -dropPercent,
                    explanation: `Enrollment velocity in ${m.state} dropped ${dropPercent.toFixed(0)}%. Current: ${m.enrollment_velocity_7d.toLocaleString()}/day vs 30-day avg: ${m.enrollment_velocity_30d.toLocaleString()}/day`,
                    suggestedAction: 'Investigate infrastructure outages or resource allocation gaps. Coordinate with regional enrollment centers.',
                    confidence: 0.9,
                    timestamp: new Date()
                });
            } else if (dropPercent >= 30) {
                alerts.push({
                    id: `vel_${m.state}`,
                    type: 'enrollment_drop',
                    severity: 'warning',
                    state: m.state,
                    indicator: 'Enrollment Velocity',
                    currentValue: m.enrollment_velocity_7d,
                    baselineValue: m.enrollment_velocity_30d,
                    deviationPct: -dropPercent,
                    explanation: `Enrollment velocity in ${m.state} declined ${dropPercent.toFixed(0)}% from baseline.`,
                    suggestedAction: 'Monitor for continued decline. Review enrollment center capacity.',
                    confidence: 0.85,
                    timestamp: new Date()
                });
            }
        }

        // High Volatility
        if (m.volatility_index > THRESHOLDS.volatility.high) {
            alerts.push({
                id: `vol_${m.state}`,
                type: 'volatility_spike',
                severity: 'warning',
                state: m.state,
                indicator: 'Volatility Index',
                currentValue: m.volatility_index,
                baselineValue: 50,
                deviationPct: ((m.volatility_index - 50) / 50) * 100,
                explanation: `High operational volatility in ${m.state} (CV: ${m.volatility_index.toFixed(0)}%). Daily patterns are highly irregular.`,
                suggestedAction: 'Review enrollment center operating hours and staffing consistency.',
                confidence: 0.7,
                timestamp: new Date()
            });
        }

        // Low Biometric Stability
        if (m.stability_score < 40) {
            alerts.push({
                id: `bio_${m.state}`,
                type: 'biometric_pressure',
                severity: 'warning',
                state: m.state,
                indicator: 'Biometric Stability',
                currentValue: m.stability_score,
                baselineValue: 80,
                deviationPct: ((m.stability_score - 80) / 80) * 100,
                explanation: `High biometric update pressure in ${m.state} (Stability: ${m.stability_score}). May indicate aging population or quality issues.`,
                suggestedAction: 'Audit biometric capture quality. Consider targeted infrastructure upgrades.',
                confidence: 0.8,
                timestamp: new Date()
            });
        }
    });

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
};

// ═══════════════════════════════════════════════════════════════════════════
// INSIGHT GENERATION (REAL DATA)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate policy insights from real metrics
 */
export const generateRealInsights = (metrics) => {
    const insights = [];
    const metricsArray = Object.values(metrics);

    if (metricsArray.length === 0) return insights;

    // Identify lowest saturation states
    const sortedBySaturation = metricsArray
        .filter(m => m.saturation_index > 0)
        .sort((a, b) => a.saturation_index - b.saturation_index);

    if (sortedBySaturation.length >= 3) {
        const bottomThree = sortedBySaturation.slice(0, 3);
        insights.push({
            id: 'insight_saturation',
            category: 'policy',
            title: 'Enrollment Coverage Gap Identified',
            description: `Three states show significantly lower Aadhaar saturation: ${bottomThree.map(s => `${s.state} (${s.saturation_index.toFixed(1)}%)`).join(', ')}. Combined population: ${bottomThree.reduce((sum, s) => sum + s.population_millions, 0).toFixed(0)}M people in underserved regions.`,
            affectedRegions: bottomThree.map(s => s.state),
            recommendation: 'Prioritize mobile enrollment camps and ASHA worker integration in these states. Consider extended hours and weekend operations.',
            priority: 'high',
            dataPoints: Object.fromEntries(bottomThree.map(s => [s.state, s.saturation_index])),
            timestamp: new Date()
        });
    }

    // Identify highest enrollment states
    const sortedByEnrollment = metricsArray
        .filter(m => m.total_enrollments > 0)
        .sort((a, b) => b.total_enrollments - a.total_enrollments);

    if (sortedByEnrollment.length >= 3) {
        const topThree = sortedByEnrollment.slice(0, 3);
        const totalEnrollments = metricsArray.reduce((sum, m) => sum + m.total_enrollments, 0);
        const topThreeShare = (topThree.reduce((sum, m) => sum + m.total_enrollments, 0) / totalEnrollments * 100).toFixed(0);

        insights.push({
            id: 'insight_concentration',
            category: 'operational',
            title: 'Enrollment Concentration Analysis',
            description: `Top 3 states (${topThree.map(s => s.state).join(', ')}) account for ${topThreeShare}% of all enrollments. Total: ${totalEnrollments.toLocaleString()} enrollments across ${metricsArray.length} states.`,
            affectedRegions: topThree.map(s => s.state),
            recommendation: 'Ensure infrastructure capacity matches demand in high-volume states. Consider load balancing strategies.',
            priority: 'medium',
            dataPoints: Object.fromEntries(topThree.map(s => [s.state, s.total_enrollments])),
            timestamp: new Date()
        });
    }

    // Velocity trends analysis
    const decliningStates = metricsArray.filter(m => m.trend === 'down' && m.enrollment_velocity_7d > 0);
    if (decliningStates.length >= 2) {
        insights.push({
            id: 'insight_velocity',
            category: 'operational',
            title: 'Multiple States Showing Declining Velocity',
            description: `${decliningStates.length} states show declining enrollment velocity: ${decliningStates.slice(0, 5).map(s => s.state).join(', ')}. This may indicate seasonal patterns or operational challenges.`,
            affectedRegions: decliningStates.map(s => s.state),
            recommendation: 'Cross-reference with festival calendars and operational schedules. Consider targeted campaigns.',
            priority: 'medium',
            timestamp: new Date()
        });
    }

    return insights;
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DATA LOADER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load all real data and compute metrics
 */
export const loadAllRealData = async (onProgress = null) => {
    console.log('📊 Loading REAL data from CSV files...');

    // Load all data types
    if (onProgress) onProgress('enrollment', 0, 3);
    const enrollmentRecords = await loadDataType('enrollment');

    if (onProgress) onProgress('demographic', 1, 3);
    const demographicRecords = await loadDataType('demographic');

    if (onProgress) onProgress('biometric', 2, 3);
    const biometricRecords = await loadDataType('biometric');

    // Aggregate by state
    console.log('📈 Aggregating data by state...');
    const enrollmentByState = aggregateEnrollmentByState(enrollmentRecords);
    const demographicByState = aggregateDemographicByState(demographicRecords);
    const biometricByState = aggregateBiometricByState(biometricRecords);

    // Calculate real indicators
    console.log('🔢 Calculating real indicators...');
    const metrics = calculateRealIndicators(enrollmentByState, demographicByState, biometricByState);

    // Generate alerts
    console.log('⚠️ Generating alerts...');
    const alerts = generateRealAlerts(metrics);

    // Generate insights
    console.log('💡 Generating insights...');
    const insights = generateRealInsights(metrics);

    // Summary
    const totalEnrollments = Object.values(metrics).reduce((sum, m) => sum + m.total_enrollments, 0);
    const totalDemographic = Object.values(metrics).reduce((sum, m) => sum + m.total_demographic_updates, 0);
    const totalBiometric = Object.values(metrics).reduce((sum, m) => sum + m.total_biometric_updates, 0);

    console.log(`✅ Loaded REAL data: ${totalEnrollments.toLocaleString()} enrollments, ${totalDemographic.toLocaleString()} demographic updates, ${totalBiometric.toLocaleString()} biometric updates across ${Object.keys(metrics).length} states`);

    return {
        metrics,
        alerts,
        insights,
        summary: {
            totalEnrollments,
            totalDemographic,
            totalBiometric,
            stateCount: Object.keys(metrics).length,
            alertCount: alerts.length,
            insightCount: insights.length
        }
    };
};
