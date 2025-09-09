"""
CSV parsing and validation for the Canyon Sunset Resort simulation.
"""

import csv
import io
from typing import List, Tuple, Optional, Dict, Any
from models import CSVValidationResult, CSVValidationError


class CSVLoader:
    """Handles CSV parsing and validation for pricing strategies."""
    
    # Valid price representations
    VALID_PRICES = {
        # Text representations
        'LOW': 'LOW', 'low': 'LOW', 'Low': 'LOW',
        'MED': 'MED', 'med': 'MED', 'Med': 'MED', 'MEDIUM': 'MED', 'medium': 'MED',
        'HIGH': 'HIGH', 'high': 'HIGH', 'High': 'HIGH',
        
        # Numeric representations
        '30': 'LOW', '40': 'MED', '50': 'HIGH',
        '30000': 'LOW', '40000': 'MED', '50000': 'HIGH',
        
        # Currency representations
        '$30': 'LOW', '$40': 'MED', '$50': 'HIGH',
        '30$': 'LOW', '40$': 'MED', '50$': 'HIGH',
    }
    
    def __init__(self):
        self.errors: List[CSVValidationError] = []
    
    def parse_csv(self, csv_content: str) -> CSVValidationResult:
        """
        Parse and validate CSV content.
        
        Args:
            csv_content: Raw CSV content as string
            
        Returns:
            CSVValidationResult with validation status and parsed data
        """
        self.errors = []
        
        try:
            # Parse CSV content
            csv_reader = csv.reader(io.StringIO(csv_content))
            rows = list(csv_reader)
            
            if not rows:
                self.errors.append(CSVValidationError(
                    row=0, col=0, value="", message="CSV is empty"
                ))
                return CSVValidationResult(is_valid=False, errors=self.errors)
            
            # Detect if first row/column are headers
            matrix, I, T = self._extract_matrix(rows)
            
            if not self.errors:
                # Validate matrix dimensions and values
                self._validate_matrix(matrix, I, T)
            
            if self.errors:
                return CSVValidationResult(
                    is_valid=False, 
                    errors=self.errors,
                    matrix=matrix,
                    I=I,
                    T=T
                )
            
            return CSVValidationResult(
                is_valid=True,
                matrix=matrix,
                I=I,
                T=T
            )
            
        except Exception as e:
            self.errors.append(CSVValidationError(
                row=0, col=0, value="", message=f"CSV parsing error: {str(e)}"
            ))
            return CSVValidationResult(is_valid=False, errors=self.errors)
    
    def _extract_matrix(self, rows: List[List[str]]) -> Tuple[List[List[str]], int, int]:
        """
        Extract the policy matrix from CSV rows, handling optional headers.
        
        Args:
            rows: Parsed CSV rows
            
        Returns:
            Tuple of (matrix, I, T) where matrix is the policy data
        """
        if not rows:
            return [], 0, 0
        
        # Check if first row looks like a header (contains non-price values)
        first_row = rows[0]
        has_row_header = self._is_header_row(first_row)
        
        # Check if first column looks like a header
        has_col_header = False
        if len(rows) > 1:
            first_col_values = [row[0] for row in rows[1:] if row]
            has_col_header = self._is_header_column(first_col_values)
        
        # Extract matrix based on header detection
        if has_row_header and has_col_header:
            # Both row and column headers
            matrix = [row[1:] for row in rows[1:]]
        elif has_row_header:
            # Only row header
            matrix = rows[1:]
        elif has_col_header:
            # Only column header
            matrix = [row[1:] for row in rows]
        else:
            # No headers
            matrix = rows
        
        # Clean up empty rows/columns
        matrix = [row for row in matrix if any(cell.strip() for cell in row)]
        if matrix:
            matrix = [row for row in matrix if len(row) == len(matrix[0])]
        
        I = len(matrix)
        T = len(matrix[0]) if matrix else 0
        
        return matrix, I, T
    
    def _is_header_row(self, row: List[str]) -> bool:
        """Check if a row looks like a header."""
        if not row:
            return False
        
        # Check if any cell contains non-price values
        for cell in row:
            cell_clean = cell.strip().upper()
            if cell_clean and cell_clean not in self.VALID_PRICES:
                # Check if it's a reasonable header (contains letters, not just numbers)
                if any(c.isalpha() for c in cell_clean):
                    return True
        
        return False
    
    def _is_header_column(self, values: List[str]) -> bool:
        """Check if first column looks like a header."""
        if not values:
            return False
        
        # Check if values look like capacity indicators (numbers, "Capacity", etc.)
        for value in values:
            value_clean = value.strip().upper()
            if value_clean:
                # If it contains letters and looks like a label
                if any(c.isalpha() for c in value_clean) and value_clean not in self.VALID_PRICES:
                    return True
                # If it's a number that could be capacity
                try:
                    int(value_clean)
                    return True
                except ValueError:
                    pass
        
        return False
    
    def _validate_matrix(self, matrix: List[List[str]], I: int, T: int) -> None:
        """
        Validate the policy matrix dimensions and values.
        
        Args:
            matrix: Policy matrix
            I: Number of capacity levels
            T: Number of time periods
        """
        if I == 0 or T == 0:
            self.errors.append(CSVValidationError(
                row=0, col=0, value="", message="Matrix must have at least one row and one column"
            ))
            return
        
        # Check dimensions are reasonable
        if I > 20:
            self.errors.append(CSVValidationError(
                row=0, col=0, value="", message=f"Too many capacity levels ({I}). Maximum is 20."
            ))
        
        if T > 50:
            self.errors.append(CSVValidationError(
                row=0, col=0, value="", message=f"Too many time periods ({T}). Maximum is 50."
            ))
        
        # Validate each cell
        for i, row in enumerate(matrix):
            if len(row) != T:
                self.errors.append(CSVValidationError(
                    row=i + 1, col=0, value="", 
                    message=f"Row {i + 1} has {len(row)} columns, expected {T}"
                ))
                continue
            
            for j, cell in enumerate(row):
                cell_clean = cell.strip()
                
                if not cell_clean:
                    self.errors.append(CSVValidationError(
                        row=i + 1, col=j + 1, value=cell,
                        message="Empty cell"
                    ))
                    continue
                
                if cell_clean.upper() not in self.VALID_PRICES:
                    self.errors.append(CSVValidationError(
                        row=i + 1, col=j + 1, value=cell,
                        message=f"Invalid price '{cell}'. Must be LOW/MED/HIGH, 30/40/50, or $30/$40/$50"
                    ))
    
    def normalize_price(self, price_str: str) -> str:
        """
        Normalize a price string to standard format.
        
        Args:
            price_str: Raw price string from CSV
            
        Returns:
            Normalized price string (LOW, MED, or HIGH)
        """
        price_clean = price_str.strip().upper()
        return self.VALID_PRICES.get(price_clean, price_clean)
    
    def get_price_mapping(self) -> Dict[str, int]:
        """Get mapping from normalized prices to integer values."""
        return {
            'LOW': 30000,
            'MED': 40000,
            'HIGH': 50000
        }


def create_sample_csv(I: int = 3, T: int = 5) -> str:
    """
    Create a sample CSV template for testing.
    
    Args:
        I: Number of capacity levels
        T: Number of time periods
        
    Returns:
        CSV content as string
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Create header row
    header = ['Capacity'] + [f'Period {t+1}' for t in range(T)]
    writer.writerow(header)
    
    # Create data rows
    for i in range(I):
        row = [f'Level {i+1}']
        # Example policy: start high, decrease over time
        for t in range(T):
            if t < 2:
                row.append('HIGH')
            elif t < 4:
                row.append('MED')
            else:
                row.append('LOW')
        writer.writerow(row)
    
    return output.getvalue()

