/**
 * Data Ingestion Service
 * 
 * Handles CSV data import into Firestore with:
 * - Idempotent writes (prevents duplicates)
 * - Incremental processing
 * - Event-driven metric updates
 */

import {
    doc,
    setDoc,
    getDoc,
    writeBatch,
    serverTimestamp,
    increment
} from 'firebase/firestore';
import { db, isDemoMode } from '../config/firebase-config.js';
import { COLLECTIONS } from '../config/constants.js';
import {
    createEnrollmentEvent,
    createDemographicEvent,
    createBiometricEvent
} from './firestore-schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// CSV PARSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse CSV text into array of objects
 */
export const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length) {
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
 * Generate deterministic document ID for idempotent writes
 * Format: {date}_{state}_{district}_{pincode}
 */
export const generateEventId = (record) => {
    const sanitize = (str) => (str || 'unknown')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 30);

    return `${record.date || 'nodate'}_${sanitize(record.state)}_${sanitize(record.district)}_${record.pincode || '0'}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// BATCH INGESTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ingest enrollment data from CSV records
 * 
 * @param {Array} records - Parsed CSV records
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Object} Ingestion result { success, failed, duplicates }
 */
export const ingestEnrollmentData = async (records, onProgress = null) => {
    if (isDemoMode()) {
        console.log('[Demo Mode] Would ingest', records.length, 'enrollment records');
        return { success: records.length, failed: 0, duplicates: 0 };
    }

    const batchSize = 400; // Firestore batch limit is 500
    let success = 0;
    let failed = 0;
    let duplicates = 0;

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = records.slice(i, i + batchSize);

        for (const record of chunk) {
            try {
                const eventId = generateEventId(record);
                const docRef = doc(db, COLLECTIONS.ENROLLMENT_EVENTS, eventId);

                // Check for duplicate (idempotent)
                const existing = await getDoc(docRef);
                if (existing.exists()) {
                    duplicates++;
                    continue;
                }

                // Map CSV fields to schema
                const eventData = createEnrollmentEvent({
                    date: record.date,
                    state: record.state,
                    district: record.district,
                    pincode: parseInt(record.pincode) || 0,
                    age_0_5: parseInt(record.age_0_5) || parseInt(record['0-5 Years']) || 0,
                    age_5_17: parseInt(record.age_5_17) || parseInt(record['5-17 Years']) || 0,
                    age_18_plus: parseInt(record.age_18_greater) || parseInt(record['18+ Years']) || 0
                });

                batch.set(docRef, eventData);
                success++;
            } catch (err) {
                console.error('Failed to process record:', record, err);
                failed++;
            }
        }

        await batch.commit();

        if (onProgress) {
            onProgress(Math.min(i + batchSize, records.length), records.length);
        }
    }

    return { success, failed, duplicates };
};

/**
 * Ingest demographic update data from CSV records
 */
export const ingestDemographicData = async (records, onProgress = null) => {
    if (isDemoMode()) {
        console.log('[Demo Mode] Would ingest', records.length, 'demographic records');
        return { success: records.length, failed: 0, duplicates: 0 };
    }

    const batchSize = 400;
    let success = 0;
    let failed = 0;
    let duplicates = 0;

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = records.slice(i, i + batchSize);

        for (const record of chunk) {
            try {
                const eventId = `demo_${generateEventId(record)}`;
                const docRef = doc(db, COLLECTIONS.DEMOGRAPHIC_EVENTS, eventId);

                const existing = await getDoc(docRef);
                if (existing.exists()) {
                    duplicates++;
                    continue;
                }

                const eventData = createDemographicEvent({
                    date: record.date,
                    state: record.state,
                    district: record.district,
                    pincode: parseInt(record.pincode) || 0,
                    demo_age_5_17: parseInt(record.demo_age_5_17) || parseInt(record['5-17 Years']) || 0,
                    demo_age_17_plus: parseInt(record.demo_age_17_) || parseInt(record['17+ Years']) || 0
                });

                batch.set(docRef, eventData);
                success++;
            } catch (err) {
                console.error('Failed to process record:', record, err);
                failed++;
            }
        }

        await batch.commit();

        if (onProgress) {
            onProgress(Math.min(i + batchSize, records.length), records.length);
        }
    }

    return { success, failed, duplicates };
};

/**
 * Ingest biometric update data from CSV records
 */
export const ingestBiometricData = async (records, onProgress = null) => {
    if (isDemoMode()) {
        console.log('[Demo Mode] Would ingest', records.length, 'biometric records');
        return { success: records.length, failed: 0, duplicates: 0 };
    }

    const batchSize = 400;
    let success = 0;
    let failed = 0;
    let duplicates = 0;

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = records.slice(i, i + batchSize);

        for (const record of chunk) {
            try {
                const eventId = `bio_${generateEventId(record)}`;
                const docRef = doc(db, COLLECTIONS.BIOMETRIC_EVENTS, eventId);

                const existing = await getDoc(docRef);
                if (existing.exists()) {
                    duplicates++;
                    continue;
                }

                const eventData = createBiometricEvent({
                    date: record.date,
                    state: record.state,
                    district: record.district,
                    pincode: parseInt(record.pincode) || 0,
                    bio_age_5_17: parseInt(record.bio_age_5_17) || parseInt(record['5-17 Years']) || 0,
                    bio_age_17_plus: parseInt(record.bio_age_17_) || parseInt(record['17+ Years']) || 0
                });

                batch.set(docRef, eventData);
                success++;
            } catch (err) {
                console.error('Failed to process record:', record, err);
                failed++;
            }
        }

        await batch.commit();

        if (onProgress) {
            onProgress(Math.min(i + batchSize, records.length), records.length);
        }
    }

    return { success, failed, duplicates };
};

// ═══════════════════════════════════════════════════════════════════════════
// FILE UPLOAD HANDLER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle file upload and route to appropriate ingestion function
 * 
 * @param {File} file - Uploaded file
 * @param {string} dataType - 'enrollment' | 'demographic' | 'biometric'
 * @param {Function} onProgress - Progress callback
 * @returns {Object} Ingestion result
 */
export const handleFileUpload = async (file, dataType, onProgress = null) => {
    const text = await file.text();
    const records = parseCSV(text);

    if (records.length === 0) {
        return { success: 0, failed: 0, duplicates: 0, error: 'No valid records found in file' };
    }

    switch (dataType) {
        case 'enrollment':
            return ingestEnrollmentData(records, onProgress);
        case 'demographic':
            return ingestDemographicData(records, onProgress);
        case 'biometric':
            return ingestBiometricData(records, onProgress);
        default:
            return { success: 0, failed: 0, duplicates: 0, error: `Unknown data type: ${dataType}` };
    }
};
