# Canyon Sunset Resort CSV Strategy Simulator (V2)

A comprehensive dynamic pricing simulation platform for wedding venue booking strategies. Students can submit pricing strategies via CSV files, run Monte Carlo simulations against a hidden demand model, and analyze results with interactive charts and metrics.

## 🎯 Overview

This system allows students to:
- Upload CSV pricing strategies (7×15 matrix)
- Run deterministic Monte Carlo simulations (2000 trials)
- Analyze comprehensive results with interactive charts
- Submit strategies for grading with philosophy explanations

## 🚀 Features

### 📊 **Simulation Engine**
- **Monte Carlo Simulation**: 2000 trials with deterministic random numbers
- **Hidden Demand Model**: Sale probabilities (LOW: 90%, MED: 80%, HIGH: 40%)
- **Dynamic Programming Benchmark**: Optimal solution for regret calculation
- **Deterministic Results**: Same seed ensures fair comparison across students

### 📈 **Analytics Dashboard**
- **Revenue Analysis**: Average revenue, standard deviation, cumulative progression
- **Inventory Tracking**: Capacity utilization over time
- **Price Mix Analysis**: Distribution and conversion rates by price level
- **Sales Patterns**: Sales count by time period
- **Sample Trial Visualization**: Step-by-step simulation progression

### 💾 **Data Management**
- **CSV Validation**: Real-time validation with error highlighting
- **Multiple Formats**: Support for LOW/MED/HIGH, 30/40/50, $30/$40/$50
- **Database Storage**: SQLite with full submission tracking
- **File Storage**: Local file system with CSV reconstruction

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM with SQLite
- **NumPy**: Numerical computations for simulations
- **Pandas**: CSV processing and data manipulation
- **Pydantic**: Data validation and serialization

### Frontend
- **React 18**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Interactive data visualization
- **React Query**: API state management
- **TypeScript**: Type-safe development

## 📁 Project Structure

```
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── models.py              # Pydantic data models
│   ├── requirements.txt       # Python dependencies
│   ├── sim/
│   │   ├── csv_loader.py      # CSV parsing and validation
│   │   ├── policy.py          # Policy normalization
│   │   ├── engine.py          # Monte Carlo simulation engine
│   │   ├── dp_benchmark.py    # Dynamic programming benchmark
│   │   └── rng_bank.py        # Deterministic random number bank
│   ├── storage/
│   │   ├── db.py              # Database models and operations
│   │   └── files.py           # File storage management
│   └── tests/                 # Unit and integration tests
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types.ts           # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── package.json           # Node.js dependencies
│   └── vite.config.js         # Vite configuration
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📋 Usage Guide

### 1. Upload Strategy
- Download CSV template (7×15 matrix)
- Fill with pricing strategy (LOW/MED/HIGH or 30/40/50 or $30/$40/$50)
- Upload via drag & drop interface

### 2. Run Simulation
- Review policy heatmap visualization
- Add strategy philosophy (optional)
- Click "Run Simulation" to execute 2000 Monte Carlo trials

### 3. Analyze Results
- View comprehensive metrics dashboard
- Explore interactive charts and visualizations
- Analyze sample trial progression

### 4. Submit for Grading
- Provide student information
- Submit strategy with philosophy for instructor review

## 📊 Key Metrics

The system calculates comprehensive performance metrics:

- **Average Revenue**: Expected revenue across all trials
- **Standard Deviation**: Revenue variability
- **Fill Rate**: Capacity utilization percentage
- **Average Price**: Weighted average price across sales
- **Last-Minute Share**: Sales in final k periods
- **Regret**: Performance gap vs optimal DP solution
- **Price Mix**: Distribution of LOW/MED/HIGH usage

## 🔧 Configuration

### Environment Variables
```bash
# Assignment Configuration
ASSIGNMENT_VERSION=default
RNG_SEED=42
MAX_TRIALS=10000
LOCK_I=7
LOCK_T=15

# Database
DATABASE_URL=sqlite:///./canyon_sunset.db

# Storage
STORAGE_TYPE=local  # or s3
LOCAL_STORAGE_PATH=./storage/files
```

### Simulation Parameters
- **Capacity Levels (I)**: 7 (locked)
- **Time Periods (T)**: 15 (locked)
- **Trials**: 2000 (configurable, max 10,000)
- **Sale Probabilities**: LOW=90%, MED=80%, HIGH=40%

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📈 Performance

- **Simulation Speed**: <200ms for 2000 trials
- **Deterministic Results**: Same seed produces identical outcomes
- **Scalability**: Supports up to 10,000 trials
- **Real-time Validation**: Instant CSV error feedback

## 🔒 Security & Fairness

- **Deterministic RNG**: Fair comparison across all students
- **File Validation**: CSV-only uploads with size limits
- **Rate Limiting**: Prevents simulation spam
- **Data Isolation**: Student submissions stored separately

## 🚀 Deployment

### Backend Deployment
```bash
# Using Docker
docker build -t canyon-sunset-backend ./backend
docker run -p 8000:8000 canyon-sunset-backend

# Using Uvicorn
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Development Team**: Canyon Sunset Resort Research Group
- **Institution**: Columbia University
- **Course**: Dynamic Pricing Simulation

## 🙏 Acknowledgments

- FastAPI team for the excellent web framework
- React team for the powerful UI library
- Recharts team for beautiful data visualization
- Tailwind CSS team for utility-first styling

---

**Canyon Sunset Resort CSV Strategy Simulator (V2)** - Empowering students to master dynamic pricing strategies through interactive simulation and analysis.