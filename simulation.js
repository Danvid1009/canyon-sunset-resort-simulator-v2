/**
 * Canyon Sunset Resort Simulator - Monte Carlo Simulation Engine
 * Ported from Python to vanilla JavaScript
 */

// Configuration constants
const CONFIG = {
  I: 7,  // Capacity levels
  T: 15, // Time periods
  PRICE_MAPPING: {
    'LOW': 30000,
    'MED': 40000,
    'HIGH': 50000
  },
  SALE_PROBABILITIES: {
    30000: 0.90,  // LOW price
    40000: 0.80,  // MED price  
    50000: 0.40   // HIGH price
  },
  DEFAULT_TRIALS: 10000,
  DEFAULT_SEED: 42
};

/**
 * Simple Linear Congruential Generator for deterministic random numbers
 */
class RNG {
  constructor(seed = CONFIG.DEFAULT_SEED) {
    this.seed = seed;
    this.current = seed;
    this.a = 1664525;
    this.c = 1013904223;
    this.m = Math.pow(2, 32);
  }

  next() {
    this.current = (this.a * this.current + this.c) % this.m;
    return this.current / this.m;
  }

  reset() {
    this.current = this.seed;
  }
}

/**
 * Policy Matrix class
 */
class PolicyMatrix {
  constructor(matrix) {
    this.matrix = matrix;
    this.I = matrix.length;
    this.T = matrix[0].length;
  }

  getPrice(capacityIndex, period) {
    if (capacityIndex < 0 || capacityIndex >= this.I || period < 0 || period >= this.T) {
      return 0;
    }
    return this.matrix[capacityIndex][period];
  }
}

/**
 * Simulation State for tracking a single trial
 */
class SimulationState {
  constructor(initialCapacity) {
    this.capacity = initialCapacity;
    this.revenue = 0.0;
    this.salesCount = 0;
    this.priceHistory = [];
    this.salesHistory = [];
    this.revenueHistory = [];
  }
}

/**
 * Simulation Results
 */
class SimulationResults {
  constructor(config, policy, aggregates, sampleTrial, priceHistogram, salesByPeriod) {
    this.config = config;
    this.policy = policy;
    this.aggregates = aggregates;
    this.sampleTrial = sampleTrial;
    this.priceHistogram = priceHistogram;
    this.salesByPeriod = salesByPeriod;
  }
}

/**
 * Main Simulation Engine
 */
class SimulationEngine {
  constructor(config = {}) {
    this.config = {
      I: CONFIG.I,
      T: CONFIG.T,
      trials: config.trials || CONFIG.DEFAULT_TRIALS,
      seed: config.seed || CONFIG.DEFAULT_SEED,
      lastMinuteK: config.lastMinuteK || 3
    };
    
    this.rng = new RNG(this.config.seed);
    this._validateConfig();
  }

  _validateConfig() {
    if (this.config.I <= 0 || this.config.T <= 0) {
      throw new Error("Capacity and periods must be positive");
    }
    
    if (this.config.trials <= 0) {
      throw new Error("Number of trials must be positive");
    }
    
    if (this.config.lastMinuteK > this.config.T) {
      throw new Error("lastMinuteK cannot exceed total periods");
    }
  }

  /**
   * Run Monte Carlo simulation for the given policy
   */
  runSimulation(policy) {
    // Validate policy dimensions match config
    if (policy.I !== this.config.I || policy.T !== this.config.T) {
      throw new Error(
        `Policy dimensions (${policy.I}x${policy.T}) don't match ` +
        `config (${this.config.I}x${this.config.T})`
      );
    }

    // Reset RNG for deterministic results
    this.rng.reset();

    // Run all trials
    const trialResults = [];
    for (let trialId = 0; trialId < this.config.trials; trialId++) {
      const trialResult = this._runSingleTrial(policy, trialId);
      trialResults.push(trialResult);
    }

    // Calculate aggregates
    const aggregates = this._calculateAggregates(trialResults);
    
    // Get sample trial (first trial for visualization)
    const sampleTrial = this._createSampleTrial(trialResults[0]);
    
    // Create histograms
    const priceHistogram = this._createPriceHistogram(trialResults);
    const salesByPeriod = this._createSalesByPeriodHistogram(trialResults);
    
    return new SimulationResults(
      this.config,
      policy,
      aggregates,
      sampleTrial,
      priceHistogram,
      salesByPeriod
    );
  }

