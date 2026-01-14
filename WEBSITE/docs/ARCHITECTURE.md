# System Architecture Documentation

## Overview

The **Aadhaar Societal Intelligence Platform** is a real-time analytics system designed for national-scale digital identity operations. It transforms raw Aadhaar operational data into policy-ready intelligence through event-driven architecture and deterministic indicator calculations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DATA SOURCES              PROCESSING              CONSUMPTION              │
│  ───────────               ──────────              ───────────              │
│                                                                              │
│  ┌──────────┐         ┌─────────────────┐         ┌──────────────┐         │
│  │ CSV      │────────▶│ Data Ingestion  │────────▶│ Live         │         │
│  │ Imports  │         │ (Idempotent)    │         │ Dashboard    │         │
│  └──────────┘         └────────┬────────┘         └──────────────┘         │
│                                │                                            │
│  ┌──────────┐                  ▼                  ┌──────────────┐         │
│  │ API      │         ┌─────────────────┐         │ Regional     │         │
│  │ Feeds    │────────▶│ Firestore       │────────▶│ Analysis     │         │
│  └──────────┘         │ (Event Store)   │         └──────────────┘         │
│                       └────────┬────────┘                                   │
│                                │                  ┌──────────────┐         │
│                                ▼                  │ Policy       │         │
│                       ┌─────────────────┐         │ Insights     │         │
│                       │ Aggregation     │────────▶└──────────────┘         │
│                       │ Engine          │                                   │
│                       └────────┬────────┘         ┌──────────────┐         │
│                                │                  │ Python       │         │
│                                ▼                  │ Analytics    │         │
│                       ┌─────────────────┐         └───────┬──────┘         │
│                       │ Indicator       │                  │               │
│                       │ Calculation     │                  ▼               │
│                       └────────┬────────┘         ┌──────────────┐         │
│                                │                  │ Power BI     │         │
│                                ▼                  │ Reports      │         │
│                       ┌─────────────────┐         └──────────────┘         │
│                       │ Alert           │                                   │
│                       │ Detection       │                                   │
│                       └─────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### 1. Database-First Architecture
- **Firestore** is the single source of truth
- No direct writes from UI to storage
- All data flows through validated ingestion pipeline

### 2. Event-Driven Updates
- Changes trigger real-time recalculations
- Incremental aggregation (not full recompute)
- Rolling windows for temporal analysis

### 3. Deterministic, Explainable Logic
- All indicators use transparent formulas
- Every alert includes plain-language explanation
- No black-box ML for policy-critical decisions

### 4. Separation of Live vs Batch
- Live dashboard: Sub-second updates, recent data
- Batch analytics: Deep historical analysis, validation
- Power BI: Executive drill-down, comparisons

---

## Component Details

### Data Ingestion Layer
**File:** `src/services/data-ingestion.js`

- Parses CSV files from operational systems
- Generates deterministic document IDs for idempotency
- Batch writes to Firestore (400 per batch)
- Tracks ingestion progress and errors

### Aggregation Engine
**File:** `src/services/aggregation-engine.js`

- Computes rolling window aggregates (7d, 30d)
- Updates state/district metrics incrementally
- Triggers indicator recalculation on changes
- Generates cross-state insights

### Indicator Engine
**File:** `src/services/indicator-engine.js`

| Indicator | Purpose | Formula |
|-----------|---------|---------|
| Saturation Index | Coverage measurement | (enrollments ÷ population) × 100 |
| Volatility Index | Operational stability | (σ ÷ μ) × 100 |
| Biometric Stability | Refresh pressure | 100 - (bio_updates ÷ enrollments × 100) |
| Enrollment Velocity | Rate of change | Σ(daily_enrollments) ÷ days |
| Migration Stress | Demographic movement | (current ÷ baseline) - 1 |
| Health Score | Composite indicator | Weighted average of above |

### Alert Engine
**File:** `src/services/alert-engine.js`

- Rule-based anomaly detection
- Configurable thresholds per indicator
- Severity levels: INFO, WARNING, CRITICAL
- Suggested policy actions for each alert type

---

## Firestore Collections

```
enrollment_events/
├── {eventId}
│   ├── timestamp
│   ├── date, state, district, pincode
│   ├── age_0_5, age_5_17, age_18_plus
│   └── total, processed

live_metrics/
├── {state}
│   ├── total_enrollments, total_demographic_updates
│   ├── saturation_index, volatility_index
│   ├── health_score, trend
│   └── last_updated

alerts/
├── {alertId}
│   ├── type, severity, state
│   ├── indicator, current_value, baseline_value
│   ├── explanation, suggested_action
│   └── confidence, acknowledged
```

---

## Security & Privacy

- **No PII Storage**: Only aggregated counts, no personal data
- **Aggregation-Only Access**: Firestore rules prevent raw data queries
- **Audit Trail**: All changes timestamped with source
- **No Biometric Reconstruction**: Statistical summaries only

---

## Deployment Options

1. **Firebase Hosting** - Static frontend + Firestore backend
2. **Cloud Functions** - Scheduled indicator recalculation
3. **Local Development** - Demo mode with sample data
