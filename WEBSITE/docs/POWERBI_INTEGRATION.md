# Power BI Integration Guide

## Overview

Power BI serves as the **decision-support lens** for executive analysis. It consumes pre-aggregated data exports, never raw event data, ensuring consistent indicators with the live dashboard.

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW TO POWER BI                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Live System                 Export Layer          Power BI │
│  ───────────                 ────────────          ──────── │
│                                                              │
│  ┌─────────────┐         ┌───────────────┐                  │
│  │ Firestore   │────────▶│ Python Export │                  │
│  │ Collections │         │ (Scheduled)   │                  │
│  └─────────────┘         └───────┬───────┘                  │
│                                  │                           │
│                                  ▼                           │
│                          ┌───────────────┐    ┌───────────┐ │
│                          │ CSV Exports   │───▶│ Power BI  │ │
│                          │ (Aggregated)  │    │ Dataset   │ │
│                          └───────────────┘    └───────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Export Files

The Python analytics module generates three export files:

### 1. `powerbi_state_enrollment.csv`
State-level enrollment aggregates with indicators.

| Column | Description |
|--------|-------------|
| state | State name |
| age_0_5, age_5_17, age_18_plus | Enrollments by age group |
| total | Total enrollments |
| population_millions | Estimated population |
| saturation_index | Coverage percentage |

### 2. `powerbi_daily_enrollment.csv`
Time-series data for trend analysis.

| Column | Description |
|--------|-------------|
| date | Date (YYYY-MM-DD) |
| total | Daily enrollment count |
| (age columns) | Daily counts by age group |

### 3. `powerbi_indicators.csv`
Pre-calculated indicators by state.

| Column | Description |
|--------|-------------|
| state | State name |
| saturation_index | 0-100 coverage score |
| saturation_status | healthy/warning/critical |
| volatility_index | Coefficient of variation |
| volatility_status | stable/moderate/high |

---

## Generating Exports

```bash
cd WEBSITE/analytics

# Generate Power BI exports
python batch_analytics.py --mode powerbi --data-dir ../../data

# Output files will be in ./outputs/powerbi/
```

---

## Power BI Setup

### Step 1: Import Data

1. Open Power BI Desktop
2. **Get Data → Text/CSV**
3. Import all three CSV files
4. Verify column types (especially dates)

### Step 2: Create Relationships

```
powerbi_state_enrollment.state ←→ powerbi_indicators.state (1:1)
powerbi_daily_enrollment.date ←→ Date table (if using)
```

### Step 3: Recommended Visualizations

| Visual | Purpose | Data Source |
|--------|---------|-------------|
| Map | Geographic coverage | state_enrollment |
| Card | Key metrics | indicators |
| Line Chart | Enrollment trends | daily_enrollment |
| Bar Chart | State comparison | indicators |
| Gauge | Saturation index | indicators |

---

## Indicator Alignment

The same formulas are used in both systems:

| Indicator | Live Dashboard | Power BI |
|-----------|----------------|----------|
| Saturation | Real-time calc | Pre-calculated |
| Volatility | Rolling 7-day | Batch 7-day |
| Health Score | Composite | Available in indicators.csv |

**Important**: Power BI should NEVER recalculate indicators. Use the pre-calculated values from `powerbi_indicators.csv` to ensure consistency.

---

## Refresh Schedule

For operational use:

| Export | Frequency | Trigger |
|--------|-----------|---------|
| State aggregates | Daily | 6:00 AM IST |
| Daily time-series | Daily | 6:00 AM IST |
| Indicators | Daily | 6:00 AM IST |

Power BI can be configured to auto-refresh from a shared location.

---

## Sample DAX Measures

```dax
// Average Saturation Index
Avg Saturation = AVERAGE(powerbi_indicators[saturation_index])

// Count of Critical States
Critical States = 
CALCULATE(
    COUNTROWS(powerbi_indicators),
    powerbi_indicators[saturation_status] = "critical"
)

// Total Enrollments
Total Enrollments = SUM(powerbi_state_enrollment[total])
```

---

## Limitations

1. **No Real-Time Updates**: Power BI uses batch exports
2. **Historical Only**: Cannot show live operational changes
3. **Aggregated Data**: Same privacy constraints as live system

For real-time monitoring, use the live dashboard. Power BI is for strategic analysis and reporting.