  /**
   * Run a single simulation trial
   */
  _runSingleTrial(policy, trialId) {
    const state = new SimulationState(this.config.I);
    
    for (let t = 0; t < this.config.T; t++) {
      if (state.capacity <= 0) {
        // No capacity left, no more sales possible
        state.priceHistory.push(0);
        state.salesHistory.push(false);
        state.revenueHistory.push(0.0);
        continue;
      }
      
      // Get price from policy matrix
      const capacityIndex = state.capacity - 1; // 0-indexed
      const price = policy.getPrice(capacityIndex, t);
      
      // Attempt sale with probability based on price
      const saleProbability = CONFIG.SALE_PROBABILITIES[price] || 0;
      const randomValue = this.rng.next();
      
      const sold = randomValue < saleProbability;
      
      // Update state
      state.priceHistory.push(price);
      state.salesHistory.push(sold);
      
      if (sold) {
        state.capacity -= 1;
        state.revenue += price;
        state.salesCount += 1;
        state.revenueHistory.push(price);
      } else {
        state.revenueHistory.push(0.0);
      }
    }
    
    return state;
  }

  /**
   * Calculate aggregate statistics from trial results
   */
  _calculateAggregates(trialResults) {
    const revenues = trialResults.map(result => result.revenue);
    const salesCounts = trialResults.map(result => result.salesCount);
    
    // Basic statistics
    const avgRevenue = this._mean(revenues);
    const stdRevenue = this._std(revenues);
    
    // Fill rate (average capacity sold)
    const fillRate = this._mean(salesCounts) / this.config.I;
    
    // Average price (weighted by sales)
    const allPrices = [];
    for (const result of trialResults) {
      for (let i = 0; i < result.salesHistory.length; i++) {
        if (result.salesHistory[i]) {
          allPrices.push(result.priceHistory[i]);
        }
      }
    }
    
    const avgPrice = allPrices.length > 0 ? this._mean(allPrices) : 0.0;
    
    // Last-minute share (sales in final k periods)
    let lastMinuteSales = 0;
    let totalSales = 0;
    
    for (const result of trialResults) {
      for (let t = this.config.T - this.config.lastMinuteK; t < this.config.T; t++) {
        if (t < result.salesHistory.length && result.salesHistory[t]) {
          lastMinuteSales += 1;
        }
        if (t < result.salesHistory.length) {
          totalSales += 1;
        }
      }
    }
    
    const lastMinuteShare = totalSales > 0 ? lastMinuteSales / totalSales : 0.0;
    
    // Price mix counts
    const priceMix = { 30000: 0, 40000: 0, 50000: 0 };
    for (const result of trialResults) {
      for (let i = 0; i < result.salesHistory.length; i++) {
        if (result.salesHistory[i] && i < result.priceHistory.length) {
          const price = result.priceHistory[i];
          if (priceMix.hasOwnProperty(price)) {
            priceMix[price] += 1;
          }
        }
      }
    }
    
    // Convert to string keys for consistency
    const priceMixStr = {
      'LOW': priceMix[30000],
      'MED': priceMix[40000], 
      'HIGH': priceMix[50000]
    };
    
    return {
      avgRevenue: avgRevenue,
      stdRevenue: stdRevenue,
      fillRate: fillRate,
      avgPrice: avgPrice,
      lastMinuteShare: lastMinuteShare,
      priceMix: priceMixStr
    };
  }

  /**
   * Create sample trial data for visualization
   */
  _createSampleTrial(trialState) {
    const steps = [];
    for (let t = 0; t < this.config.T; t++) {
      if (t < trialState.priceHistory.length) {
        const step = {
          period: t + 1,
          remainingCapacity: Math.max(0, this.config.I - this._sum(trialState.salesHistory.slice(0, t + 1))),
          price: trialState.priceHistory[t],
          sold: trialState.salesHistory[t] || false,
          revenue: trialState.revenueHistory[t] || 0.0
        };
        steps.push(step);
      }
    }
    
    return {
      trialId: 0,
      steps: steps,
      totalRevenue: trialState.revenue
    };
  }

