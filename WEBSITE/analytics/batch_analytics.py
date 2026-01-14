"""
Batch Analytics Module for Aadhaar Intelligence Platform

This module provides offline analytics capabilities for:
- Univariate analysis (single variable distributions)
- Bivariate analysis (correlations between two variables)
- Trivariate analysis (interaction effects)
- Forecasting and trend projection
- Indicator validation against live system

Usage:
    python batch_analytics.py --mode analyze --data-dir ../data
    python batch_analytics.py --mode validate --export-dir ./exports
    python batch_analytics.py --mode report --output ./reports
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import json
import warnings
warnings.filterwarnings('ignore')

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

CONFIG = {
    'windows': {
        'short': 7,
        'medium': 30,
        'long': 90
    },
    'thresholds': {
        'saturation_critical': 40,
        'saturation_warning': 60,
        'volatility_high': 150,
        'velocity_drop_warning': 30
    },
    'population': {
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
        'Telangana': 40.0,
        'Kerala': 36.0,
        'Jharkhand': 40.0,
        'Odisha': 47.0,
        'Punjab': 31.0
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# DATA LOADING
# ═══════════════════════════════════════════════════════════════════════════

def load_csv_files(directory: str, pattern: str = '*.csv') -> pd.DataFrame:
    """Load and concatenate all CSV files matching pattern in directory."""
    path = Path(directory)
    files = list(path.glob(pattern))
    
    if not files:
        print(f"No files found matching {pattern} in {directory}")
        return pd.DataFrame()
    
    dfs = []
    for file in files:
        try:
            df = pd.read_csv(file)
            df['source_file'] = file.name
            dfs.append(df)
            print(f"  Loaded {file.name}: {len(df)} records")
        except Exception as e:
            print(f"  Error loading {file.name}: {e}")
    
    if dfs:
        return pd.concat(dfs, ignore_index=True)
    return pd.DataFrame()


def load_all_data(data_dir: str) -> dict:
    """Load all data sources: enrollment, demographic, biometric."""
    print("\n📊 Loading data sources...")
    
    data = {}
    
    # Enrollment data
    enrollment_dir = os.path.join(data_dir, 'enrollment')
    if os.path.exists(enrollment_dir):
        print("\n  Enrollment data:")
        data['enrollment'] = load_csv_files(enrollment_dir)
    
    # Demographic data
    demographic_dir = os.path.join(data_dir, 'demographic')
    if os.path.exists(demographic_dir):
        print("\n  Demographic data:")
        data['demographic'] = load_csv_files(demographic_dir)
    
    # Biometric data
    biometric_dir = os.path.join(data_dir, 'biometric')
    if os.path.exists(biometric_dir):
        print("\n  Biometric data:")
        data['biometric'] = load_csv_files(biometric_dir)
    
    return data


def preprocess_data(df: pd.DataFrame, date_col: str = 'date') -> pd.DataFrame:
    """Clean and preprocess data."""
    if df.empty:
        return df
    
    df = df.copy()
    
    # Parse dates
    if date_col in df.columns:
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    
    # Standardize state names
    if 'state' in df.columns:
        df['state'] = df['state'].str.strip().str.title()
    
    # Standardize district names
    if 'district' in df.columns:
        df['district'] = df['district'].str.strip().str.title()
    
    return df

# ═══════════════════════════════════════════════════════════════════════════
# UNIVARIATE ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

def univariate_analysis(df: pd.DataFrame, column: str) -> dict:
    """Perform univariate analysis on a numeric column."""
    if column not in df.columns:
        return {'error': f"Column {column} not found"}
    
    series = pd.to_numeric(df[column], errors='coerce').dropna()
    
    if len(series) == 0:
        return {'error': f"No valid numeric data in {column}"}
    
    return {
        'column': column,
        'count': int(len(series)),
        'mean': float(series.mean()),
        'std': float(series.std()),
        'min': float(series.min()),
        'max': float(series.max()),
        'median': float(series.median()),
        'q25': float(series.quantile(0.25)),
        'q75': float(series.quantile(0.75)),
        'skewness': float(series.skew()),
        'kurtosis': float(series.kurtosis())
    }


def analyze_enrollment_distribution(df: pd.DataFrame) -> dict:
    """Analyze enrollment distribution by age groups."""
    results = {
        'total_records': len(df),
        'age_groups': {}
    }
    
    age_cols = ['age_0_5', 'age_5_17', 'age_18_greater', '0-5 Years', '5-17 Years', '18+ Years']
    
    for col in age_cols:
        if col in df.columns:
            stats = univariate_analysis(df, col)
            if 'error' not in stats:
                results['age_groups'][col] = stats
    
    return results

# ═══════════════════════════════════════════════════════════════════════════
# BIVARIATE ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

def bivariate_correlation(df: pd.DataFrame, col1: str, col2: str) -> dict:
    """Calculate correlation between two numeric columns."""
    if col1 not in df.columns or col2 not in df.columns:
        return {'error': f"Columns not found"}
    
    s1 = pd.to_numeric(df[col1], errors='coerce')
    s2 = pd.to_numeric(df[col2], errors='coerce')
    
    # Remove rows with NaN in either column
    valid_mask = s1.notna() & s2.notna()
    s1, s2 = s1[valid_mask], s2[valid_mask]
    
    if len(s1) < 2:
        return {'error': 'Insufficient data'}
    
    correlation = s1.corr(s2)
    
    return {
        'column1': col1,
        'column2': col2,
        'correlation': float(correlation) if not pd.isna(correlation) else 0,
        'sample_size': int(len(s1)),
        'interpretation': interpret_correlation(correlation)
    }


def interpret_correlation(r: float) -> str:
    """Interpret correlation coefficient."""
    if pd.isna(r):
        return "No correlation calculated"
    
    abs_r = abs(r)
    direction = "positive" if r > 0 else "negative"
    
    if abs_r < 0.1:
        strength = "negligible"
    elif abs_r < 0.3:
        strength = "weak"
    elif abs_r < 0.5:
        strength = "moderate"
    elif abs_r < 0.7:
        strength = "strong"
    else:
        strength = "very strong"
    
    return f"{strength.title()} {direction} correlation"


def state_activity_correlation(df: pd.DataFrame) -> dict:
    """Analyze correlation between state-level metrics."""
    if 'state' not in df.columns:
        return {'error': 'No state column found'}
    
    # Aggregate by state
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    state_agg = df.groupby('state')[numeric_cols].sum()
    
    # Calculate correlation matrix
    corr_matrix = state_agg.corr()
    
    return {
        'states_analyzed': len(state_agg),
        'correlation_matrix': corr_matrix.to_dict(),
        'top_correlations': extract_top_correlations(corr_matrix, n=5)
    }


def extract_top_correlations(corr_matrix: pd.DataFrame, n: int = 5) -> list:
    """Extract top N strongest correlations from matrix."""
    pairs = []
    cols = corr_matrix.columns
    
    for i, col1 in enumerate(cols):
        for j, col2 in enumerate(cols):
            if i < j:  # Upper triangle only
                r = corr_matrix.loc[col1, col2]
                if not pd.isna(r):
                    pairs.append({
                        'pair': f"{col1} vs {col2}",
                        'correlation': float(r)
                    })
    
    pairs.sort(key=lambda x: abs(x['correlation']), reverse=True)
    return pairs[:n]

# ═══════════════════════════════════════════════════════════════════════════
# TRIVARIATE ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

def trivariate_time_state_volume(enrollment_df: pd.DataFrame, demographic_df: pd.DataFrame, biometric_df: pd.DataFrame) -> dict:
    """Analyze interaction between time, state, and activity volume."""
    results = {
        'enrollment': {},
        'demographic': {},
        'biometric': {}
    }
    
    for name, df in [('enrollment', enrollment_df), ('demographic', demographic_df), ('biometric', biometric_df)]:
        if df.empty or 'date' not in df.columns or 'state' not in df.columns:
            continue
        
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)
        df = df.dropna(subset=['date'])
        
        if len(df) == 0:
            continue
        
        # Add time components
        df['month'] = df['date'].dt.month
        df['day_of_week'] = df['date'].dt.dayofweek
        
        # Calculate monthly patterns by state
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            total_col = numeric_cols[0]  # Use first numeric column
            monthly_state = df.groupby(['state', 'month'])[total_col].sum().reset_index()
            
            results[name] = {
                'monthly_state_pattern': monthly_state.to_dict('records')[:50],  # Limit output
                'peak_month': int(df.groupby('month')[total_col].sum().idxmax()),
                'low_month': int(df.groupby('month')[total_col].sum().idxmin())
            }
    
    return results

# ═══════════════════════════════════════════════════════════════════════════
# INDICATOR CALCULATION
# ═══════════════════════════════════════════════════════════════════════════

def calculate_saturation_index(total_enrollments: int, state: str) -> dict:
    """Calculate saturation index for a state."""
    population = CONFIG['population'].get(state, 50) * 1_000_000
    index = min((total_enrollments / population) * 100, 120)
    
    if index < CONFIG['thresholds']['saturation_critical']:
        status = 'critical'
    elif index < CONFIG['thresholds']['saturation_warning']:
        status = 'warning'
    else:
        status = 'healthy'
    
    return {
        'value': round(index, 1),
        'status': status,
        'population_millions': CONFIG['population'].get(state, 50)
    }


def calculate_volatility_index(daily_values: list) -> dict:
    """Calculate coefficient of variation."""
    if len(daily_values) < 2:
        return {'value': 0, 'status': 'insufficient_data'}
    
    mean = np.mean(daily_values)
    if mean == 0:
        return {'value': 0, 'status': 'no_activity'}
    
    std = np.std(daily_values)
    cv = (std / mean) * 100
    
    if cv < 50:
        status = 'stable'
    elif cv < 100:
        status = 'moderate'
    elif cv < CONFIG['thresholds']['volatility_high']:
        status = 'high'
    else:
        status = 'critical'
    
    return {
        'value': round(cv, 1),
        'status': status
    }


def calculate_state_indicators(df: pd.DataFrame, state: str) -> dict:
    """Calculate all indicators for a state."""
    state_df = df[df['state'] == state].copy() if 'state' in df.columns else df
    
    if state_df.empty:
        return {'error': f'No data for {state}'}
    
    # Total enrollments
    numeric_cols = state_df.select_dtypes(include=[np.number]).columns.tolist()
    total = state_df[numeric_cols].sum().sum() if numeric_cols else 0
    
    # Saturation
    saturation = calculate_saturation_index(int(total), state)
    
    # Daily volatility
    if 'date' in state_df.columns:
        state_df['date'] = pd.to_datetime(state_df['date'], errors='coerce', dayfirst=True)
        daily_totals = state_df.groupby('date')[numeric_cols[0]].sum().tolist() if numeric_cols else []
        volatility = calculate_volatility_index(daily_totals)
    else:
        volatility = {'value': 0, 'status': 'no_date_data'}
    
    return {
        'state': state,
        'total_enrollments': int(total),
        'saturation_index': saturation,
        'volatility_index': volatility
    }

# ═══════════════════════════════════════════════════════════════════════════
# FORECASTING
# ═══════════════════════════════════════════════════════════════════════════

def simple_linear_forecast(time_series: pd.Series, periods: int = 30) -> dict:
    """Simple linear regression forecast."""
    if len(time_series) < 10:
        return {'error': 'Insufficient data for forecasting'}
    
    # Prepare data
    X = np.arange(len(time_series)).reshape(-1, 1)
    y = time_series.values
    
    # Simple linear regression
    X_mean = X.mean()
    y_mean = y.mean()
    
    numerator = ((X - X_mean) * (y - y_mean).reshape(-1, 1)).sum()
    denominator = ((X - X_mean) ** 2).sum()
    
    if denominator == 0:
        return {'error': 'Cannot calculate slope'}
    
    slope = numerator / denominator
    intercept = y_mean - slope * X_mean
    
    # Forecast
    future_X = np.arange(len(time_series), len(time_series) + periods)
    forecast = slope * future_X + intercept
    
    # R-squared
    y_pred = slope * X.flatten() + intercept
    ss_res = ((y - y_pred) ** 2).sum()
    ss_tot = ((y - y_mean) ** 2).sum()
    r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
    
    return {
        'slope': float(slope),
        'intercept': float(intercept),
        'r_squared': float(r_squared),
        'forecast': forecast.tolist(),
        'trend': 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'flat'
    }


def forecast_enrollment_trend(df: pd.DataFrame) -> dict:
    """Forecast enrollment trends."""
    if df.empty or 'date' not in df.columns:
        return {'error': 'Cannot forecast without date column'}
    
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)
    df = df.dropna(subset=['date'])
    
    # Aggregate by date
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        return {'error': 'No numeric columns found'}
    
    daily_totals = df.groupby('date')[numeric_cols[0]].sum().sort_index()
    
    # Forecast
    forecast = simple_linear_forecast(daily_totals, periods=30)
    forecast['historical_days'] = len(daily_totals)
    forecast['last_date'] = str(daily_totals.index[-1].date()) if len(daily_totals) > 0 else None
    
    return forecast

# ═══════════════════════════════════════════════════════════════════════════
# REPORT GENERATION
# ═══════════════════════════════════════════════════════════════════════════

def generate_analytics_report(data: dict, output_dir: str) -> str:
    """Generate comprehensive analytics report."""
    os.makedirs(output_dir, exist_ok=True)
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'summary': {},
        'univariate': {},
        'bivariate': {},
        'trivariate': {},
        'indicators': {},
        'forecasts': {}
    }
    
    print("\n📈 Generating analytics report...")
    
    # Preprocess data
    enrollment_df = preprocess_data(data.get('enrollment', pd.DataFrame()))
    demographic_df = preprocess_data(data.get('demographic', pd.DataFrame()))
    biometric_df = preprocess_data(data.get('biometric', pd.DataFrame()))
    
    # Summary stats
    report['summary'] = {
        'enrollment_records': len(enrollment_df),
        'demographic_records': len(demographic_df),
        'biometric_records': len(biometric_df),
        'total_records': len(enrollment_df) + len(demographic_df) + len(biometric_df)
    }
    
    # Univariate analysis
    print("  - Univariate analysis...")
    if not enrollment_df.empty:
        report['univariate']['enrollment'] = analyze_enrollment_distribution(enrollment_df)
    
    # Bivariate analysis
    print("  - Bivariate analysis...")
    if not enrollment_df.empty:
        report['bivariate']['state_correlation'] = state_activity_correlation(enrollment_df)
    
    # Trivariate analysis
    print("  - Trivariate analysis...")
    report['trivariate'] = trivariate_time_state_volume(enrollment_df, demographic_df, biometric_df)
    
    # State indicators
    print("  - State indicators...")
    if not enrollment_df.empty and 'state' in enrollment_df.columns:
        for state in CONFIG['population'].keys():
            indicators = calculate_state_indicators(enrollment_df, state)
            if 'error' not in indicators:
                report['indicators'][state] = indicators
    
    # Forecasts
    print("  - Forecasting...")
    if not enrollment_df.empty:
        report['forecasts']['enrollment'] = forecast_enrollment_trend(enrollment_df)
    
    # Save report
    report_path = os.path.join(output_dir, f"analytics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n✅ Report saved to: {report_path}")
    
    return report_path

# ═══════════════════════════════════════════════════════════════════════════
# POWER BI EXPORT
# ═══════════════════════════════════════════════════════════════════════════

def export_for_powerbi(data: dict, output_dir: str) -> list:
    """Export aggregated data suitable for Power BI consumption."""
    os.makedirs(output_dir, exist_ok=True)
    
    print("\n📊 Exporting for Power BI...")
    exported_files = []
    
    # Preprocess
    enrollment_df = preprocess_data(data.get('enrollment', pd.DataFrame()))
    demographic_df = preprocess_data(data.get('demographic', pd.DataFrame()))
    biometric_df = preprocess_data(data.get('biometric', pd.DataFrame()))
    
    # State-level aggregates
    if not enrollment_df.empty:
        print("  - State-level enrollment aggregates...")
        numeric_cols = enrollment_df.select_dtypes(include=[np.number]).columns.tolist()
        if 'state' in enrollment_df.columns and numeric_cols:
            state_agg = enrollment_df.groupby('state')[numeric_cols].sum().reset_index()
            
            # Add population and saturation
            state_agg['population_millions'] = state_agg['state'].map(CONFIG['population']).fillna(50)
            state_agg['total'] = state_agg[numeric_cols].sum(axis=1)
            state_agg['saturation_index'] = (state_agg['total'] / (state_agg['population_millions'] * 1_000_000) * 100).clip(upper=120)
            
            path = os.path.join(output_dir, 'powerbi_state_enrollment.csv')
            state_agg.to_csv(path, index=False)
            exported_files.append(path)
            print(f"    Saved: {path}")
    
    # Time-series aggregates
    if not enrollment_df.empty and 'date' in enrollment_df.columns:
        print("  - Time-series aggregates...")
        enrollment_df['date'] = pd.to_datetime(enrollment_df['date'], errors='coerce', dayfirst=True)
        enrollment_df = enrollment_df.dropna(subset=['date'])
        
        numeric_cols = enrollment_df.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            daily_agg = enrollment_df.groupby('date')[numeric_cols].sum().reset_index()
            daily_agg['total'] = daily_agg[numeric_cols].sum(axis=1)
            
            path = os.path.join(output_dir, 'powerbi_daily_enrollment.csv')
            daily_agg.to_csv(path, index=False)
            exported_files.append(path)
            print(f"    Saved: {path}")
    
    # Indicator summary
    print("  - Indicator summary...")
    indicators = []
    if not enrollment_df.empty and 'state' in enrollment_df.columns:
        for state in CONFIG['population'].keys():
            ind = calculate_state_indicators(enrollment_df, state)
            if 'error' not in ind:
                indicators.append({
                    'state': state,
                    'total_enrollments': ind['total_enrollments'],
                    'saturation_index': ind['saturation_index']['value'],
                    'saturation_status': ind['saturation_index']['status'],
                    'volatility_index': ind['volatility_index']['value'],
                    'volatility_status': ind['volatility_index']['status'],
                    'population_millions': CONFIG['population'].get(state, 50)
                })
    
    if indicators:
        ind_df = pd.DataFrame(indicators)
        path = os.path.join(output_dir, 'powerbi_indicators.csv')
        ind_df.to_csv(path, index=False)
        exported_files.append(path)
        print(f"    Saved: {path}")
    
    print(f"\n✅ Exported {len(exported_files)} files for Power BI")
    return exported_files

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='Aadhaar Intelligence Platform - Batch Analytics')
    parser.add_argument('--mode', choices=['analyze', 'powerbi', 'validate', 'all'], 
                        default='all', help='Analysis mode')
    parser.add_argument('--data-dir', default='../../data', help='Path to data directory')
    parser.add_argument('--output-dir', default='./outputs', help='Output directory')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("  Aadhaar Intelligence Platform - Batch Analytics")
    print("=" * 60)
    
    # Resolve data directory
    data_dir = os.path.abspath(args.data_dir)
    output_dir = os.path.abspath(args.output_dir)
    
    print(f"\n📁 Data directory: {data_dir}")
    print(f"📁 Output directory: {output_dir}")
    
    # Load data
    data = load_all_data(data_dir)
    
    if all(df.empty for df in data.values()):
        print("\n❌ No data loaded. Check data directory path.")
        sys.exit(1)
    
    # Run analysis based on mode
    if args.mode in ['analyze', 'all']:
        reports_dir = os.path.join(output_dir, 'reports')
        generate_analytics_report(data, reports_dir)
    
    if args.mode in ['powerbi', 'all']:
        powerbi_dir = os.path.join(output_dir, 'powerbi')
        export_for_powerbi(data, powerbi_dir)
    
    print("\n" + "=" * 60)
    print("  Analysis Complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
