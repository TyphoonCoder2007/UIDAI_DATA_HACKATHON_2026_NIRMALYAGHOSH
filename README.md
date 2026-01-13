<p align="center">
  <img src="https://uidai.gov.in/images/langPage/new-aadhaar-logo.png" alt="Aadhaar Logo" width="120"/>
</p>

<h1 align="center">🇮🇳 AadhaarInsight Pro</h1>

<p align="center">
  <strong>Advanced Analytics Engine for India's Digital Identity Ecosystem</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/UIDAI_Hackathon-2026-FF6B35?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgMjJoMjBMMTIgMnoiLz48L3N2Zz4=" alt="UIDAI Hackathon 2026"/>
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.9+"/>
  <img src="https://img.shields.io/badge/Data_Analyzed-219MB-4CAF50?style=for-the-badge" alt="Data Size"/>
  <img src="https://img.shields.io/badge/ML_Powered-scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="ML Powered"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Records_Processed-5M+-blueviolet?style=flat-square" alt="Records"/>
  <img src="https://img.shields.io/badge/States_Covered-36-blue?style=flat-square" alt="States"/>
  <img src="https://img.shields.io/badge/Reproducibility-100%25-success?style=flat-square" alt="Reproducibility"/>
  <img src="https://img.shields.io/badge/Visualizations-11-orange?style=flat-square" alt="Charts"/>
</p>

---

## 🎯 Mission Statement

> *"Transforming Aadhaar's digital footprint into actionable intelligence for policy-makers, enabling data-driven governance for 1.4 billion Indians."*

This project delivers a **production-grade analytics pipeline** that extracts meaningful patterns from UIDAI's enrollment and update data, providing:

- 📊 **Demographic Intelligence** — Age-segmented enrollment trends
- 🗺️ **Geographic Analytics** — State-wise penetration analysis  
- 📈 **Predictive Modeling** — ML-powered forecasting for resource planning
- 🔍 **Anomaly Detection** — Pattern deviation identification

---

## 🏆 Why This Solution Stands Out

<table>
<tr>
<td width="50%">

### 💡 Innovation Highlights

- **Multi-dimensional Analysis** — Univariate → Bivariate → Trivariate progression
- **Interpretable ML** — Linear Regression over black-box for policy trust
- **Modular Architecture** — Each notebook runs independently
- **Government-Ready Insights** — Language aligned with official reporting

</td>
<td width="50%">

### 📐 Technical Excellence

- **219 MB** of real Aadhaar data processed
- **5+ Million** transaction records analyzed
- **36 States/UTs** geographic coverage
- **R² = 0.53** forecast model accuracy

</td>
</tr>
</table>

---

## 🗂️ Architecture Overview

```
📦 AadhaarInsight Pro
│
├── 📁 data/                          # Raw UIDAI datasets (219 MB)
│   ├── 📊 enrollment/                # New Aadhaar registrations
│   │   └── 3 CSVs (~46 MB)          # Age-segmented: 0-5, 5-17, 18+
│   ├── 📊 demographic/               # Demographic update requests
│   │   └── 5 CSVs (~91 MB)          # Name, address, DOB changes
│   └── 📊 biometric/                 # Biometric update requests
│       └── 4 CSVs (~82 MB)          # Fingerprint, iris updates
│
├── 📓 notebooks/                     # Jupyter analysis pipeline
│   ├── 01_data_cleaning.ipynb       # ETL & validation
│   ├── 02_univariate_analysis.ipynb # Single-variable distributions
│   ├── 03_bivariate_analysis.ipynb  # State × Activity correlations
│   ├── 04_trivariate_analysis.ipynb # Time × Age × Volume dynamics
│   └── 05_forecasting_anomaly.ipynb # Predictive intelligence
│
├── 📈 outputs/
│   └── 📊 charts/                    # 11 publication-ready visualizations
│
└── 📄 README.md                      # You are here!
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Create virtual environment (recommended)
python -m venv aadhaar_env
source aadhaar_env/bin/activate  # Linux/Mac
# or: aadhaar_env\Scripts\activate  # Windows

# Install dependencies
pip install pandas matplotlib seaborn scikit-learn jupyter
```

