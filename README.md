<p align="center">
  <img src="docs/assets/logo-placeholder.svg" alt="JalDrishti Logo" width="120" />
</p>

<h1 align="center">JalDrishti — जलदृष्टि</h1>
<p align="center"><em>"Water Vision" — Real-time Groundwater Resource Evaluation using DWLR Data</em></p>
<p align="center"><strong>SIH 2025 · Problem Statement 068 · Ministry of Jal Shakti</strong></p>

---

## The Problem

India monitors groundwater through ~25,000 Digital Water Level Recorders (DWLRs). The data is public — but nobody is watching it continuously or translating trend lines into actionable warnings.

**JalDrishti closes that gap** with four layers: continuous monitoring, standards-based classification (CGWB norms), trend forecasting, and AI-powered advisory reasoning.

## Quick Start

```bash
# Clone and configure
git clone https://github.com/your-org/jaldrishti.git && cd jaldrishti
cp .env.example .env

# Option A: Docker Compose (recommended)
docker compose up -d
docker compose exec server python -m app.db.seed

# Option B: Manual
cd server && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# In another terminal:
cd client && npm install && npm run dev

# Generate sample data
python data/scripts/generate_sample_data.py
```

## Tech Stack

FastAPI · PostgreSQL · Redis · Celery · React 19 · Vite · Recharts · Leaflet · Google Gemini

## License

MIT
