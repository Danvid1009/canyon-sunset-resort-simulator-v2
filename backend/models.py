"""
Pydantic models for the Canyon Sunset Resort simulation API.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum


class PriceLevel(str, Enum):
    """Price levels for the simulation."""
    LOW = "LOW"
    MED = "MED"
    HIGH = "HIGH"


class SimulationConfig(BaseModel):
    """Configuration for simulation parameters."""
    I: int = Field(..., ge=1, le=20, description="Initial capacity (rows)")
    T: int = Field(..., ge=1, le=50, description="Number of selling opportunities (columns)")
    trials: int = Field(default=2000, ge=100, le=10000, description="Number of Monte Carlo trials")
    seed: Optional[int] = Field(default=None, description="Random seed for deterministic results")
    last_minute_k: int = Field(default=3, ge=1, le=10, description="Last k periods for last-minute share")


class PolicyMatrix(BaseModel):
    """Normalized policy matrix with integer prices."""
    matrix: List[List[int]] = Field(..., description="Policy matrix with prices [30000, 40000, 50000]")
    I: int = Field(..., description="Number of capacity levels")
    T: int = Field(..., description="Number of time periods")
    
    @validator('matrix')
    def validate_matrix_values(cls, v, values):
        """Ensure all values are valid prices."""
        valid_prices = {30000, 40000, 50000}
        for row in v:
            for price in row:
                if price not in valid_prices:
                    raise ValueError(f"Invalid price {price}. Must be one of {valid_prices}")
        return v


class SimulationAggregates(BaseModel):
    """Aggregated results from simulation."""
    avg_revenue: float = Field(..., description="Average revenue across all trials")
    std_revenue: float = Field(..., description="Standard deviation of revenue")
    fill_rate: float = Field(..., ge=0, le=1, description="Average fill rate (capacity sold)")
    avg_price: float = Field(..., description="Average price across all sales")
    last_minute_share: float = Field(..., ge=0, le=1, description="Share of sales in last k periods")
    regret: Optional[float] = Field(default=None, description="Regret vs dynamic programming benchmark")
    price_mix: Dict[str, int] = Field(..., description="Count of each price level used")


class TrialStep(BaseModel):
    """Single step in a trial."""
    period: int
    remaining_capacity: int
    price: int
    sold: bool
    revenue: float


class SampleTrial(BaseModel):
    """Sample trial data for visualization."""
    trial_id: int
    steps: List[TrialStep]
    total_revenue: float


class SimulationResults(BaseModel):
    """Complete simulation results."""
    config: SimulationConfig
    policy: PolicyMatrix
    aggregates: SimulationAggregates
    sample_trial: SampleTrial
    price_histogram: Dict[str, int] = Field(..., description="Histogram of prices used")
    sales_by_period: List[int] = Field(..., description="Sales count by period")


class SimulationRequest(BaseModel):
    """Request model for simulation endpoint."""
    csv_content: str = Field(..., description="CSV content as string")
    config: Optional[SimulationConfig] = Field(default=None, description="Simulation configuration")
    philosophy: Optional[str] = Field(default=None, max_length=1000, description="Strategy philosophy")


class SubmissionRequest(BaseModel):
    """Request model for submission endpoint."""
    simulation_results: SimulationResults
    philosophy: str = Field(..., min_length=10, max_length=1000, description="Strategy philosophy")
    student_email: str = Field(..., description="Student email")
    student_name: str = Field(..., description="Student name")


class SubmissionResponse(BaseModel):
    """Response model for submission endpoint."""
    submission_id: str
    message: str


class SubmissionDetails(BaseModel):
    """Details of a stored submission."""
    submission_id: str
    student_email: str
    student_name: str
    created_at: str
    config: SimulationConfig
    aggregates: SimulationAggregates
    philosophy: str
    csv_url: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    details: Optional[Dict[str, Any]] = None


class CSVValidationError(BaseModel):
    """CSV validation error details."""
    row: int
    col: int
    value: str
    message: str


class CSVValidationResult(BaseModel):
    """Result of CSV validation."""
    is_valid: bool
    errors: List[CSVValidationError] = Field(default_factory=list)
    matrix: Optional[List[List[str]]] = None
    I: Optional[int] = None
    T: Optional[int] = None

