<p align="center">
  <img src="docs/assets/logo-placeholder.svg" alt="JalDrishti Logo" width="120" />
</p>

<h1 align="center">JalDrishti — जलदृष्टि</h1>
<p align="center">
  <em>"Water Vision" — Real-time Groundwater Resource Evaluation & Advisory Platform using DWLR Telemetry</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/SIH%2025-Problem%20Statement%20068-blue?style=for-the-badge" alt="SIH 2025">
  <img src="https://img.shields.io/badge/Ministry-Ministry%20of%20Jal%20Shakti-008080?style=for-the-badge" alt="Ministry of Jal Shakti">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License: MIT">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+">
  <img src="https://img.shields.io/badge/FastAPI-0.109+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

---

## 📌 Executive Summary

India relies heavily on groundwater for ~85% of rural drinking water and ~60% of agricultural irrigation. While the **Central Ground Water Board (CGWB)** monitors groundwater across ~25,000 **Digital Water Level Recorders (DWLRs)** nationwide, raw sensor data is often published in siloed feeds without continuous automated surveillance or predictive trend alerts.

**JalDrishti (जलदृष्टि)** closes this gap by providing an end-to-end continuous groundwater intelligence & decision-support system. It automatically ingests sensor telemetry, classifies station risks against CGWB benchmarks, forecasts depletion trends using statistical models, and produces plain-language advisory reports using **Google Gemini 2.0 LLM**.

---

## 🌟 Key Features

- **📡 Real-Time Telemetry & Data Ingestion**: Robust ingestion pipelines capable of processing continuous time-series water level depth (mbgl) data with automated validation and deduplication.
- **🏷️ Standards-Based Risk Classification Engine**:
  - Classifies stations into CGWB categories: **Safe**, **Semi-Critical**, **Critical**, and **Over-Exploited**.
  - Supports dual-mode classification: **Stage of Groundwater Development (%)** (extraction vs. recharge ratio) and depth-below-ground-level (mbgl) fallback proxies.
- **📈 Predictive Trend Forecasting**:
  - Linear regression & time-series trend analysis to calculate annual depletion velocity ($m/\text{year}$).
  - Projects critical water-table breach dates to enable proactive water conservation policies.
- **🤖 AI-Powered Advisory Engine (Google Gemini 2.0)**:
  - Context-aware LLM advisory reasoning per station/district.
  - Tailored recommendations for agricultural crop planning, artificial recharge structures, and municipal rationing.
- **🗺️ Interactive GIS & Visual Analytics Dashboard**:
  - Geospatial station visualization using Leaflet with risk-based color-coded markers.
  - Interactive Recharts visual analytics showing historical trends, seasonal fluctuations, and forecast curves.
  - District-level aggregation and filterable groundwater health scorecards.
- **⚡ Async Enterprise Backend**: High-performance FastAPI REST API backed by PostgreSQL, Redis caching, and Celery asynchronous background job workers.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────┐
                               │  DWLR Telemetry Data   │
                               │ (~25k Sensors / CSV)   │
                               └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │   Data Ingestion &     │
                               │      Validation        │
                               └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │   PostgreSQL + Redis   │
                               └─────┬────────────┬─────┘
                                     │            │
            ┌────────────────────────┘            └────────────────────────┐
            ▼                                                              ▼
┌───────────────────────┐                                      ┌───────────────────────┐
│ CGWB Risk Classifier  │                                      │ Trend Forecasting ML  │
│ (Safe / Critical...)  │                                      │  (Linear Regression)  │
└───────────┬───────────┘                                      └───────────┬───────────┘
            │                                                              │
            └────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │  Gemini 2.0 Advisory   │
                         │    Reasoning Engine   │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ React 19 + Vite GIS   │
                         │  Dashboard (Frontend) │
                         └───────────────────────┘
```

---

## 📊 CGWB Risk Classification Matrix

Groundwater assessment units are categorized based on the **Stage of Groundwater Development** or depth proxy:

| Category | Stage of GW Development | Description & Regulatory Action |
| :--- | :--- | :--- |
| 🟢 **Safe** | $< 70\%$ | Adequate recharge; sustainable extraction limits. |
| 🟡 **Semi-Critical** | $70\% - 90\%$ | Cautious monitoring required; water conservation measures recommended. |
| 🟠 **Critical** | $90\% - 100\%$ | Severe stress; strict regulation on new tubewells; mandatory artificial recharge. |
| 🔴 **Over-Exploited** | $> 100\%$ | Depletion exceeds natural recharge; notification for groundwater extraction bans. |

---

## 🚀 Quick Start Guide

### Prerequisites

- **Docker & Docker Compose** (Recommended) *OR*
- **Python 3.11+**, **Node.js 18+**, **PostgreSQL 16**, and **Redis 7**

---

### Option A: Docker Compose (Recommended)

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ArnavSharma-IND/JalDristi.git
   cd JalDristi
   ```

