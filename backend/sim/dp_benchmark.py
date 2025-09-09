"""
Dynamic Programming benchmark for optimal pricing strategy.

This implements the optimal solution to the dynamic pricing problem using
dynamic programming, providing a benchmark for regret calculation.
"""

import numpy as np
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
from models import PolicyMatrix, SimulationConfig


@dataclass
class DPState:
    """State in the dynamic programming solution."""
    capacity: int
    period: int
    value: float
    optimal_price: int


class DPBenchmark:
    """
    Dynamic Programming solution for optimal pricing strategy.
    
    Solves the stochastic dynamic programming problem to find the optimal
    pricing policy that maximizes expected revenue.
    """
    
    # Sale probabilities for each price level (same as simulation)
    SALE_PROBABILITIES = {
        30000: 0.90,  # LOW price
        40000: 0.80,  # MED price  
        50000: 0.40   # HIGH price
    }
    
    # Available prices
    PRICES = [30000, 40000, 50000]
    
    def __init__(self, config: SimulationConfig):
        """
        Initialize DP benchmark.
        
        Args:
            config: Simulation configuration
        """
        self.config = config
        self.value_function: Dict[Tuple[int, int], float] = {}
        self.optimal_policy: Dict[Tuple[int, int], int] = {}
        
    def solve(self) -> Tuple[float, PolicyMatrix]:
        """
        Solve the dynamic programming problem.
        
        Returns:
            Tuple of (optimal_value, optimal_policy_matrix)
        """
        # Initialize value function
        self.value_function = {}
        self.optimal_policy = {}
        
        # Base case: no periods left
        for capacity in range(self.config.I + 1):
            self.value_function[(capacity, self.config.T)] = 0.0
        
        # Backward induction
        for t in range(self.config.T - 1, -1, -1):
            for capacity in range(self.config.I + 1):
                if capacity == 0:
                    # No capacity left
                    self.value_function[(capacity, t)] = 0.0
                    continue
                
                # Find optimal price for this state
                best_value = -np.inf
                best_price = None
                
                for price in self.PRICES:
                    expected_value = self._calculate_expected_value(capacity, t, price)
                    
                    if expected_value > best_value:
                        best_value = expected_value
                        best_price = price
                
                self.value_function[(capacity, t)] = best_value
                self.optimal_policy[(capacity, t)] = best_price
        
        # Extract optimal policy matrix
        optimal_matrix = self._extract_policy_matrix()
        
        # Calculate expected revenue from initial state
        optimal_value = self.value_function[(self.config.I, 0)]
        
        return optimal_value, optimal_matrix
    
    def _calculate_expected_value(self, capacity: int, period: int, price: int) -> float:
        """
        Calculate expected value for a given state and action.
        
        Args:
            capacity: Current capacity
            period: Current period
            price: Price to set
            
        Returns:
            Expected value
        """
        sale_prob = self.SALE_PROBABILITIES[price]
        
        # Expected revenue from this period
        immediate_reward = sale_prob * price
        
        # Expected future value
        if period + 1 < self.config.T:
            # If sale occurs
            future_value_sale = self.value_function.get((capacity - 1, period + 1), 0.0)
            # If no sale occurs  
            future_value_no_sale = self.value_function.get((capacity, period + 1), 0.0)
            
            expected_future_value = (
                sale_prob * future_value_sale + 
                (1 - sale_prob) * future_value_no_sale
            )
        else:
            expected_future_value = 0.0
        
        return immediate_reward + expected_future_value
    
    def _extract_policy_matrix(self) -> PolicyMatrix:
        """
        Extract optimal policy matrix from DP solution.
        
        Returns:
            Optimal policy matrix
        """
        matrix = []
        
        for capacity in range(1, self.config.I + 1):  # capacity levels 1 to I
            row = []
            for period in range(self.config.T):
                optimal_price = self.optimal_policy.get((capacity, period), 30000)
                row.append(optimal_price)
            matrix.append(row)
        
        return PolicyMatrix(matrix=matrix, I=self.config.I, T=self.config.T)
    
    def get_value_function(self) -> Dict[Tuple[int, int], float]:
        """
        Get the complete value function.
        
        Returns:
            Dictionary mapping (capacity, period) to optimal value
        """
        return self.value_function.copy()
    
    def get_optimal_policy(self) -> Dict[Tuple[int, int], int]:
        """
        Get the complete optimal policy.
        
        Returns:
            Dictionary mapping (capacity, period) to optimal price
        """
        return self.optimal_policy.copy()
    
    def analyze_policy_structure(self) -> Dict:
        """
        Analyze the structure of the optimal policy.
        
        Returns:
            Dictionary with policy analysis
        """
        analysis = {
            'price_distribution': {30000: 0, 40000: 0, 50000: 0},
            'capacity_patterns': {},
            'time_patterns': {},
            'insights': []
        }
        
        # Count price usage
        for capacity in range(1, self.config.I + 1):
            capacity_pattern = []
            for period in range(self.config.T):
                price = self.optimal_policy.get((capacity, period), 30000)
                analysis['price_distribution'][price] += 1
                capacity_pattern.append(price)
            analysis['capacity_patterns'][capacity] = capacity_pattern
        
        # Analyze time patterns
        for period in range(self.config.T):
            period_prices = []
            for capacity in range(1, self.config.I + 1):
                price = self.optimal_policy.get((capacity, period), 30000)
                period_prices.append(price)
            analysis['time_patterns'][period] = period_prices
        
        # Generate insights
        self._generate_insights(analysis)
        
        return analysis
    
    def _generate_insights(self, analysis: Dict) -> None:
        """Generate insights about the optimal policy."""
        insights = []
        
        # Check if policy is monotonic in capacity
        capacity_monotonic = True
        for period in range(self.config.T):
            for capacity in range(1, self.config.I):
                current_price = self.optimal_policy.get((capacity, period), 30000)
                next_price = self.optimal_policy.get((capacity + 1, period), 30000)
                if current_price < next_price:
                    capacity_monotonic = False
                    break
        
        if capacity_monotonic:
            insights.append("Policy is monotonic in capacity (higher capacity → lower price)")
        else:
            insights.append("Policy is not monotonic in capacity")
        
        # Check if policy is monotonic in time
        time_monotonic = True
        for capacity in range(1, self.config.I + 1):
            for period in range(self.config.T - 1):
                current_price = self.optimal_policy.get((capacity, period), 30000)
                next_price = self.optimal_policy.get((capacity, period + 1), 30000)
                if current_price > next_price:
                    time_monotonic = False
                    break
        
        if time_monotonic:
            insights.append("Policy is monotonic in time (earlier periods → higher price)")
        else:
            insights.append("Policy is not monotonic in time")
        
        # Price distribution insights
        total_decisions = self.config.I * self.config.T
        low_share = analysis['price_distribution'][30000] / total_decisions
        med_share = analysis['price_distribution'][40000] / total_decisions
        high_share = analysis['price_distribution'][50000] / total_decisions
        
        insights.append(f"Price distribution: LOW {low_share:.1%}, MED {med_share:.1%}, HIGH {high_share:.1%}")
        
        analysis['insights'] = insights
    
    def compare_with_policy(self, policy: PolicyMatrix) -> Dict:
        """
        Compare a given policy with the optimal policy.
        
        Args:
            policy: Policy to compare
            
        Returns:
            Comparison analysis
        """
        comparison = {
            'policy_differences': [],
            'value_differences': {},
            'regret': 0.0,
            'optimality_gap': 0.0
        }
        
        # Find differences in policy
        for capacity in range(1, self.config.I + 1):
            for period in range(self.config.T):
                optimal_price = self.optimal_policy.get((capacity, period), 30000)
                policy_price = policy.matrix[capacity - 1][period]
                
                if optimal_price != policy_price:
                    comparison['policy_differences'].append({
                        'capacity': capacity,
                        'period': period,
                        'optimal_price': optimal_price,
                        'policy_price': policy_price
                    })
        
        # Calculate regret (will be calculated by simulation engine)
        optimal_value = self.value_function.get((self.config.I, 0), 0.0)
        comparison['optimal_value'] = optimal_value
        
        return comparison


def create_dp_benchmark(config: SimulationConfig) -> DPBenchmark:
    """
    Create and solve a DP benchmark for the given configuration.
    
    Args:
        config: Simulation configuration
        
    Returns:
        Solved DP benchmark
    """
    benchmark = DPBenchmark(config)
    benchmark.solve()
    return benchmark


def get_optimal_revenue(config: SimulationConfig) -> float:
    """
    Get the optimal expected revenue for a configuration.
    
    Args:
        config: Simulation configuration
        
    Returns:
        Optimal expected revenue
    """
    benchmark = create_dp_benchmark(config)
    optimal_value, _ = benchmark.solve()
    return optimal_value

