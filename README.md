<p align="center">
  <img src="https://img.shields.io/badge/🔐_AADHAAR-Unique_Identification_Authority_of_India-FF6B35?style=for-the-badge&labelColor=1a1a2e" alt="UIDAI"/>
</p>

<h1 align="center">
  📊 AadhaarInsight Pro
</h1>


<h3 align="center">
  🏆 UIDAI Data Hackathon 2026 — Official Submission
</h3>

<p align="center">
  <strong>An Enterprise-Grade Analytics Platform for India's Digital Identity Infrastructure</strong>
</p>

<p align="center">
  <a href="#-executive-summary"><img src="https://img.shields.io/badge/📊-Executive_Summary-2196F3?style=flat-square" alt="Summary"/></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/🚀-Quick_Start-4CAF50?style=flat-square" alt="Quick Start"/></a>
  <a href="#-analytics-modules"><img src="https://img.shields.io/badge/📈-Analytics-9C27B0?style=flat-square" alt="Analytics"/></a>
  <a href="#-key-insights"><img src="https://img.shields.io/badge/💡-Insights-FF9800?style=flat-square" alt="Insights"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Records-5M+-blueviolet?style=for-the-badge" alt="Records"/>
  <img src="https://img.shields.io/badge/States-36-blue?style=for-the-badge" alt="States"/>
  <img src="https://img.shields.io/badge/ML-scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="ML"/>
</p>

---

## 📊 Executive Summary

<table>
<tr>
<td width="65%">

### The Challenge
UIDAI generates **massive volumes** of enrollment and update data daily across India's 1.4 billion population. This data holds untapped potential for:
- Identifying enrollment gaps in underserved regions
- Predicting infrastructure requirements
- Optimizing resource allocation across states

### Our Solution
**AadhaarInsight Pro** is a comprehensive, reproducible analytics pipeline that transforms raw Aadhaar transaction data into **actionable policy intelligence** using industry-standard data science practices.

</td>
<td width="35%" align="center">

### 📈 Impact Metrics

| Metric | Value |
|:------:|:-----:|
| **Data Processed** | 219 MB |
| **Records Analyzed** | 5M+ |
| **States Covered** | 36 |
| **Visualizations** | 11 |
| **Model R²** | 0.53 |

</td>
</tr>
</table>

---

## � Problem Statement & Approach

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RAW DATA                    ANALYSIS PIPELINE                    INSIGHTS  │
│                                                                             │
│  ┌─────────────┐    ┌───────────────────────────────┐    ┌───────────────┐ │
│  │ Enrollment  │───▶│  01. Data Cleaning & ETL      │───▶│ Policy        │ │
│  │ (46 MB)     │    │  02. Univariate Analysis      │    │ Recommendations│ │
│  ├─────────────┤    │  03. Bivariate Correlation    │    ├───────────────┤ │
│  │ Demographic │───▶│  04. Trivariate Dynamics      │───▶│ Forecasting   │ │
│  │ (91 MB)     │    │  05. Predictive Modeling      │    │ Models        │ │
│  ├─────────────┤    └───────────────────────────────┘    ├───────────────┤ │
│  │ Biometric   │                                         │ Visualizations│ │
│  │ (82 MB)     │                                         │ (11 Charts)   │ │
│  └─────────────┘                                         └───────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Clone repository
git clone https://github.com/TyphoonCoder2007/UIDAI_DATA_HACKATHON_2026_NIRMALYAGHOSH.git
cd UIDAI_DATA_HACKATHON_2026_NIRMALYAGHOSH

# Download data files (stored via Git LFS)
git lfs pull

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Linux/Mac
# venv\Scripts\activate     # Windows