2. **Set Up Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env to add your GEMINI_API_KEY if using LLM advisories
   ```

3. **Launch All Services**:
   ```bash
   docker compose up -d
   ```

4. **Seed Database with Sample Data**:
   ```bash
   docker compose exec server python -m app.db.seed
   ```

5. **Access the Applications**:
   - 🌐 **Frontend Dashboard**: `http://localhost:5173`
   - ⚡ **Backend API Docs (Swagger)**: `http://localhost:8000/docs`
   - 🔍 **ReDoc API Documentation**: `http://localhost:8000/redoc`

---

### Option B: Manual Local Setup

#### 1. Backend Setup (FastAPI & Celery)
```bash
cd server
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

#### 2. Start Celery Worker (In a new terminal)
```bash
cd server
.venv\Scripts\activate
celery -A app.workers.celery_app worker --loglevel=info
```

#### 3. Frontend Setup (React & Vite)
```bash
cd client
npm install
npm run dev
```

#### 4. Generate Synthetic DWLR Data (Optional)
```bash
python data/scripts/generate_sample_data.py
```

---

## ⚙️ Environment Variables Reference

Create a `.env` file in the project root:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `development` | Environment mode (`development` / `production`) |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_DB` | `jaldrishti` | Database name |
| `POSTGRES_USER` | `jaldrishti_user` | Database user |
| `POSTGRES_PASSWORD` | `change-me` | Database password |
| `REDIS_HOST` | `localhost` | Redis server host |
| `REDIS_PORT` | `6379` | Redis server port |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Celery broker connection string |
| `GEMINI_API_KEY` | `""` | Google Gemini API Key for Tier-2 Advisory Layer |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model variant |

---

## 🛠️ Tech Stack & Ecosystem

### **Backend & Data Processing**
- **FastAPI**: Modern, high-performance Python web framework.
- **SQLAlchemy 2.0 & Alembic**: Async ORM & migration framework.
- **PostgreSQL**: Time-series depth observation storage.
- **Redis & Celery**: In-memory caching and distributed task processing.
- **Google Gemini API**: GenAI LLM advisory generation.

### **Frontend & GIS Visualization**
- **React 19 & TypeScript**: Responsive dashboard architecture.
- **Vite**: Ultra-fast build tool and dev server.
- **Leaflet & React-Leaflet**: Geospatial map rendering of DWLR stations.
- **Recharts**: Responsive charting engine for depth profiles & forecasts.
- **Lucide Icons**: Modern icon library.

---

## 📂 Project Structure

```
JalDristi/
├── client/                     # React 19 Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable GIS Maps, Charts, Cards
│   │   ├── hooks/              # Custom React Query / State Hooks
│   │   ├── pages/              # Dashboard, Station Detail, District Views
│   │   ├── services/           # Axios API Client
│   │   └── types/              # TypeScript Type Definitions
│   └── Dockerfile
├── server/                     # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                # API Routers & Middleware
│   │   ├── core/               # App Configuration & Constants
│   │   ├── db/                 # Database Models, Sessions & Seed Scripts
│   │   ├── models/             # SQLAlchemy Data Models
│   │   ├── schemas/            # Pydantic Schemas
│   │   ├── services/           # Ingestion, Classifier, Forecaster, Advisory
│   │   └── workers/            # Celery Worker Definitions
│   └── Dockerfile
├── data/                       # Ingestion Datasets & Generators
│   └── scripts/                # Data synthetic generator & parsers
├── docs/                       # Architecture, API & Pitch Docs
├── infra/                      # Cloud Deployment Infrastructure
├── docker-compose.yml          # Multi-container Orchestration
├── .env.example                # Template Environment Variables
└── README.md                   # Project Documentation
```

---

## 🔗 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health check |
| `GET` | `/api/v1/stations` | List all DWLR stations with risk filters |
| `GET` | `/api/v1/stations/{id}` | Get detailed station telemetry & metadata |
| `GET` | `/api/v1/stations/{id}/forecast` | Fetch depletion trend forecast |
| `GET` | `/api/v1/stations/{id}/advisory` | Generate AI advisory via Gemini LLM |
| `GET` | `/api/v1/districts/{name}/stations` | Filter stations by district |

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Developed for <strong>Smart India Hackathon (SIH) 2025</strong> · Problem Statement 068 · <strong>Ministry of Jal Shakti</strong>
</p>
