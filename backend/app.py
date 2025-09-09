"""
FastAPI application for Canyon Sunset Resort CSV Strategy Simulator.
"""

import os
import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import pandas as pd

from models import (
    SimulationRequest, SimulationResults, SubmissionRequest, 
    SubmissionResponse, SubmissionDetails, ErrorResponse,
    SimulationConfig, CSVValidationResult
)
from sim.csv_loader import CSVLoader, create_sample_csv
from sim.policy import PolicyNormalizer
from sim.engine import SimulationEngine
from sim.dp_benchmark import create_dp_benchmark, get_optimal_revenue
from storage.db import get_db_manager, init_database
from storage.files import get_file_storage


# Initialize FastAPI app
app = FastAPI(
    title="Canyon Sunset Resort CSV Strategy Simulator",
    description="Dynamic pricing simulation platform for wedding venue booking strategies",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global configuration
ASSIGNMENT_VERSION = os.getenv("ASSIGNMENT_VERSION", "default")
RNG_SEED = int(os.getenv("RNG_SEED", "42"))
MAX_TRIALS = int(os.getenv("MAX_TRIALS", "10000"))
LOCK_I = int(os.getenv("LOCK_I", "7"))
LOCK_T = int(os.getenv("LOCK_T", "15"))

# Initialize components
csv_loader = CSVLoader()
policy_normalizer = PolicyNormalizer()


def _reconstruct_csv_from_policy(policy) -> str:
    """Reconstruct CSV content from policy matrix."""
    import io
    import csv
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Create header row
    header = ['Capacity'] + [f'Period {t+1}' for t in range(policy.T)]
    writer.writerow(header)
    
    # Create data rows
    price_labels = {30000: 'LOW', 40000: 'MED', 50000: 'HIGH'}
    
    for i in range(policy.I):
        row = [f'Level {i+1}']
        for j in range(policy.T):
            price = policy.matrix[i][j]
            row.append(price_labels.get(price, 'LOW'))
        writer.writerow(row)
    
    return output.getvalue()


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Canyon Sunset Resort CSV Strategy Simulator API",
        "version": "2.0.0",
        "assignment_version": ASSIGNMENT_VERSION,
        "locked_dimensions": {"I": LOCK_I, "T": LOCK_T},
        "max_trials": MAX_TRIALS
    }


@app.get("/api/template")
async def get_csv_template(
    I: Optional[int] = None,
    T: Optional[int] = None
):
    """
    Download a blank CSV template.
    
    Args:
        I: Number of capacity levels (defaults to LOCK_I)
        T: Number of time periods (defaults to LOCK_T)
    """
    if I is None:
        I = LOCK_I
    if T is None:
        T = LOCK_T
    
    # Validate dimensions
    if I != LOCK_I or T != LOCK_T:
        raise HTTPException(
            status_code=400,
            detail=f"Dimensions must be I={LOCK_I}, T={LOCK_T}"
        )
    
    # Generate template
    template_content = create_sample_csv(I, T)
    
    return {
        "template": template_content,
        "dimensions": {"I": I, "T": T},
        "instructions": {
            "valid_values": ["LOW", "MED", "HIGH", "30", "40", "50", "$30", "$40", "$50"],
            "price_mapping": {"LOW": 30000, "MED": 40000, "HIGH": 50000},
            "format": "CSV with optional headers"
        }
    }


@app.post("/api/validate-csv")
async def validate_csv(
    csv_content: str = Form(...)
):
    """
    Validate CSV content without running simulation.
    
    Args:
        csv_content: CSV content as string
    """
    try:
        result = csv_loader.parse_csv(csv_content)
        
        if not result.is_valid:
            return JSONResponse(
                status_code=400,
                content={
                    "valid": False,
                    "errors": [error.dict() for error in result.errors],
                    "dimensions": {"I": result.I, "T": result.T} if result.I else None
                }
            )
        
        # Check dimensions match locked values
        if result.I != LOCK_I or result.T != LOCK_T:
            return JSONResponse(
                status_code=400,
                content={
                    "valid": False,
                    "errors": [{
                        "row": 0,
                        "col": 0,
                        "value": "",
                        "message": f"Dimensions must be I={LOCK_I}, T={LOCK_T}, got I={result.I}, T={result.T}"
                    }],
                    "dimensions": {"I": result.I, "T": result.T}
                }
            )
        
        return {
            "valid": True,
            "dimensions": {"I": result.I, "T": result.T},
            "matrix_preview": result.matrix[:3] if result.matrix else None  # First 3 rows
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")


@app.post("/api/simulate")
async def simulate_strategy(
    csv_file: UploadFile = File(...),
    config_json: Optional[str] = Form(None),
    philosophy: Optional[str] = Form(None)
):
    """
    Run simulation on uploaded CSV strategy.
    
    Args:
        csv_file: CSV file with pricing strategy
        config_json: Optional simulation configuration as JSON
        philosophy: Optional strategy philosophy text
    """
    try:
        # Validate file type
        if not csv_file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        # Read CSV content
        csv_content = (await csv_file.read()).decode('utf-8')
        
        # Parse configuration
        if config_json:
            config_data = json.loads(config_json)
            config = SimulationConfig(**config_data)
        else:
            config = SimulationConfig(
                I=LOCK_I,
                T=LOCK_T,
                trials=2000,
                seed=RNG_SEED,
                last_minute_k=3
            )
        
        # Validate configuration
        if config.I != LOCK_I or config.T != LOCK_T:
            raise HTTPException(
                status_code=400,
                detail=f"Configuration dimensions must be I={LOCK_I}, T={LOCK_T}"
            )
        
        if config.trials > MAX_TRIALS:
            raise HTTPException(
                status_code=400,
                detail=f"Number of trials cannot exceed {MAX_TRIALS}"
            )
        
        # Parse and validate CSV
        csv_result = csv_loader.parse_csv(csv_content)
        
        if not csv_result.is_valid:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "CSV validation failed",
                    "errors": [error.dict() for error in csv_result.errors]
                }
            )
        
        # Normalize policy
        policy = policy_normalizer.normalize_policy(csv_result)
        
        # Run simulation
        engine = SimulationEngine(config, ASSIGNMENT_VERSION)
        results = engine.run_simulation(policy)
        
        # Calculate regret vs DP benchmark
        try:
            dp_benchmark = create_dp_benchmark(config)
            optimal_revenue, _ = dp_benchmark.solve()
            regret = engine.calculate_regret(policy, optimal_revenue)
            results.aggregates.regret = regret
        except Exception as e:
            # DP benchmark failed, continue without regret
            print(f"DP benchmark failed: {e}")
        
        return results.dict()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.post("/api/submit")
