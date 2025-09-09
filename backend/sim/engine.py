"""
Monte Carlo simulation engine for the Canyon Sunset Resort pricing strategy.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from models import (
    PolicyMatrix, SimulationConfig, SimulationAggregates, 
    SampleTrial, TrialStep, SimulationResults
)
from .rng_bank import get_rng_bank


@dataclass
class SimulationState:
    """State of a single simulation trial."""
    capacity: int
    revenue: float
    sales_count: int
    price_history: List[int]
    sales_history: List[bool]
    revenue_history: List[float]


class SimulationEngine:
    """
    Core Monte Carlo simulation engine for pricing strategies.
    
    Implements the hidden demand model with deterministic random numbers
    for fair comparison across students.
    """
    
    # Sale probabilities for each price level
    SALE_PROBABILITIES = {
        30000: 0.90,  # LOW price
        40000: 0.80,  # MED price  
        50000: 0.40   # HIGH price
    }
    
    def __init__(self, config: SimulationConfig, assignment_version: str = "default"):
        """
        Initialize simulation engine.
        
        Args:
            config: Simulation configuration
            assignment_version: Assignment version for deterministic RNG
        """
        self.config = config
        self.assignment_version = assignment_version
        self.rng_bank = get_rng_bank(assignment_version, config.seed)
        
        # Validate configuration
        self._validate_config()
    
    def _validate_config(self):
        """Validate simulation configuration."""
        if self.config.I <= 0 or self.config.T <= 0:
            raise ValueError("Capacity and periods must be positive")
        
        if self.config.trials <= 0:
            raise ValueError("Number of trials must be positive")
        
        if self.config.last_minute_k > self.config.T:
            raise ValueError("last_minute_k cannot exceed total periods")
    
    def run_simulation(self, policy: PolicyMatrix) -> SimulationResults:
        """
        Run Monte Carlo simulation for the given policy.
        
        Args:
            policy: Pricing policy matrix
            
        Returns:
            Complete simulation results
        """
        # Validate policy dimensions match config
        if policy.I != self.config.I or policy.T != self.config.T:
            raise ValueError(
                f"Policy dimensions ({policy.I}x{policy.T}) don't match "
                f"config ({self.config.I}x{self.config.T})"
            )
        
        # Get deterministic random numbers
        random_numbers = self.rng_bank.get_random_numbers(
            self.config.trials, self.config.T
        )
        
        # Run all trials
        trial_results = []
        for trial_id in range(self.config.trials):
            trial_result = self._run_single_trial(
                policy, random_numbers[trial_id], trial_id
            )
            trial_results.append(trial_result)
        
        # Calculate aggregates
        aggregates = self._calculate_aggregates(trial_results)
        
        # Get sample trial (first trial for visualization)
        sample_trial = self._create_sample_trial(trial_results[0])
        
        # Create histograms
        price_histogram = self._create_price_histogram(trial_results)
        sales_by_period = self._create_sales_by_period_histogram(trial_results)
        
        return SimulationResults(
            config=self.config,
            policy=policy,
            aggregates=aggregates,
            sample_trial=sample_trial,
            price_histogram=price_histogram,
            sales_by_period=sales_by_period
        )
    
    def _run_single_trial(self, policy: PolicyMatrix, random_numbers: np.ndarray, trial_id: int) -> SimulationState:
        """
        Run a single simulation trial.
        
        Args:
            policy: Pricing policy
            random_numbers: Array of random numbers for this trial
            trial_id: Trial identifier
            
        Returns:
            Simulation state after trial completion
        """
        state = SimulationState(
            capacity=self.config.I,
            revenue=0.0,
            sales_count=0,
            price_history=[],
            sales_history=[],
            revenue_history=[]
        )
        
        for t in range(self.config.T):
            if state.capacity <= 0:
                # No capacity left, no more sales possible
                state.price_history.append(0)
                state.sales_history.append(False)
                state.revenue_history.append(0.0)
                continue
            
            # Get price from policy matrix
            # capacity_index = state.capacity - 1 (0-indexed)
            capacity_index = state.capacity - 1
            price = policy.matrix[capacity_index][t]
            
            # Attempt sale with probability based on price
            sale_probability = self.SALE_PROBABILITIES[price]
            random_value = random_numbers[t]
            
            sold = random_value < sale_probability
            
            # Update state
            state.price_history.append(price)
            state.sales_history.append(sold)
            
            if sold:
                state.capacity -= 1
                state.revenue += price
                state.sales_count += 1
                state.revenue_history.append(price)
            else:
                state.revenue_history.append(0.0)
        
        return state
    
    def _calculate_aggregates(self, trial_results: List[SimulationState]) -> SimulationAggregates:
        """
        Calculate aggregate statistics from trial results.
        
        Args:
            trial_results: List of simulation states
            
        Returns:
            Aggregated statistics
        """
        revenues = [result.revenue for result in trial_results]
        sales_counts = [result.sales_count for result in trial_results]
        
        # Basic statistics
        avg_revenue = np.mean(revenues)
        std_revenue = np.std(revenues)
        
        # Fill rate (average capacity sold)
        fill_rate = np.mean(sales_counts) / self.config.I
        
        # Average price (weighted by sales)
        all_prices = []
        for result in trial_results:
            for i, sold in enumerate(result.sales_history):
                if sold:
                    all_prices.append(result.price_history[i])
        
        avg_price = np.mean(all_prices) if all_prices else 0.0
        
        # Last-minute share (sales in final k periods)
        last_minute_sales = 0
        total_sales = 0
        
        for result in trial_results:
            for t in range(self.config.T - self.config.last_minute_k, self.config.T):
                if t < len(result.sales_history) and result.sales_history[t]:
                    last_minute_sales += 1
                if t < len(result.sales_history):
                    total_sales += 1
        
        last_minute_share = last_minute_sales / total_sales if total_sales > 0 else 0.0
        
        # Price mix counts
        price_mix = {30000: 0, 40000: 0, 50000: 0}
        for result in trial_results:
            for i, sold in enumerate(result.sales_history):
                if sold and i < len(result.price_history):
                    price = result.price_history[i]
                    price_mix[price] += 1
        
        # Convert to string keys for JSON serialization
        price_mix_str = {
            'LOW': price_mix[30000],
            'MED': price_mix[40000], 
            'HIGH': price_mix[50000]
        }
        
        return SimulationAggregates(
            avg_revenue=avg_revenue,
            std_revenue=std_revenue,
            fill_rate=fill_rate,
            avg_price=avg_price,
            last_minute_share=last_minute_share,
            regret=None,  # Will be calculated separately if DP benchmark is available
            price_mix=price_mix_str
        )
    
    def _create_sample_trial(self, trial_state: SimulationState) -> SampleTrial:
        """
        Create sample trial data for visualization.
        
        Args:
            trial_state: State from a single trial
            
        Returns:
            Sample trial data
        """
        steps = []
        for t in range(self.config.T):
            if t < len(trial_state.price_history):
                step = TrialStep(
                    period=t + 1,
                    remaining_capacity=max(0, self.config.I - sum(trial_state.sales_history[:t+1])),
                    price=trial_state.price_history[t],
                    sold=trial_state.sales_history[t] if t < len(trial_state.sales_history) else False,
                    revenue=trial_state.revenue_history[t] if t < len(trial_state.revenue_history) else 0.0
                )
                steps.append(step)
        
        return SampleTrial(
            trial_id=0,
            steps=steps,
            total_revenue=trial_state.revenue
        )
    
    def _create_price_histogram(self, trial_results: List[SimulationState]) -> Dict[str, int]:
        """
        Create histogram of prices used across all trials.
        
        Args:
            trial_results: List of simulation states
            
        Returns:
            Price histogram
        """
        histogram = {30000: 0, 40000: 0, 50000: 0}
        
        for result in trial_results:
            for i, sold in enumerate(result.sales_history):
                if sold and i < len(result.price_history):
                    price = result.price_history[i]
                    histogram[price] += 1
        
        # Convert to string keys
        return {
            'LOW': histogram[30000],
            'MED': histogram[40000],
            'HIGH': histogram[50000]
        }
    
    def _create_sales_by_period_histogram(self, trial_results: List[SimulationState]) -> List[int]:
        """
        Create histogram of sales by time period.
        
        Args:
            trial_results: List of simulation states
            
        Returns:
            List of sales count per period
        """
        sales_by_period = [0] * self.config.T
        
        for result in trial_results:
            for t in range(min(len(result.sales_history), self.config.T)):
                if result.sales_history[t]:
                    sales_by_period[t] += 1
        
        return sales_by_period
    
    def calculate_regret(self, policy: PolicyMatrix, dp_benchmark_revenue: float) -> float:
        """
        Calculate regret vs dynamic programming benchmark.
        
        Args:
            policy: Pricing policy
            dp_benchmark_revenue: Revenue from DP benchmark
            
        Returns:
            Regret value (non-negative)
        """
        # Run simulation to get average revenue
        results = self.run_simulation(policy)
        policy_revenue = results.aggregates.avg_revenue
        
        regret = max(0.0, dp_benchmark_revenue - policy_revenue)
        return regret

