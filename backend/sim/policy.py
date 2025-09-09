"""
Policy normalization and validation for the Canyon Sunset Resort simulation.
"""

from typing import List, Dict, Tuple
import numpy as np
from models import PolicyMatrix, CSVValidationResult


class PolicyNormalizer:
    """Handles normalization of policy matrices to integer prices."""
    
    PRICE_MAPPING = {
        'LOW': 30000,
        'MED': 40000,
        'HIGH': 50000
    }
    
    def __init__(self):
        self.csv_loader = None  # Will be injected
    
    def normalize_policy(self, csv_result: CSVValidationResult) -> PolicyMatrix:
        """
        Convert validated CSV matrix to normalized PolicyMatrix.
        
        Args:
            csv_result: Validated CSV parsing result
            
        Returns:
            PolicyMatrix with integer prices
            
        Raises:
            ValueError: If CSV validation failed
        """
        if not csv_result.is_valid:
            raise ValueError("Cannot normalize invalid CSV")
        
        if csv_result.matrix is None:
            raise ValueError("No matrix data in CSV result")
        
        # Normalize each cell to integer price
        normalized_matrix = []
        for row in csv_result.matrix:
            normalized_row = []
            for cell in row:
                normalized_price = self._normalize_cell(cell)
                normalized_row.append(normalized_price)
            normalized_matrix.append(normalized_row)
        
        return PolicyMatrix(
            matrix=normalized_matrix,
            I=csv_result.I,
            T=csv_result.T
        )
    
    def _normalize_cell(self, cell_value: str) -> int:
        """
        Normalize a single cell value to integer price.
        
        Args:
            cell_value: Raw cell value from CSV
            
        Returns:
            Integer price (30000, 40000, or 50000)
        """
        cell_clean = cell_value.strip().upper()
        
        # Handle text representations
        if cell_clean in ['LOW', 'MED', 'MEDIUM', 'HIGH']:
            if cell_clean in ['LOW']:
                return 30000
            elif cell_clean in ['MED', 'MEDIUM']:
                return 40000
            elif cell_clean in ['HIGH']:
                return 50000
        
        # Handle numeric representations
        try:
            numeric_value = int(cell_clean)
            if numeric_value == 30:
                return 30000
            elif numeric_value == 40:
                return 40000
            elif numeric_value == 50:
                return 50000
            elif numeric_value == 30000:
                return 30000
            elif numeric_value == 40000:
                return 40000
            elif numeric_value == 50000:
                return 50000
        except ValueError:
            pass
        
        # Handle currency representations
        if cell_clean.startswith('$'):
            try:
                numeric_value = int(cell_clean[1:])
                if numeric_value == 30:
                    return 30000
                elif numeric_value == 40:
                    return 40000
                elif numeric_value == 50:
                    return 50000
            except ValueError:
                pass
        
        if cell_clean.endswith('$'):
            try:
                numeric_value = int(cell_clean[:-1])
                if numeric_value == 30:
                    return 30000
                elif numeric_value == 40:
                    return 40000
                elif numeric_value == 50:
                    return 50000
            except ValueError:
                pass
        
        raise ValueError(f"Cannot normalize price '{cell_value}'")
    
    def validate_policy_structure(self, policy: PolicyMatrix) -> List[str]:
        """
        Validate policy structure for common issues.
        
        Args:
            policy: Policy matrix to validate
            
        Returns:
            List of validation warnings/errors
        """
        warnings = []
        
        # Check for reasonable capacity progression
        for i in range(policy.I):
            for t in range(policy.T - 1):
                current_price = policy.matrix[i][t]
                next_price = policy.matrix[i][t + 1]
                
                # Warn if price increases significantly over time
                if current_price < next_price and next_price - current_price == 20000:
                    warnings.append(
                        f"Row {i+1}: Price increases from {current_price} to {next_price} "
                        f"at period {t+1} to {t+2}"
                    )
        
        # Check for capacity level consistency
        for t in range(policy.T):
            prices = [policy.matrix[i][t] for i in range(policy.I)]
            
            # Warn if higher capacity levels have lower prices (counterintuitive)
            for i in range(policy.I - 1):
                if prices[i] > prices[i + 1]:
                    warnings.append(
                        f"Period {t+1}: Capacity level {i+1} ({prices[i]}) "
                        f"has higher price than level {i+2} ({prices[i+1]})"
                    )
        
        return warnings
    
    def get_price_distribution(self, policy: PolicyMatrix) -> Dict[int, int]:
        """
        Get distribution of prices in the policy matrix.
        
        Args:
            policy: Policy matrix
            
        Returns:
            Dictionary mapping price to count
        """
        distribution = {30000: 0, 40000: 0, 50000: 0}
        
        for row in policy.matrix:
            for price in row:
                distribution[price] += 1
        
        return distribution
    
    def create_heatmap_data(self, policy: PolicyMatrix) -> Dict:
        """
        Create data structure for heatmap visualization.
        
        Args:
            policy: Policy matrix
            
        Returns:
            Dictionary with heatmap data
        """
        # Convert prices to display values
        price_labels = {30000: 'LOW', 40000: 'MED', 50000: 'HIGH'}
        
        heatmap_data = {
            'data': [],
            'xLabels': [f'Period {t+1}' for t in range(policy.T)],
            'yLabels': [f'Capacity {i+1}' for i in range(policy.I)],
            'colors': {30000: '#ff6b6b', 40000: '#4ecdc4', 50000: '#45b7d1'}  # Red, Teal, Blue
        }
        
        for i, row in enumerate(policy.matrix):
            heatmap_row = []
            for j, price in enumerate(row):
                heatmap_row.append({
                    'value': price,
                    'label': price_labels[price],
                    'color': heatmap_data['colors'][price]
                })
            heatmap_data['data'].append(heatmap_row)
        
        return heatmap_data
    
    def generate_sample_policy(self, I: int, T: int, strategy_type: str = "conservative") -> PolicyMatrix:
        """
        Generate a sample policy matrix for testing.
        
        Args:
            I: Number of capacity levels
            T: Number of time periods
            strategy_type: Type of strategy ("conservative", "aggressive", "dynamic")
            
        Returns:
            Sample PolicyMatrix
        """
        matrix = []
        
        if strategy_type == "conservative":
            # Start high, decrease over time
            for i in range(I):
                row = []
                for t in range(T):
                    if t < T // 3:
                        row.append(50000)  # HIGH
                    elif t < 2 * T // 3:
                        row.append(40000)  # MED
                    else:
                        row.append(30000)  # LOW
                matrix.append(row)
        
        elif strategy_type == "aggressive":
            # Start low, increase over time
            for i in range(I):
                row = []
                for t in range(T):
                    if t < T // 3:
                        row.append(30000)  # LOW
                    elif t < 2 * T // 3:
                        row.append(40000)  # MED
                    else:
                        row.append(50000)  # HIGH
                matrix.append(row)
        
        elif strategy_type == "dynamic":
            # Vary by capacity level
            for i in range(I):
                row = []
                for t in range(T):
                    if i < I // 3:
                        # Low capacity: start high
                        if t < T // 2:
                            row.append(50000)
                        else:
                            row.append(40000)
                    elif i < 2 * I // 3:
                        # Medium capacity: balanced
                        if t < T // 3:
                            row.append(50000)
                        elif t < 2 * T // 3:
                            row.append(40000)
                        else:
                            row.append(30000)
                    else:
                        # High capacity: start low
                        if t < T // 2:
                            row.append(30000)
                        else:
                            row.append(40000)
                matrix.append(row)
        
        return PolicyMatrix(matrix=matrix, I=I, T=T)

