# Keboola Pricing Calculator - Calculations Reference

> **Single source of truth for all metrics, constants, formulas, and assumptions.**
> Update this file when making new assumptions or changing calculations.

---

## Table of Contents

1. [PPU Rates](#1-ppu-rates)
2. [Enterprise Packages](#2-enterprise-packages)
3. [Default Configuration](#3-default-configuration-fidoo-scenario)
4. [Core Formulas](#4-core-formulas)
5. [Industry Benchmarks - Per Job](#5-industry-benchmarks---per-job-ppu)
6. [Industry Benchmarks - Monthly](#6-industry-benchmarks---monthly-aggregates)
7. [Benchmark Comparison Logic](#7-benchmark-comparison-logic)
8. [Recommendation Logic](#8-recommendation-logic)
9. [Key Assumptions](#9-key-assumptions)

---

## 1. PPU Rates

**Location:** `src/Calculator.jsx` lines 3-12

| Component | Size/Type | Rate | Unit |
|-----------|-----------|------|------|
| **Extractor** | - | 2 | PPU/hour |
| **Writer** | - | 0.2 | PPU/GB |
| **SQL Job** | Small | 6 | PPU/hour |
| **SQL Job** | Medium | 12 | PPU/hour |
| **SQL Job** | Large | 26 | PPU/hour |
| **Python/R Job** | XSmall | 0.2 | PPU/hour |
| **Python/R Job** | Small | 0.4 | PPU/hour |
| **Python/R Job** | Medium | 0.6 | PPU/hour |
| **Python/R Job** | Large | 2 | PPU/hour |
| **dbt Job** | Small | 4 | PPU/hour |
| **dbt Job** | Remote | 2 | PPU/hour |
| **DWH Direct Query** | Small | 8 | PPU/hour |
| **DWH Direct Query** | Medium | 16 | PPU/hour |
| **DWH Direct Query** | Large | 32 | PPU/hour |
| **Data Apps** | XSmall | 0.1 | PPU/hour |
| **Data Apps** | Small | 0.2 | PPU/hour |
| **Data Apps** | Medium | 0.5 | PPU/hour |
| **Data Apps** | Large | 1 | PPU/hour |
| **AppStore Apps** | - | 1 | PPU/hour |

---

## 2. Enterprise Packages

**Location:** `src/Calculator.jsx` lines 94-98

| Package | Annual Price | PPU Included | Overage Rate | Snowflake | Projects | Users |
|---------|--------------|--------------|--------------|-----------|----------|-------|
| **No Brainer** | $69,000 | 6,000 | $2.50/PPU | Included | 3 | 5 |
| **BYODB** | $60,000 | 6,000 | $1.00/PPU | Bring Your Own | 3 | 5 |
| **Single Tenant** | $120,000 | 12,000 | $2.50/PPU | Included | Unlimited | Unlimited |

---

## 3. Default Configuration (Fidoo Scenario)

**Location:** `src/Calculator.jsx` lines 100-104

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `clients` | 100 | Number of client organizations |
| `systemsPerClient` | 2 | Average systems per client |
| `syncsPerDay` | 4 | Daily sync frequency per integration |
| `avgJobTimeSec` | 30 | Average job execution time (seconds) |
| `dataPerSyncKB` | 100 | Data transferred per sync (KB) |
| `sqlWorkflows` | 4 | Number of SQL workflows |
| `sqlRunsPerDay` | 2 | SQL runs per workflow per day |
| `sqlJobTimeMin` | 10 | SQL job duration (minutes) |
| `sqlBackend` | `'small'` | SQL backend size |
| `pythonBackend` | `'small'` | Python backend size |
| `pythonTimeRatio` | 0.25 | % of job time on Python (25%) |
| `extractorTimeRatio` | 0.5 | % of job time on extraction (50%) |

**Expected output with defaults:** ~461 monthly PPU, ~5,532 annual PPU

---

## 4. Core Formulas

**Location:** `src/Calculator.jsx` lines 113-145

### Integration Workload

```
Total Connections    = clients × systemsPerClient
Daily Syncs          = totalConnections × syncsPerDay
Monthly Syncs        = dailySyncs × 30
Monthly Job Hours    = (monthlySyncs × avgJobTimeSec) / 3600
Monthly Data GB      = (monthlySyncs × dataPerSyncKB) / (1024 × 1024)
```

### PPU by Component

```
Extractor PPU = monthlyJobHours × extractorTimeRatio × PPU_RATE_EXTRACTOR
Python PPU    = monthlyJobHours × pythonTimeRatio × PPU_RATE_PYTHON[backend]
Writer PPU    = monthlyDataGB × PPU_RATE_WRITER
SQL PPU       = monthlySqlHours × PPU_RATE_SQL[backend]
```

### SQL Analytics Workload

```
Daily SQL Runs    = sqlWorkflows × sqlRunsPerDay
Monthly SQL Hours = (dailySqlRuns × 30 × sqlJobTimeMin) / 60
SQL PPU           = monthlySqlHours × PPU_RATE_SQL[backend]
```

### Totals

```
Integration Total = extractorPPU + pythonPPU + writerPPU
Analytics Total   = sqlPPU
Monthly PPU       = integrationTotal + analyticsTotal
Annual PPU        = monthlyPPU × 12
```

### Package Cost Calculations

```
Overage PPU   = max(0, annualPPU - packagePpuIncluded)
Overage Cost  = overagePPU × overageRate
Total Cost    = packageBasePrice + overageCost
Utilization % = (annualPPU / packagePpuIncluded) × 100
```

### Per-Job Metrics (for benchmarking)

```
PPU per Extractor Job = (avgJobTimeSec / 3600) × extractorTimeRatio × 2
PPU per Python Job    = (avgJobTimeSec / 3600) × pythonTimeRatio × pythonRate
PPU per Writer Job    = (dataPerSyncKB / 1048576) × 0.2
```

---

## 5. Industry Benchmarks - Per Job PPU

**Location:** `src/Calculator.jsx` lines 14-51

PPU consumed per average job execution by industry and company size.

### Retail & E-commerce

| Size | Extractor | Python | SQL | Writer |
|------|-----------|--------|-----|--------|
| Small | - | - | - | - |
| Medium | 0.037 | 0.10 | 0.227 | 0.005 |
| Large | 0.067 | 0.01 | 0.209 | 0.033 |
| XLarge | 0.039 | 0.01 | 0.429 | 0.048 |

### Finance & Banking

| Size | Extractor | Python | SQL | Writer |
|------|-----------|--------|-----|--------|
| Small | 0.020 | 0.05 | 0.121 | 0.000 |
| Medium | 0.058 | 0.02 | 0.233 | 0.011 |
| Large | 0.086 | 0.02 | 0.168 | 0.030 |
| XLarge | 0.057 | 0.02 | 0.100 | 0.023 |

### Technology

| Size | Extractor | Python | SQL | Writer |
|------|-----------|--------|-----|--------|
| Small | 0.112 | 0.006 | 0.090 | 0.004 |
| Medium | 0.047 | 0.11 | 0.307 | 0.054 |
| Large | 0.035 | 0.05 | 0.132 | 0.049 |
| XLarge | 0.054 | 0.05 | 0.327 | 0.087 |

### Manufacturing

| Size | Extractor | Python | SQL | Writer |
|------|-----------|--------|-----|--------|
| Small | 0.040 | 0.02 | 0.136 | 0.013 |
| Medium | 0.029 | 0.02 | 0.121 | 0.004 |
| Large | 0.129 | 0.02 | 0.163 | 0.057 |
| XLarge | 0.176 | 0.01 | 0.326 | 0.059 |

### Healthcare

| Size | Extractor | Python | SQL | Writer |
|------|-----------|--------|-----|--------|
| Small | 0.068 | - | - | - |
| Medium | 0.000 | 0.008 | 0.143 | 0.107 |
| Large | 0.081 | 0.04 | 0.170 | 0.013 |
| XLarge | 0.042 | 0.04 | 0.248 | 0.037 |

### Media & Entertainment

| Size | Extractor | Python | SQL | Writer |
|------|-----------|--------|-----|--------|
| Small | 0.046 | - | 0.067 | 0.000 |
| Medium | 0.077 | 0.08 | 0.157 | 0.047 |
| Large | 0.090 | 0.02 | 0.215 | 0.027 |
| XLarge | 0.117 | 0.14 | 0.364 | 0.054 |

---

## 6. Industry Benchmarks - Monthly Aggregates

**Location:** `src/Calculator.jsx` lines 55-92

Real client usage aggregated by industry and company size.

> **Data Source:** 13 months of client data (Jan 2025 - Jan 2026)

### Retail & E-commerce

| Size | Jobs/mo | Extractor | Python | SQL | Writer | Monthly PPU | Annual PPU |
|------|---------|-----------|--------|-----|--------|-------------|------------|
| Small | 6 | 0.0 | 0.0 | 0.0 | 0.0 | 0 | 3 |
| Medium | 959 | 8.9 | 1.0 | 34 | 0.4 | 371 | 4,449 |
| Large | 5,959 | 67 | 2.0 | 154 | 15 | 2,001 | 24,013 |
| XLarge | 49,050 | 549 | 21 | 2,016 | 234 | 23,666 | 283,996 |

### Finance & Banking

| Size | Jobs/mo | Extractor | Python | SQL | Writer | Monthly PPU | Annual PPU |
|------|---------|-----------|--------|-----|--------|-------------|------------|
| Small | 394 | 3.7 | 0.8 | 0.9 | 0.0 | 45 | 542 |
| Medium | 1,176 | 24 | 0.0 | 32 | 2.3 | 483 | 5,795 |
| Large | 10,212 | 80 | 7.0 | 93 | 19 | 1,669 | 20,022 |
| XLarge | 123,228 | 538 | 29 | 891 | 67 | 12,800 | 153,600 |

### Technology

| Size | Jobs/mo | Extractor | Python | SQL | Writer | Monthly PPU | Annual PPU |
|------|---------|-----------|--------|-----|--------|-------------|------------|
| Small | 268 | 3.7 | 0.0 | 1.9 | 0.1 | 48 | 570 |
| Medium | 2,431 | 12 | 2.7 | 12 | 0.9 | 234 | 2,805 |
| Large | 15,159 | 46 | 3.5 | 94 | 33 | 1,477 | 17,721 |
| XLarge | 23,240 | 394 | 28 | 946 | 103 | 12,334 | 148,011 |

### Manufacturing

| Size | Jobs/mo | Extractor | Python | SQL | Writer | Monthly PPU | Annual PPU |
|------|---------|-----------|--------|-----|--------|-------------|------------|
| Small | 108 | 0.6 | 0.0 | 2.8 | 0.3 | 31 | 374 |
| Medium | 2,185 | 14 | 0.9 | 16 | 0.4 | 267 | 3,201 |
| Large | 16,990 | 91 | 1.4 | 112 | 18 | 1,866 | 22,392 |
| XLarge | 27,505 | 282 | 6.2 | 177 | 27 | 4,123 | 49,475 |

### Healthcare

| Size | Jobs/mo | Extractor | Python | SQL | Writer | Monthly PPU | Annual PPU |
|------|---------|-----------|--------|-----|--------|-------------|------------|
| Small | 10 | 0.3 | 0.0 | 0.9 | 0.0 | 10 | 122 |
| Medium | 3,103 | 0.0 | 0.7 | 53 | 3.7 | 483 | 5,800 |
| Large | 8,805 | 68 | 7.8 | 111 | 9.3 | 1,642 | 19,701 |
| XLarge | 27,084 | 510 | 114 | 610 | 63 | 10,881 | 130,577 |

### Media & Entertainment

| Size | Jobs/mo | Extractor | Python | SQL | Writer | Monthly PPU | Annual PPU |
|------|---------|-----------|--------|-----|--------|-------------|------------|
| Small | 361 | 6.5 | 0.0 | 3.4 | 0.0 | 83 | 992 |
| Medium | 755 | 23 | 0.7 | 37 | 7.8 | 573 | 6,880 |
| Large | 4,035 | 56 | 3.0 | 172 | 11 | 2,028 | 24,338 |
| XLarge | 23,907 | 235 | 21 | 397 | 79 | 6,144 | 73,729 |

---

## 7. Benchmark Comparison Logic

**Location:** `src/Calculator.jsx` lines 153-167

Compares user's per-job metrics against industry benchmarks:

| Classification | Threshold | Meaning |
|----------------|-----------|---------|
| **Low** | ≤ 50% of benchmark | More efficient than typical |
| **Typical** | 50% - 120% of benchmark | Normal usage |
| **High** | > 120% of benchmark | Above average consumption |
| **N/A** | No benchmark data | Insufficient data |

---

## 8. Recommendation Logic

**Location:** `src/Calculator.jsx` line 151

**Rules:**
1. **Exclude BYODB** from automatic recommendations (requires Snowflake evaluation)
2. Among No Brainer and Single Tenant:
   - Select the package with **lowest total cost**
   - That has **utilization ≤ 120%** (not over-provisioned)

---

## 9. Key Assumptions

### Time Allocations
| Ratio | Value | Description |
|-------|-------|-------------|
| `extractorTimeRatio` | 50% | Time spent on data extraction |
| `pythonTimeRatio` | 25% | Time spent on Python/analytics |
| Remaining | 25% | Other operations (implicit) |

### Unit Conversions
| Conversion | Value |
|------------|-------|
| 1 hour | 3,600 seconds |
| 1 GB | 1,048,576 KB (1024 x 1024) |
| 1 month | 30 days |
| 1 year | 12 months |

### Pricing Model
- Annual pricing (12-month commitment)
- Linear overage charging beyond included PPU
- BYODB requires customer-managed Snowflake instance

### Calculation Scope
**Included in default calculations:**
- Integration: Extractor + Python + Writer
- Analytics: SQL only

**Not included by default (available but not calculated):**
- DWH Direct Query
- dbt Jobs
- Data Apps
- AppStore Apps

### Benchmark Data
- Based on **13 months of real client data** (Jan 2025 - Jan 2026)
- `null` values indicate insufficient data for that segment
- Company sizes: Small, Medium, Large, Extra Large
- Industries: Retail, Finance, Technology, Manufacturing, Healthcare, Media

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-31 | Initial documentation created | - |

---

*Last updated: 2026-01-31*
