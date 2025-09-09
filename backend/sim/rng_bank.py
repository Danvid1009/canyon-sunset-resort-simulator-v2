"""
Deterministic random number bank for fair simulation comparisons.
"""

import numpy as np
from typing import Dict, List, Optional
import hashlib
import json


class RNGBank:
    """
    Manages deterministic random numbers for fair simulation comparisons.
    
    All students get the same random number sequence for the same assignment version,
    ensuring fair comparison of strategies.
    """
    
    def __init__(self, seed: Optional[int] = None, assignment_version: str = "default"):
        """
        Initialize the RNG bank.
        
        Args:
            seed: Random seed for reproducibility
            assignment_version: Version identifier for the assignment
        """
        self.seed = seed or 42
        self.assignment_version = assignment_version
        self.cache: Dict[str, np.ndarray] = {}
        
        # Generate deterministic seed from assignment version
        self.deterministic_seed = self._generate_deterministic_seed()
    
    def _generate_deterministic_seed(self) -> int:
        """Generate a deterministic seed from assignment version."""
        # Create hash of assignment version + base seed
        hash_input = f"{self.assignment_version}_{self.seed}"
        hash_bytes = hashlib.sha256(hash_input.encode()).digest()
        
        # Convert first 4 bytes to integer
        return int.from_bytes(hash_bytes[:4], byteorder='big')
    
    def get_random_numbers(self, trials: int, periods: int) -> np.ndarray:
        """
        Get deterministic random numbers for simulation.
        
        Args:
            trials: Number of Monte Carlo trials
            periods: Number of time periods
            
        Returns:
            Array of shape (trials, periods) with random numbers in [0, 1)
        """
        cache_key = f"{trials}_{periods}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Generate new random numbers
        rng = np.random.RandomState(self.deterministic_seed)
        
        # Use different seed for each parameter combination to avoid correlation
        param_seed = hash(cache_key) % (2**32)
        rng.seed(param_seed)
        
        random_numbers = rng.random((trials, periods))
        
        # Cache for reuse
        self.cache[cache_key] = random_numbers
        
        return random_numbers
    
    def get_trial_random_numbers(self, trial_id: int, periods: int) -> np.ndarray:
        """
        Get random numbers for a specific trial.
        
        Args:
            trial_id: Trial index
            periods: Number of time periods
            
        Returns:
            Array of shape (periods,) with random numbers for the trial
        """
        all_numbers = self.get_random_numbers(1, periods)  # Get for 1 trial
        return all_numbers[0]  # Return first (and only) trial
    
    def reset_cache(self):
        """Clear the random number cache."""
        self.cache.clear()
    
    def get_cache_info(self) -> Dict:
        """Get information about cached random numbers."""
        return {
            'cached_combinations': len(self.cache),
            'cache_keys': list(self.cache.keys()),
            'total_numbers': sum(arr.size for arr in self.cache.values()),
            'deterministic_seed': self.deterministic_seed,
            'assignment_version': self.assignment_version
        }


class GlobalRNGBank:
    """
    Global singleton for managing RNG banks across the application.
    """
    
    _instance: Optional['GlobalRNGBank'] = None
    _banks: Dict[str, RNGBank] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_bank(self, assignment_version: str = "default", seed: Optional[int] = None) -> RNGBank:
        """
        Get or create an RNG bank for the given assignment version.
        
        Args:
            assignment_version: Version identifier
            seed: Random seed
            
        Returns:
            RNGBank instance
        """
        bank_key = f"{assignment_version}_{seed or 42}"
        
        if bank_key not in self._banks:
            self._banks[bank_key] = RNGBank(seed=seed, assignment_version=assignment_version)
        
        return self._banks[bank_key]
    
    def clear_all_banks(self):
        """Clear all RNG banks."""
        self._banks.clear()
    
    def get_all_bank_info(self) -> Dict[str, Dict]:
        """Get information about all RNG banks."""
        return {
            bank_key: bank.get_cache_info() 
            for bank_key, bank in self._banks.items()
        }


# Global instance
global_rng_bank = GlobalRNGBank()


def get_rng_bank(assignment_version: str = "default", seed: Optional[int] = None) -> RNGBank:
    """
    Convenience function to get an RNG bank.
    
    Args:
        assignment_version: Version identifier
        seed: Random seed
        
    Returns:
        RNGBank instance
    """
    return global_rng_bank.get_bank(assignment_version, seed)


def validate_determinism(trials: int, periods: int, assignment_version: str = "default") -> bool:
    """
    Validate that random numbers are deterministic across calls.
    
    Args:
        trials: Number of trials
        periods: Number of periods
        assignment_version: Assignment version
        
    Returns:
        True if deterministic, False otherwise
    """
    bank1 = get_rng_bank(assignment_version)
    numbers1 = bank1.get_random_numbers(trials, periods)
    
    bank2 = get_rng_bank(assignment_version)
    numbers2 = bank2.get_random_numbers(trials, periods)
    
    return np.array_equal(numbers1, numbers2)