  /**
   * Create histogram of prices used across all trials
   */
  _createPriceHistogram(trialResults) {
    const histogram = { 30000: 0, 40000: 0, 50000: 0 };
    
    for (const result of trialResults) {
      for (let i = 0; i < result.salesHistory.length; i++) {
        if (result.salesHistory[i] && i < result.priceHistory.length) {
          const price = result.priceHistory[i];
          if (histogram.hasOwnProperty(price)) {
            histogram[price] += 1;
          }
        }
      }
    }
    
    // Convert to string keys
    return {
      'LOW': histogram[30000],
      'MED': histogram[40000],
      'HIGH': histogram[50000]
    };
  }

  /**
   * Create histogram of sales by time period
   */
  _createSalesByPeriodHistogram(trialResults) {
    const salesByPeriod = new Array(this.config.T).fill(0);
    
    for (const result of trialResults) {
      for (let t = 0; t < Math.min(result.salesHistory.length, this.config.T); t++) {
        if (result.salesHistory[t]) {
          salesByPeriod[t] += 1;
        }
      }
    }
    
    return salesByPeriod;
  }

  // Utility functions
  _mean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  _std(arr) {
    const mean = this._mean(arr);
    const variance = this._mean(arr.map(val => Math.pow(val - mean, 2)));
    return Math.sqrt(variance);
  }

  _sum(arr) {
    return arr.reduce((sum, val) => sum + val, 0);
  }
}

/**
 * CSV Parser and Validator
 */
class CSVProcessor {
  static parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const matrix = [];
    
    for (const line of lines) {
      const row = line.split(',').map(cell => cell.trim().toUpperCase());
      matrix.push(row);
    }
    
    return matrix;
  }

  static validateMatrix(matrix) {
    const errors = [];
    
    if (matrix.length !== CONFIG.I) {
      errors.push({
        row: -1,
        col: -1,
        value: '',
        message: `Expected ${CONFIG.I} rows, got ${matrix.length}`
      });
    }
    
    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];
      
      if (row.length !== CONFIG.T) {
        errors.push({
          row: i + 1,
          col: -1,
          value: '',
          message: `Row ${i + 1}: Expected ${CONFIG.T} columns, got ${row.length}`
        });
      }
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (!this._isValidPriceLevel(cell)) {
          errors.push({
            row: i + 1,
            col: j + 1,
            value: cell,
            message: `Invalid price level: ${cell}. Use LOW, MED, HIGH, 30, 40, 50, $30, $40, or $50`
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      dimensions: { I: matrix.length, T: matrix[0]?.length || 0 },
      matrixPreview: matrix
    };
  }

  static _isValidPriceLevel(value) {
    const validValues = ['LOW', 'MED', 'HIGH', '30', '40', '50', '$30', '$40', '$50'];
    return validValues.includes(value);
  }

  static convertToPriceMatrix(matrix) {
    const priceMatrix = [];
    
    for (const row of matrix) {
      const priceRow = [];
      for (const cell of row) {
        let price;
        if (cell === 'LOW' || cell === '30' || cell === '$30') {
          price = CONFIG.PRICE_MAPPING.LOW;
        } else if (cell === 'MED' || cell === '40' || cell === '$40') {
          price = CONFIG.PRICE_MAPPING.MED;
        } else if (cell === 'HIGH' || cell === '50' || cell === '$50') {
          price = CONFIG.PRICE_MAPPING.HIGH;
        } else {
          price = 0;
        }
        priceRow.push(price);
      }
      priceMatrix.push(priceRow);
    }
    
    return new PolicyMatrix(priceMatrix);
  }

  static matrixToCSV(matrix) {
    const rows = [];
    for (const row of matrix) {
      const csvRow = row.join(',');
      rows.push(csvRow);
    }
    return rows.join('\n');
  }
}

// Export for use in main app
window.SimulationEngine = SimulationEngine;
window.PolicyMatrix = PolicyMatrix;
window.CSVProcessor = CSVProcessor;
window.CONFIG = CONFIG;