async def submit_strategy(
    submission_data: SubmissionRequest
):
    """
    Submit strategy for grading.
    
    Args:
        submission_data: Submission request with results and philosophy
    """
    try:
        db_manager = get_db_manager()
        file_storage = get_file_storage()
        
        # Get or create student
        student = db_manager.get_or_create_student(
            email=submission_data.student_email,
            name=submission_data.student_name
        )
        
        # Get or create assignment version
        assignment_version = db_manager.get_or_create_assignment_version(
            label=ASSIGNMENT_VERSION,
            rng_seed=RNG_SEED,
            I=LOCK_I,
            T=LOCK_T
        )
        
        # Store CSV file (we need to reconstruct it from the policy)
        csv_content = _reconstruct_csv_from_policy(submission_data.simulation_results.policy)
        csv_url = file_storage.store_csv_file(csv_content)
        
        # Create submission record
        submission = db_manager.create_submission(
            student_id=student.id,
            assignment_version_id=assignment_version.id,
            I=submission_data.simulation_results.config.I,
            T=submission_data.simulation_results.config.T,
            trials=submission_data.simulation_results.config.trials,
            seed=submission_data.simulation_results.config.seed,
            philosophy=submission_data.philosophy,
            csv_url=csv_url,
            policy_json=submission_data.simulation_results.policy.dict(),
            aggregates_json=submission_data.simulation_results.aggregates.dict(),
            sample_trial_json=submission_data.simulation_results.sample_trial.dict()
        )
        
        return SubmissionResponse(
            submission_id=str(submission.id),
            message="Strategy submitted successfully for grading"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission error: {str(e)}")


@app.get("/api/submissions/{submission_id}")
async def get_submission(submission_id: str):
    """
    Retrieve submission details.
    
    Args:
        submission_id: Submission identifier
    """
    try:
        db_manager = get_db_manager()
        
        # Parse UUID
        try:
            submission_uuid = uuid.UUID(submission_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid submission ID format")
        
        # Get submission from database
        submission = db_manager.get_submission(submission_uuid)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        # Get student info
        student = db_manager.get_or_create_student("", "")  # This will get existing student
        # We need to add a method to get student by ID, but for now return basic info
        
        return {
            "submission_id": str(submission.id),
            "student_email": submission.student_id,  # This should be joined with student table
            "created_at": submission.created_at.isoformat(),
            "config": {
                "I": submission.I,
                "T": submission.T,
                "trials": submission.trials,
                "seed": submission.seed
            },
            "aggregates": submission.aggregates_json,
            "philosophy": submission.philosophy,
            "csv_url": submission.csv_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval error: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/api/config")
async def get_config():
    """Get current configuration."""
    return {
        "assignment_version": ASSIGNMENT_VERSION,
        "locked_dimensions": {"I": LOCK_I, "T": LOCK_T},
        "max_trials": MAX_TRIALS,
        "rng_seed": RNG_SEED,
        "price_mapping": {"LOW": 30000, "MED": 40000, "HIGH": 50000},
        "sale_probabilities": {30000: 0.90, 40000: 0.80, 50000: 0.40}
    }


@app.post("/api/init-db")
async def initialize_database():
    """Initialize the database (for development/setup)."""
    try:
        init_database()
        return {"message": "Database initialized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database initialization failed: {str(e)}")


@app.get("/api/submissions")
async def list_submissions():
    """List all submissions (for instructor use)."""
    try:
        db_manager = get_db_manager()
        stats = db_manager.get_submission_stats(ASSIGNMENT_VERSION)
        return {
            "assignment_version": ASSIGNMENT_VERSION,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list submissions: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
