"""
Tests for CSV loader functionality.
"""

import pytest
from sim.csv_loader import CSVLoader


class TestCSVLoader:
    """Test cases for CSVLoader."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.loader = CSVLoader()
    
    def test_valid_csv_without_headers(self):
        """Test parsing valid CSV without headers."""
        csv_content = """HIGH,HIGH,MED,MED,MED
HIGH,HIGH,HIGH,MED,MED
HIGH,HIGH,HIGH,HIGH,MED"""
        
        result = self.loader.parse_csv(csv_content)
        
        assert result.is_valid
        assert result.I == 3
        assert result.T == 5
        assert result.matrix == [
            ['HIGH', 'HIGH', 'MED', 'MED', 'MED'],
            ['HIGH', 'HIGH', 'HIGH', 'MED', 'MED'],
            ['HIGH', 'HIGH', 'HIGH', 'HIGH', 'MED']
        ]
    
    def test_valid_csv_with_headers(self):
        """Test parsing valid CSV with headers."""
        csv_content = """Capacity,Period 1,Period 2,Period 3,Period 4,Period 5
Level 1,HIGH,HIGH,MED,MED,MED
Level 2,HIGH,HIGH,HIGH,MED,MED
Level 3,HIGH,HIGH,HIGH,HIGH,MED"""
        
        result = self.loader.parse_csv(csv_content)
        
        assert result.is_valid
        assert result.I == 3
        assert result.T == 5
        assert result.matrix == [
            ['HIGH', 'HIGH', 'MED', 'MED', 'MED'],
            ['HIGH', 'HIGH', 'HIGH', 'MED', 'MED'],
            ['HIGH', 'HIGH', 'HIGH', 'HIGH', 'MED']
        ]
    
    def test_valid_csv_numeric_prices(self):
        """Test parsing CSV with numeric prices."""
        csv_content = """50,50,40,40,40
50,50,50,40,40
50,50,50,50,40"""
        
        result = self.loader.parse_csv(csv_content)
        
        assert result.is_valid
        assert result.I == 3
        assert result.T == 5
    
    def test_valid_csv_currency_prices(self):
        """Test parsing CSV with currency prices."""
        csv_content = """$50,$50,$40,$40,$40
$50,$50,$50,$40,$40
$50,$50,$50,$50,$40"""
        
        result = self.loader.parse_csv(csv_content)
        
        assert result.is_valid
        assert result.I == 3
        assert result.T == 5
    
    def test_invalid_price_value(self):
        """Test CSV with invalid price values."""
        csv_content = """HIGH,HIGH,INVALID,MED,MED
HIGH,HIGH,HIGH,MED,MED
HIGH,HIGH,HIGH,HIGH,MED"""
        
        result = self.loader.parse_csv(csv_content)
        
        assert not result.is_valid
        assert len(result.errors) == 1
        assert result.errors[0].row == 1
        assert result.errors[0].col == 3
        assert "INVALID" in result.errors[0].message
    
    def test_empty_csv(self):
        """Test empty CSV."""
        csv_content = ""
        
        result = self.loader.parse_csv(csv_content)
        
        assert not result.is_valid
        assert len(result.errors) == 1
        assert "empty" in result.errors[0].message.lower()
    
    def test_inconsistent_row_lengths(self):
        """Test CSV with inconsistent row lengths."""
        csv_content = """HIGH,HIGH,MED,MED,MED
HIGH,HIGH,HIGH,MED
HIGH,HIGH,HIGH,HIGH,MED"""
        
        result = self.loader.parse_csv(csv_content)
        
        assert not result.is_valid
        assert any("columns" in error.message for error in result.errors)
    
    def test_normalize_price(self):
        """Test price normalization."""
        assert self.loader.normalize_price("LOW") == "LOW"
        assert self.loader.normalize_price("low") == "LOW"
        assert self.loader.normalize_price("MED") == "MED"
        assert self.loader.normalize_price("med") == "MED"
        assert self.loader.normalize_price("HIGH") == "HIGH"
        assert self.loader.normalize_price("high") == "HIGH"
        assert self.loader.normalize_price("30") == "LOW"
        assert self.loader.normalize_price("40") == "MED"
        assert self.loader.normalize_price("50") == "HIGH"
        assert self.loader.normalize_price("$30") == "LOW"
        assert self.loader.normalize_price("$40") == "MED"
        assert self.loader.normalize_price("$50") == "HIGH"
    
    def test_create_sample_csv(self):
        """Test sample CSV generation."""
        csv_content = self.loader.create_sample_csv(I=3, T=5)
        
        # Should be valid CSV
        result = self.loader.parse_csv(csv_content)
        assert result.is_valid
        assert result.I == 3
        assert result.T == 5
        
        # Should contain valid prices
        for row in result.matrix:
            for cell in row:
                assert cell in ['HIGH', 'MED', 'LOW']
    
    def test_case_insensitive_parsing(self):
        """Test case-insensitive price parsing."""
        csv_content = """high,med,low
HIGH,MED,LOW
High,Med,Low"""
        
        result = self.loader.parse_csv(csv_content)
        
        assert result.is_valid
        assert result.I == 3
        assert result.T == 3