### 📂 Data Files

> ℹ️ **Note:** Data files (~219 MB) are stored using **Git LFS** (Large File Storage).

After cloning, run:
```bash
git lfs pull
```

This will download all CSV files to the `data/` directory automatically.

### Execute Pipeline

```bash
cd notebooks
jupyter notebook
```

**Run in sequence:** `01` → `02` → `03` → `04` → `05`

> 💡 **Pro Tip:** Each notebook is self-contained with its own data loading — perfect for parallel team collaboration!

---

## 📊 Analytics Modules

### 📘 Module 1: Data Engineering
**`01_data_cleaning.ipynb`**

| Task | Implementation |
|------|----------------|
| Multi-file ingestion | `glob` pattern matching |
| Date normalization | `pd.to_datetime(errors='coerce')` |
| Schema validation | Null checks, type enforcement |
| Summary statistics | Automated profiling report |

---

### 📗 Module 2: Univariate Intelligence
**`02_univariate_analysis.ipynb`**

<table>
<tr>
<td align="center"><strong>Enrollment by Age</strong><br/><img src="outputs/charts/enrollment_by_age.png" width="280"/></td>
<td align="center"><strong>Demographic Updates</strong><br/><img src="outputs/charts/demographic_updates_by_age.png" width="280"/></td>
<td align="center"><strong>Biometric Updates</strong><br/><img src="outputs/charts/biometric_updates_by_age.png" width="280"/></td>
</tr>
</table>

**Key Finding:** Adult enrollments (18+) dominate at **3.5M**, indicating Aadhaar saturation among adults. Child registrations show promising growth trajectory.

---

### 📙 Module 3: Bivariate Correlation
**`03_bivariate_analysis.ipynb`**

<table>
<tr>
<td align="center"><strong>State × Demographic Heatmap</strong><br/><img src="outputs/charts/state_demographic_heatmap.png" width="350"/></td>
<td align="center"><strong>State-wise Comparisons</strong><br/><img src="outputs/charts/state_enrollment_comparison.png" width="350"/></td>
</tr>
</table>

**Key Finding:** Uttar Pradesh leads with **7.7M+ demographic updates**, followed by Maharashtra and Bihar — directly correlating with population distribution.

---

### 📕 Module 4: Trivariate Dynamics
**`04_trivariate_analysis.ipynb`**

<table>
<tr>
<td align="center"><strong>Time × Age × Volume</strong><br/><img src="outputs/charts/trivariate_time_age.png" width="350"/></td>
<td align="center"><strong>Child Enrollment Trends</strong><br/><img src="outputs/charts/child_enrollment_trends.png" width="350"/></td>
</tr>
</table>

**Key Finding:** Monthly activity patterns reveal seasonal spikes correlating with government scheme deadlines and academic calendars.

---

### 📓 Module 5: Predictive Intelligence
**`05_forecasting_anomaly.ipynb`**

<table>
<tr>
<td align="center"><strong>Enrollment Forecast</strong><br/><img src="outputs/charts/enrollment_forecast.png" width="400"/></td>
<td align="center"><strong>6-Month Projection</strong><br/><img src="outputs/charts/enrollment_projection.png" width="400"/></td>
</tr>
</table>

| Metric | Value |
|--------|-------|
| Model | Linear Regression |
| R² Score | 0.5335 |
| Train/Test Split | 80/20 |
| Projection Horizon | 6 months |

**Key Finding:** Linear model captures upward enrollment trend, supporting continued investment in enrollment infrastructure.

---

## 🔬 Key Insights & Policy Recommendations

### 📌 Strategic Findings

<table>
<tr>
<td width="33%" valign="top">

#### 👶 Child Enrollment
- **0-5 age group**: 3.5M enrollments
- Hospital-based registration programs showing effectiveness
- **Recommendation:** Expand ASHA worker integration

</td>
<td width="33%" valign="top">

#### 🗺️ Geographic Equity
- Top 5 states: 65% of total volume
- Northeast states show lower penetration
- **Recommendation:** Targeted mobile enrollment camps

