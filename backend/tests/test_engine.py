"""
Tests for simulation engine functionality.
"""

import pytest
import numpy as np
from models import PolicyMatrix, SimulationConfig
from sim.engine import SimulationEngine
from sim.csv_loader import CSVLoader
from sim.policy import PolicyNormalizer


class TestSimulationEngine:
    """Test cases for SimulationEngine."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.config = SimulationConfig(I=3, T=5, trials=100, seed=42)
        self.engine = SimulationEngine(self.config, "test")
        
        # Create a simple policy matrix
        self.policy = PolicyMatrix(
            matrix=[
                [50000, 50000, 40000, 40000, 40000],  # HIGH, HIGH, MED, MED, MED
                [50000, 50000, 50000, 40000, 40000],  # HIGH, HIGH, HIGH, MED, MED
                [50000, 50000, 50000, 50000, 40000]   # HIGH, HIGH, HIGH, HIGH, MED
            ],
            I=3,
            T=5
        )
    
    def test_engine_initialization(self):
        """Test engine initialization."""
        assert self.engine.config == self.config
        assert self.engine.assignment_version == "test"
        assert self.engine.rng_bank is not None
    
    def test_config_validation(self):
        """Test configuration validation."""
        # Valid config should not raise
        valid_config = SimulationConfig(I=3, T=5, trials=100)
        engine = SimulationEngine(valid_config, "test")
        assert engine.config == valid_config
        
        # Invalid configs should raise
        with pytest.raises(ValueError):
            SimulationEngine(SimulationConfig(I=0, T=5), "test")
        
        with pytest.raises(ValueError):
            SimulationEngine(SimulationConfig(I=3, T=0), "test")
        
        with pytest.raises(ValueError):
            SimulationEngine(SimulationConfig(I=3, T=5, trials=0), "test")
    
    def test_policy_dimension_validation(self):
        """Test policy dimension validation."""
        # Valid policy should not raise
        self.engine.run_simulation(self.policy)
        
        # Invalid dimensions should raise
        invalid_policy = PolicyMatrix(matrix=[[50000, 50000]], I=1, T=2)
        with pytest.raises(ValueError):
            self.engine.run_simulation(invalid_policy)
    
    def test_simulation_results_structure(self):
        """Test simulation results structure."""
        results = self.engine.run_simulation(self.policy)
        
        # Check basic structure
        assert results.config == self.config
        assert results.policy == self.policy
        assert results.aggregates is not None
        assert results.sample_trial is not None
        assert results.price_histogram is not None
        assert results.sales_by_period is not None
        
        # Check aggregates
        aggregates = results.aggregates
        assert aggregates.avg_revenue >= 0
        assert aggregates.std_revenue >= 0
        assert 0 <= aggregates.fill_rate <= 1
        assert aggregates.avg_price >= 0
        assert 0 <= aggregates.last_minute_share <= 1
        assert aggregates.price_mix is not None
        
        # Check sample trial
        sample_trial = results.sample_trial
        assert sample_trial.trial_id == 0
        assert len(sample_trial.steps) == self.config.T
        assert sample_trial.total_revenue >= 0
        
        # Check price histogram
        assert set(results.price_histogram.keys()) == {'LOW', 'MED', 'HIGH'}
        
        # Check sales by period
        assert len(results.sales_by_period) == self.config.T
        assert all(count >= 0 for count in results.sales_by_period)
    
    def test_deterministic_results(self):
        """Test that results are deterministic with same seed."""
        results1 = self.engine.run_simulation(self.policy)
        results2 = self.engine.run_simulation(self.policy)
        
        # Results should be identical
        assert results1.aggregates.avg_revenue == results2.aggregates.avg_revenue
        assert results1.aggregates.std_revenue == results2.aggregates.std_revenue
        assert results1.aggregates.fill_rate == results2.aggregates.fill_rate
        assert results1.sample_trial.total_revenue == results2.sample_trial.total_revenue
    
    def test_different_seeds_produce_different_results(self):
        """Test that different seeds produce different results."""
        config1 = SimulationConfig(I=3, T=5, trials=100, seed=42)
        config2 = SimulationConfig(I=3, T=5, trials=100, seed=123)
        
        engine1 = SimulationEngine(config1, "test")
        engine2 = SimulationEngine(config2, "test")
        
        results1 = engine1.run_simulation(self.policy)
        results2 = engine2.run_simulation(self.policy)
        
        # Results should be different (with high probability)
        assert results1.aggregates.avg_revenue != results2.aggregates.avg_revenue
    
    def test_sale_probabilities(self):
        """Test that sale probabilities are correctly applied."""
        # Create a policy with only HIGH prices (lowest sale probability)
        high_price_policy = PolicyMatrix(
            matrix=[[50000] * 5 for _ in range(3)],
            I=3,
            T=5
        )
        
        # Create a policy with only LOW prices (highest sale probability)
        low_price_policy = PolicyMatrix(
            matrix=[[30000] * 5 for _ in range(3)],
            I=3,
            T=5
        )
        
        results_high = self.engine.run_simulation(high_price_policy)
        results_low = self.engine.run_simulation(low_price_policy)
        
        # LOW price policy should have higher fill rate
        assert results_low.aggregates.fill_rate > results_high.aggregates.fill_rate
    
    def test_regret_calculation(self):
        """Test regret calculation vs DP benchmark."""
        dp_benchmark_revenue = 100000.0  # Mock optimal revenue
        
        regret = self.engine.calculate_regret(self.policy, dp_benchmark_revenue)
        
        assert regret >= 0
        assert isinstance(regret, float)
    
    def test_trial_step_structure(self):
        """Test individual trial step structure."""
        results = self.engine.run_simulation(self.policy)
        
        for step in results.sample_trial.steps:
            assert step.period >= 1
            assert step.remaining_capacity >= 0
            assert step.price in [30000, 40000, 50000]
            assert isinstance(step.sold, bool)
            assert step.revenue >= 0
    
    def test_capacity_decreases_over_time(self):
        """Test that capacity decreases over time in sample trial."""
        results = self.engine.run_simulation(self.policy)
        
        capacities = [step.remaining_capacity for step in results.sample_trial.steps]
        
        # Capacity should be non-increasing
        for i in range(1, len(capacities)):
            assert capacities[i] <= capacities[i-1]
    
    def test_revenue_calculation(self):
        """Test revenue calculation logic."""
        results = self.engine.run_simulation(self.policy)
        
        # Calculate expected revenue from sample trial
        expected_revenue = sum(
            step.revenue for step in results.sample_trial.steps
        )
        
        assert results.sample_trial.total_revenue == expected_revenue
    
    def test_price_mix_calculation(self):
        """Test price mix calculation."""
        results = self.engine.run_simulation(self.policy)
        
        price_mix = results.aggregates.price_mix
        
        # All prices should be non-negative
        assert all(count >= 0 for count in price_mix.values())
        
        # Should have all three price levels
        assert set(price_mix.keys()) == {'LOW', 'MED', 'HIGH'}
    
    def test_large_trial_count(self):
        """Test simulation with larger trial count."""
        large_config = SimulationConfig(I=3, T=5, trials=1000, seed=42)
        large_engine = SimulationEngine(large_config, "test")
        
        results = large_engine.run_simulation(self.policy)
        
        # Should complete without error
        assert results.aggregates.avg_revenue >= 0
        assert len(results.sales_by_period) == large_config.T


