# Canyon Sunset Resort — CSV Strategy Simulator (V2)

A dynamic pricing simulation platform for wedding venue booking strategies.

## Youtube Demo

[Watch a Demo on YouTube HERE](https://www.youtube.com/watch?v=c-gghzNtCb0&ab_channel=DanielDavid)

## Project Structure

```
├── backend/
│   ├── app.py                 # FastAPI entry point
│   ├── models.py              # Pydantic schemas
│   ├── sim/
│   │   ├── csv_loader.py      # CSV parsing and validation
│   │   ├── policy.py          # Policy normalization
│   │   ├── engine.py          # Monte Carlo simulation
│   │   ├── dp_benchmark.py    # Dynamic programming benchmark
│   │   └── rng_bank.py        # Deterministic random number management
│   ├── storage/
│   │   ├── db.py              # Database operations
│   │   └── files.py           # File storage (local/S3)
│   └── tests/
│       ├── test_csv_loader.py
│       ├── test_engine.py
│       └── test_api.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── requirements.txt
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- CSV strategy validation and parsing
- Monte Carlo simulation with deterministic RNG
- Dynamic programming benchmark for regret calculation
- Interactive results visualization
- Policy heatmap display
- Submission storage and grading interface

## API Endpoints

- `POST /api/simulate` - Run simulation on uploaded CSV
- `POST /api/submit` - Submit strategy for grading
- `GET /api/submissions/:id` - Retrieve submission details