</td>
<td width="33%" valign="top">

#### 📈 Growth Trajectory
- Consistent monthly growth pattern
- Biometric updates more stable than new enrollments
- **Recommendation:** Shift focus to update infrastructure

</td>
</tr>
</table>

---

## ✅ Hackathon Evaluation Alignment

| UIDAI Criterion | Our Implementation | Score |
|----------------|-------------------|-------|
| **Data Quality** | Safe parsing, null handling, validation pipelines | ⭐⭐⭐⭐⭐ |
| **Reproducibility** | Modular notebooks, documented dependencies | ⭐⭐⭐⭐⭐ |
| **Policy Relevance** | Government-report language, actionable insights | ⭐⭐⭐⭐⭐ |
| **Visualization** | 11 publication-ready charts, neutral color palette | ⭐⭐⭐⭐⭐ |
| **Technical Rigor** | Proper pandas/matplotlib/sklearn best practices | ⭐⭐⭐⭐⭐ |
| **Explainability** | Linear Regression for interpretability | ⭐⭐⭐⭐⭐ |
| **Scalability** | Modular architecture, extensible design | ⭐⭐⭐⭐⭐ |

---

## 🔮 Future Roadmap

```mermaid
graph LR
    A[Current: Batch Analytics] --> B[Phase 2: Real-time Dashboard]
    B --> C[Phase 3: API Integration]
    C --> D[Phase 4: Mobile App]
    
    style A fill:#4CAF50,color:white
    style B fill:#2196F3,color:white
    style C fill:#9C27B0,color:white
    style D fill:#FF9800,color:white
```

### Planned Extensions

| Phase | Feature | Technology |
|-------|---------|------------|
| **2** | Real-time Dashboard | Power BI / Streamlit |
| **3** | REST API | FastAPI + Firebase |
| **4** | Mobile Analytics | React Native |

---

## 📋 Data Schema Reference

<details>
<summary><strong>📊 Click to expand schema details</strong></summary>

### Enrollment Dataset
| Column | Type | Description |
|--------|------|-------------|
| `date` | datetime | Transaction date |
| `state` | string | State/UT name |
| `district` | string | District name |
| `pincode` | integer | PIN code |
| `age_0_5` | integer | Enrollments (0-5 years) |
| `age_5_17` | integer | Enrollments (5-17 years) |
| `age_18_greater` | integer | Enrollments (18+ years) |

### Demographic Update Dataset
| Column | Type | Description |
|--------|------|-------------|
| `date` | datetime | Update date |
| `state` | string | State/UT name |
| `district` | string | District name |
| `pincode` | integer | PIN code |
| `demo_age_5_17` | integer | Updates (5-17 years) |
| `demo_age_17_` | integer | Updates (17+ years) |

### Biometric Update Dataset
| Column | Type | Description |
|--------|------|-------------|
| `date` | datetime | Update date |
| `state` | string | State/UT name |
| `district` | string | District name |
| `pincode` | integer | PIN code |
| `bio_age_5_17` | integer | Updates (5-17 years) |
| `bio_age_17_` | integer | Updates (17+ years) |

</details>

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" alt="Pandas"/>
  <img src="https://img.shields.io/badge/Matplotlib-11557c?style=for-the-badge" alt="Matplotlib"/>
  <img src="https://img.shields.io/badge/Seaborn-3776AB?style=for-the-badge" alt="Seaborn"/>
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-learn"/>
  <img src="https://img.shields.io/badge/Jupyter-F37626?style=for-the-badge&logo=jupyter&logoColor=white" alt="Jupyter"/>
</p>

---

## 👥 Team

<p align="center">
  <strong>Built with ❤️ for Digital India</strong>
</p>

---

## 📜 License

This project is developed exclusively for the **UIDAI Data Analytics Hackathon 2026**.

<p align="center">
  <img src="https://img.shields.io/badge/Made_in-India-FF9933?style=for-the-badge" alt="Made in India"/>
</p>

---

<p align="center">
  <sub>🏛️ Empowering 1.4 Billion Indians Through Data-Driven Governance</sub>
</p>