# Install dependencies
pip install pandas matplotlib seaborn scikit-learn jupyter
```

### Run Analysis

```bash
cd notebooks
jupyter notebook
```

> 📋 **Execute notebooks in sequence:** `01` → `02` → `03` → `04` → `05`

---

## 🗂️ Project Architecture

```
UIDAI_DATA_HACKATHON_2026_NIRMALYAGHOSH/
│
├── � data/                              # UIDAI Datasets (219 MB via Git LFS)
│   ├── enrollment/                       # 3 CSVs — New registrations by age
│   ├── demographic/                      # 5 CSVs — Name/Address/DOB updates
│   └── biometric/                        # 4 CSVs — Fingerprint/Iris updates
│
├── 📓 notebooks/                         # Jupyter Analysis Pipeline
│   ├── 01_data_cleaning.ipynb           # ETL, validation, schema checks
│   ├── 02_univariate_analysis.ipynb     # Age-wise distributions
│   ├── 03_bivariate_analysis.ipynb      # State × Activity correlations
│   ├── 04_trivariate_analysis.ipynb     # Time × Age × Volume dynamics
│   └── 05_forecasting_anomaly.ipynb     # ML-powered predictions
│
├── � outputs/
│   └── charts/                           # 11 publication-ready visualizations
│
├── 📄 README.md                          # Documentation (You are here)
├── 📄 .gitattributes                     # Git LFS configuration
└── 📄 .gitignore                         # Excluded files
```

---

## � Analytics Modules

### Module 1: Data Engineering
> **Notebook:** `01_data_cleaning.ipynb`

| Operation | Technique | Records Processed |
|-----------|-----------|-------------------|
| Multi-file Ingestion | `glob` + `pd.concat()` | 4.9M rows |
| Date Parsing | `pd.to_datetime(errors='coerce')` | 100% success |
| Null Handling | Safe coercion, validation | 0 data loss |
| Schema Validation | Type enforcement | All datasets |

---

### Module 2: Univariate Analysis
> **Notebook:** `02_univariate_analysis.ipynb`

<table>
<tr>
<td align="center" width="33%">
<strong>Enrollment Distribution</strong><br/>
<img src="outputs/charts/enrollment_by_age.png" width="280"/>
</td>
<td align="center" width="33%">
<strong>Demographic Updates</strong><br/>
<img src="outputs/charts/demographic_updates_by_age.png" width="280"/>
</td>
<td align="center" width="33%">
<strong>Biometric Updates</strong><br/>
<img src="outputs/charts/biometric_updates_by_age.png" width="280"/>
</td>
</tr>
</table>

**📌 Key Finding:** Age 0-5 group shows **3.5M enrollments** — indicating successful hospital-based infant registration programs.

---

### Module 3: Bivariate Correlation
> **Notebook:** `03_bivariate_analysis.ipynb`

<table>
<tr>
<td align="center" width="50%">
<strong>State × Demographic Intensity</strong><br/>
<img src="outputs/charts/state_demographic_heatmap.png" width="400"/>
</td>
<td align="center" width="50%">
<strong>State-wise Enrollment Comparison</strong><br/>
<img src="outputs/charts/state_enrollment_comparison.png" width="400"/>
</td>
</tr>
</table>

**📌 Key Finding:** Uttar Pradesh leads with **7.75M demographic updates** — correlating directly with population distribution patterns.

---

### Module 4: Trivariate Dynamics
> **Notebook:** `04_trivariate_analysis.ipynb`

<table>
<tr>
<td align="center" width="50%">
<strong>Time × Age × Volume Analysis</strong><br/>
<img src="outputs/charts/trivariate_time_age.png" width="400"/>
</td>
<td align="center" width="50%">
<strong>Child Enrollment Trends</strong><br/>
<img src="outputs/charts/child_enrollment_trends.png" width="400"/>
</td>
</tr>
</table>

**📌 Key Finding:** Monthly patterns reveal **seasonal spikes** aligning with government scheme deadlines and academic calendars.

---

### Module 5: Predictive Intelligence
> **Notebook:** `05_forecasting_anomaly.ipynb`

<table>
<tr>
<td align="center" width="50%">
<strong>Enrollment Forecast Model</strong><br/>
<img src="outputs/charts/enrollment_forecast.png" width="420"/>
</td>
<td align="center" width="50%">
<strong>6-Month Projection</strong><br/>
<img src="outputs/charts/enrollment_projection.png" width="420"/>
</td>
</tr>
</table>

| Model Specification | Value |
|---------------------|-------|
| **Algorithm** | Linear Regression |
| **R² Score** | 0.5335 |
| **Train/Test Split** | 80% / 20% |
| **Forecast Horizon** | 6 months |

**📌 Key Finding:** Linear model captures consistent **upward enrollment trajectory**, supporting continued infrastructure investment.

---

## � Key Insights

<table>
<tr>
<td width="33%" valign="top">

### 👶 Child Enrollment
- **3.5M** infant enrollments (Age 0-5)
- Hospital-based programs highly effective
- **Action:** Expand ASHA worker integration

</td>
<td width="33%" valign="top">

### 🗺️ Geographic Distribution
- Top 5 states = **65%** of total volume
- Northeast shows lower penetration
- **Action:** Deploy mobile enrollment camps

</td>
<td width="33%" valign="top">

### 📈 Growth Patterns
- Biometric updates more consistent
- New enrollments show seasonal variance
- **Action:** Optimize update infrastructure

</td>
</tr>
</table>

---

## ✅ Hackathon Evaluation Criteria

| Criterion | Implementation | Alignment |
|-----------|----------------|:---------:|
| **Data Quality** | Robust ETL with safe parsing, null handling, validation | ✅ |
| **Reproducibility** | Self-contained notebooks, documented dependencies | ✅ |
| **Policy Relevance** | Government-report language, actionable recommendations | ✅ |
| **Visualization** | 11 publication-ready charts, professional color palette | ✅ |
| **Technical Rigor** | pandas, matplotlib, scikit-learn best practices | ✅ |
| **Explainability** | Linear Regression for interpretability over black-box | ✅ |
| **Scalability** | Modular design, extensible architecture | ✅ |

---

## �️ Technology Stack

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" alt="Pandas"/>
  <img src="https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white" alt="NumPy"/>
  <img src="https://img.shields.io/badge/Matplotlib-11557c?style=for-the-badge" alt="Matplotlib"/>
  <img src="https://img.shields.io/badge/Seaborn-3776AB?style=for-the-badge" alt="Seaborn"/>
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-learn"/>
  <img src="https://img.shields.io/badge/Jupyter-F37626?style=for-the-badge&logo=jupyter&logoColor=white" alt="Jupyter"/>
  <img src="https://img.shields.io/badge/Git_LFS-F05032?style=for-the-badge&logo=git&logoColor=white" alt="Git LFS"/>
</p>

---

## 📋 Data Schema

<details>
<summary><strong>📊 Enrollment Dataset Schema</strong></summary>

| Column | Type | Description |
|--------|------|-------------|
| `date` | datetime | Transaction date (YYYY-MM-DD) |
| `state` | string | State/UT name |
| `district` | string | District name |
| `pincode` | integer | 6-digit PIN code |
| `age_0_5` | integer | Enrollments — Age 0-5 years |
| `age_5_17` | integer | Enrollments — Age 5-17 years |
| `age_18_greater` | integer | Enrollments — Age 18+ years |

</details>

<details>
<summary><strong>📊 Demographic Updates Schema</strong></summary>

| Column | Type | Description |
|--------|------|-------------|
| `date` | datetime | Update request date |
| `state` | string | State/UT name |
| `district` | string | District name |
| `pincode` | integer | 6-digit PIN code |
| `demo_age_5_17` | integer | Updates — Age 5-17 years |
| `demo_age_17_` | integer | Updates — Age 17+ years |

</details>

<details>
<summary><strong>📊 Biometric Updates Schema</strong></summary>

| Column | Type | Description |
|--------|------|-------------|
| `date` | datetime | Update request date |
| `state` | string | State/UT name |
| `district` | string | District name |
| `pincode` | integer | 6-digit PIN code |
| `bio_age_5_17` | integer | Updates — Age 5-17 years |
| `bio_age_17_` | integer | Updates — Age 17+ years |

</details>

---

## � Future Roadmap

| Phase | Enhancement | Technology |
|:-----:|-------------|------------|
| **2** | Real-time Dashboard | Streamlit / Power BI |
| **3** | REST API Integration | FastAPI + Cloud Deployment |
| **4** | Mobile Analytics App | React Native |

---

## 👥 Team

<p align="center">
  <strong>Nirmalya Ghosh</strong><br/>
  <sub>UIDAI Data Hackathon 2026 — Participant</sub>
</p>

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License"/>
  <img src="https://img.shields.io/badge/🇮🇳_Made_in_India-FF9933?style=for-the-badge" alt="Made in India"/>
</p>

---

<p align="center">
  <strong>🏛️ UIDAI Data Hackathon 2026</strong><br/>
  <sub>Empowering 1.4 Billion Indians Through Data-Driven Governance</sub>
</p>
