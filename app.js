/**
 * Canyon Sunset Resort Simulator - Main Application
 * Interactive teaching simulator + strategy upload + Monte Carlo simulation
 */

class CanyonSunsetApp {
  constructor() {
    this.currentStep = 'teaching';
    this.policyMatrix = null;
    this.simulationResults = null;
    this.philosophy = '';
    
    // Teaching simulator state
    this.teachingState = {
      currentTrial: 1,
      maxTrials: 3,
      opportunity: 0,
      inventory: 7,
      revenue: 0,
      priceHistory: [],
      salesHistory: [],
      inventoryHistory: [7],
      trialResults: [],
      isTrialActive: false
    };
    
    // Chart instances
    this.charts = {
      inventory: null,
      priceHistory: null,
      salesOutcomes: null,
      monteCarlo: null
    };
    
    // Initialize the app
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeCharts();
    this.updateProgressSteps();
    this.showStep('teaching');
  }

  setupEventListeners() {
    // Progress step navigation
    document.querySelectorAll('.step').forEach(step => {
      step.addEventListener('click', (e) => {
        const stepName = e.currentTarget.dataset.step;
        this.goToStep(stepName);
      });
    });

    // Teaching simulator
    document.getElementById('start-trial').addEventListener('click', () => this.startTrial());
    document.getElementById('reset-trials').addEventListener('click', () => this.resetTrials());
    document.getElementById('price-low').addEventListener('click', () => this.choosePrice('LOW'));
    document.getElementById('price-med').addEventListener('click', () => this.choosePrice('MED'));
    document.getElementById('price-high').addEventListener('click', () => this.choosePrice('HIGH'));
    document.getElementById('proceed-to-strategy').addEventListener('click', () => this.goToStep('strategy'));

    // Playground actions (now on strategy page)
    document.getElementById('clear-grid').addEventListener('click', () => this.clearGrid());
    document.getElementById('randomize-grid').addEventListener('click', () => this.randomizeGrid());
    document.getElementById('export-csv').addEventListener('click', () => this.exportCSV());

    // Upload actions
    document.getElementById('csv-file-input').addEventListener('change', (e) => this.handleFileUpload(e));
    const uploadArea = document.getElementById('upload-area');
    uploadArea.addEventListener('click', () => document.getElementById('csv-file-input').click());
    uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

    // Strategy navigation
    document.getElementById('back-to-teaching').addEventListener('click', () => this.goToStep('teaching'));
    document.getElementById('proceed-to-simulate').addEventListener('click', () => this.proceedToSimulate());

    // Simulation actions
    document.getElementById('back-to-strategy').addEventListener('click', () => this.goToStep('strategy'));
    document.getElementById('run-simulation').addEventListener('click', () => this.runSimulation());

    // Results actions
    document.getElementById('back-to-simulate').addEventListener('click', () => this.goToStep('simulate'));
    document.getElementById('proceed-to-submit').addEventListener('click', () => this.goToStep('submit'));

    // Submit actions
    document.getElementById('back-to-results').addEventListener('click', () => this.goToStep('results'));
    document.getElementById('submit-strategy').addEventListener('click', () => this.submitStrategy());

    // Error toast
    document.getElementById('error-close').addEventListener('click', () => this.hideError());
  }

  // ============================================
  // TEACHING SIMULATOR LOGIC
  // ============================================

  startTrial() {
    this.teachingState.opportunity = 0;
    this.teachingState.inventory = 7;
    this.teachingState.revenue = 0;
    this.teachingState.priceHistory = [];
    this.teachingState.salesHistory = [];
    this.teachingState.inventoryHistory = [7];
    this.teachingState.isTrialActive = true;

    // Enable price buttons
    document.getElementById('price-low').disabled = false;
    document.getElementById('price-med').disabled = false;
    document.getElementById('price-high').disabled = false;
    document.getElementById('start-trial').disabled = true;

    this.updateTeachingDisplay();
    this.updateTeachingCharts();
    document.getElementById('outcome-message').textContent = 'Choose your first price...';
    document.getElementById('outcome-message').className = 'outcome-message';
  }

  choosePrice(priceLevel) {
    if (!this.teachingState.isTrialActive) return;
    if (this.teachingState.inventory <= 0) {
      this.endTrial();
      return;
    }
    if (this.teachingState.opportunity >= 15) {
      this.endTrial();
      return;
    }

    // Get price and probability
    const prices = { 'LOW': 30000, 'MED': 40000, 'HIGH': 50000 };
    const probabilities = { 'LOW': 0.90, 'MED': 0.80, 'HIGH': 0.40 };
    
    const price = prices[priceLevel];
    const saleProb = probabilities[priceLevel];
    
    // Simulate sale
    const randomValue = Math.random();
    const sold = randomValue < saleProb;
    
    // Record decision
    this.teachingState.priceHistory.push(price);
    this.teachingState.salesHistory.push(sold);
    this.teachingState.opportunity++;
    
    if (sold) {
      this.teachingState.inventory--;
      this.teachingState.revenue += price;
      this.showOutcome(`✅ Sold! Revenue +$${(price/1000).toFixed(0)}K`, 'sale');
    } else {
      this.showOutcome(`❌ No sale this opportunity`, 'no-sale');
    }
    
    this.teachingState.inventoryHistory.push(this.teachingState.inventory);
    this.updateTeachingDisplay();
    this.updateTeachingCharts();
    
    // Check if trial should end
    if (this.teachingState.inventory <= 0 || this.teachingState.opportunity >= 15) {
      setTimeout(() => this.endTrial(), 1000);
    }
  }

  showOutcome(message, type) {
    const outcomeEl = document.getElementById('outcome-message');
    outcomeEl.textContent = message;
    outcomeEl.className = `outcome-message ${type}`;
  }

  endTrial() {
    this.teachingState.isTrialActive = false;
    
    // Disable price buttons
    document.getElementById('price-low').disabled = true;
    document.getElementById('price-med').disabled = true;
    document.getElementById('price-high').disabled = true;
    
    // Record trial result
    this.teachingState.trialResults.push({
      revenue: this.teachingState.revenue,
      salesCount: this.teachingState.salesHistory.filter(s => s).length
    });
    
    // Update average revenue
    const avgRevenue = this.teachingState.trialResults.reduce((sum, t) => sum + t.revenue, 0) / this.teachingState.trialResults.length;
    document.getElementById('avg-revenue').textContent = `Average Revenue: $${Math.round(avgRevenue/1000)}K`;
    
    // Check if more trials
    if (this.teachingState.currentTrial < this.teachingState.maxTrials) {
      this.teachingState.currentTrial++;
      document.getElementById('trial-counter').textContent = `Trial ${this.teachingState.currentTrial} / ${this.teachingState.maxTrials}`;
      document.getElementById('start-trial').disabled = false;
      this.showOutcome(`Trial complete! Revenue: $${Math.round(this.teachingState.revenue/1000)}K`, 'sale');
    } else {
      this.showOutcome(`All trials complete! Final avg: $${Math.round(avgRevenue/1000)}K`, 'sale');
    }
  }

  resetTrials() {
    this.teachingState.currentTrial = 1;
    this.teachingState.opportunity = 0;
    this.teachingState.inventory = 7;
    this.teachingState.revenue = 0;
    this.teachingState.priceHistory = [];
    this.teachingState.salesHistory = [];
    this.teachingState.inventoryHistory = [7];
    this.teachingState.trialResults = [];
    this.teachingState.isTrialActive = false;

    document.getElementById('trial-counter').textContent = `Trial 1 / 3`;
    document.getElementById('avg-revenue').textContent = `Average Revenue: $0`;
    document.getElementById('start-trial').disabled = false;
    document.getElementById('price-low').disabled = true;
    document.getElementById('price-med').disabled = true;
    document.getElementById('price-high').disabled = true;
    document.getElementById('outcome-message').textContent = '';
    document.getElementById('outcome-message').className = 'outcome-message';

    this.updateTeachingDisplay();
    this.updateTeachingCharts();
  }

  updateTeachingDisplay() {
    document.getElementById('status-opportunity').textContent = `${this.teachingState.opportunity} / 15`;
    document.getElementById('status-inventory').textContent = this.teachingState.inventory;
    document.getElementById('status-revenue').textContent = `$${Math.round(this.teachingState.revenue/1000)}K`;
  }

  // ============================================
  // CHART MANAGEMENT
  // ============================================

  initializeCharts() {
    // Inventory chart
    const invCtx = document.getElementById('inventory-chart').getContext('2d');
    this.charts.inventory = new Chart(invCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Inventory Remaining',
          data: [],
          borderColor: 'rgb(227, 81, 17)',
          backgroundColor: 'rgba(227, 81, 17, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 7,
            ticks: { stepSize: 1 }
          }
        }
      }
    });

    // Price history chart
    const priceCtx = document.getElementById('price-history-chart').getContext('2d');
    this.charts.priceHistory = new Chart(priceCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Price Offered',
          data: [],
          borderColor: 'rgb(234, 88, 12)',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          stepped: true,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            min: 25000,
            max: 55000,
            ticks: {
              callback: function(value) {
                return '$' + (value/1000) + 'K';
              }
            }
          }
        }
      }
    });

    // Sales outcomes chart
    const salesCtx = document.getElementById('sales-outcomes-chart').getContext('2d');
    this.charts.salesOutcomes = new Chart(salesCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Sale Occurred',
          data: [],
          backgroundColor: function(context) {
            return context.parsed.y === 1 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return value === 1 ? 'Sold' : 'Not Sold';
              }
            }
          }
        }
      }
    });
  }

  updateTeachingCharts() {
    // Update inventory chart
    const oppLabels = Array.from({length: this.teachingState.inventoryHistory.length}, (_, i) => i);
    this.charts.inventory.data.labels = oppLabels;
    this.charts.inventory.data.datasets[0].data = this.teachingState.inventoryHistory;
    this.charts.inventory.update();

    // Update price history chart
    const priceLabels = Array.from({length: this.teachingState.priceHistory.length}, (_, i) => i + 1);
    this.charts.priceHistory.data.labels = priceLabels;
    this.charts.priceHistory.data.datasets[0].data = this.teachingState.priceHistory;
    this.charts.priceHistory.update();

    // Update sales outcomes chart
    this.charts.salesOutcomes.data.labels = priceLabels;
    this.charts.salesOutcomes.data.datasets[0].data = this.teachingState.salesHistory.map(s => s ? 1 : 0);
    this.charts.salesOutcomes.update();
  }

  // ============================================
  // STRATEGY EDITOR (moved from playground)
  // ============================================

  generatePlaygroundGrid() {
    const grid = document.getElementById('playground-grid');
    if (!grid) {
      console.error('Playground grid element not found');
      return;
    }
    
    grid.innerHTML = '';

    for (let i = 0; i < CONFIG.I; i++) {
      for (let t = 0; t < CONFIG.T; t++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell empty';
        cell.dataset.capacity = i;
        cell.dataset.period = t;
        cell.textContent = 'Click';
        
        cell.addEventListener('click', () => this.cycleCellPrice(cell));
        
        grid.appendChild(cell);
      }
    }
  }

  cycleCellPrice(cell) {
    const currentClass = cell.className;
    let newClass, newText;
    
    if (currentClass.includes('empty')) {
      newClass = 'grid-cell low';
      newText = 'LOW';
    } else if (currentClass.includes('low')) {
      newClass = 'grid-cell med';
      newText = 'MED';
    } else if (currentClass.includes('med')) {
      newClass = 'grid-cell high';
      newText = 'HIGH';
    } else if (currentClass.includes('high')) {
      newClass = 'grid-cell empty';
      newText = 'Click';
    }
    
    cell.className = newClass;
    cell.textContent = newText;
  }

  clearGrid() {
    document.querySelectorAll('.grid-cell').forEach(cell => {
      cell.className = 'grid-cell empty';
      cell.textContent = 'Click';
    });
  }

  randomizeGrid() {
    const priceLevels = ['empty', 'low', 'med', 'high'];
    const priceTexts = ['Click', 'LOW', 'MED', 'HIGH'];
    
    document.querySelectorAll('.grid-cell').forEach(cell => {
      const randomIndex = Math.floor(Math.random() * priceLevels.length);
      cell.className = `grid-cell ${priceLevels[randomIndex]}`;
      cell.textContent = priceTexts[randomIndex];
    });
  }

  exportCSV() {
    const matrix = this.getPlaygroundMatrix();
    const csvContent = CSVProcessor.matrixToCSV(matrix);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canyon-sunset-strategy.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  getPlaygroundMatrix() {
    const matrix = [];
    
    for (let i = 0; i < CONFIG.I; i++) {
      const row = [];
      for (let t = 0; t < CONFIG.T; t++) {
        const cell = document.querySelector(`[data-capacity="${i}"][data-period="${t}"]`);
        let value;
        
        if (cell.classList.contains('low')) {
          value = 'LOW';
        } else if (cell.classList.contains('med')) {
          value = 'MED';
        } else if (cell.classList.contains('high')) {
          value = 'HIGH';
        } else {
          value = 'LOW';
        }
        
        row.push(value);
      }
      matrix.push(row);
    }
    
    return matrix;
  }

  proceedToSimulate() {
    // Convert grid to policy matrix
    const matrix = this.getPlaygroundMatrix();
    const priceMatrix = CSVProcessor.convertToPriceMatrix(matrix);
    this.policyMatrix = priceMatrix;
    this.goToStep('simulate');
  }

  // ============================================
  // FILE UPLOAD
  // ============================================

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.processCSVFile(file);
    } else {
      this.showError('Please select a valid CSV file.');
    }
  }

  handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  }

  handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
  }

  handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
      this.processCSVFile(files[0]);
    } else {
      this.showError('Please drop a valid CSV file.');
    }
  }

  processCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target.result;
        const matrix = CSVProcessor.parseCSV(csvContent);
        const validation = CSVProcessor.validateMatrix(matrix);
        
        if (validation.valid) {
          // Convert to policy matrix
          this.policyMatrix = CSVProcessor.convertToPriceMatrix(matrix);
          
          // Populate the grid editor with the CSV data
          this.populateGridFromMatrix(matrix);
          
          this.showSuccess('CSV loaded successfully! Grid updated.');
        } else {
          const errorMessages = validation.errors.map(err => 
            `Row ${err.row}, Col ${err.col}: ${err.message}`
          ).join('\n');
          this.showError(`CSV Validation Error:\n${errorMessages}`);
        }
      } catch (error) {
        this.showError(`Error processing CSV: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }

  populateGridFromMatrix(matrix) {
    // Populate grid cells with values from matrix
    for (let i = 0; i < CONFIG.I; i++) {
      for (let t = 0; t < CONFIG.T; t++) {
        const cell = document.querySelector(`[data-capacity="${i}"][data-period="${t}"]`);
        if (cell) {
          const value = matrix[i][t].toUpperCase();
          let cellClass, cellText;
          
          if (value === 'LOW' || value === '30' || value === '$30') {
            cellClass = 'grid-cell low';
            cellText = 'LOW';
          } else if (value === 'MED' || value === '40' || value === '$40') {
            cellClass = 'grid-cell med';
            cellText = 'MED';
          } else if (value === 'HIGH' || value === '50' || value === '$50') {
            cellClass = 'grid-cell high';
            cellText = 'HIGH';
          } else {
            cellClass = 'grid-cell empty';
            cellText = 'Click';
          }
          
          cell.className = cellClass;
          cell.textContent = cellText;
        }
      }
    }
  }

  // ============================================
  // STRATEGY PREVIEW
  // ============================================

  displayStrategyPreview() {
    if (!this.policyMatrix) {
      console.warn('No policy matrix to preview');
      return;
    }

    const previewGrid = document.getElementById('strategy-preview-grid');
    if (!previewGrid) return;

    previewGrid.innerHTML = '';

    // Create preview cells
    for (let i = 0; i < CONFIG.I; i++) {
      for (let t = 0; t < CONFIG.T; t++) {
        const cell = document.createElement('div');
        const price = this.policyMatrix.getPrice(i, t);
        
        let priceClass = 'low';
        let priceText = 'L';
        if (price === 40000) {
          priceClass = 'med';
          priceText = 'M';
        } else if (price === 50000) {
          priceClass = 'high';
          priceText = 'H';
        }
        
        cell.className = `strategy-preview-cell ${priceClass}`;
        cell.textContent = priceText;
        previewGrid.appendChild(cell);
      }
    }
  }

  // ============================================
  // SIMULATION (100 trials, no user config)
  // ============================================

  runSimulation() {
    if (!this.policyMatrix) {
      this.showError('No policy matrix available. Please design a strategy first.');
      return;
    }

    const button = document.getElementById('run-simulation');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    button.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    this.philosophy = document.getElementById('philosophy').value;
    
    setTimeout(() => {
      try {
        // Run with 100 trials and default seed
        const engine = new SimulationEngine({ trials: 100, seed: 42 });
        this.simulationResults = engine.runSimulation(this.policyMatrix);
        
        localStorage.setItem('canyon-sunset-results', JSON.stringify({
          results: this.simulationResults,
          philosophy: this.philosophy,
          timestamp: Date.now()
        }));
        
        this.goToStep('results');
      } catch (error) {
        this.showError(`Simulation failed: ${error.message}`);
      } finally {
        button.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    }, 100);
  }

  displayResults() {
    if (!this.simulationResults) {
      this.showError('No simulation results available.');
      return;
    }

    const container = document.getElementById('results-container');
    const aggregates = this.simulationResults.aggregates;
    
    container.innerHTML = `
      <div class="results-grid">
        <div class="result-card">
          <div class="result-value">$${Math.round(aggregates.avgRevenue).toLocaleString()}</div>
          <div class="result-label">Average Revenue</div>
        </div>
        <div class="result-card">
          <div class="result-value">${(aggregates.fillRate * 100).toFixed(1)}%</div>
          <div class="result-label">Fill Rate</div>
        </div>
        <div class="result-card">
          <div class="result-value">$${Math.round(aggregates.avgPrice).toLocaleString()}</div>
          <div class="result-label">Average Price</div>
        </div>
        <div class="result-card">
          <div class="result-value">${(aggregates.lastMinuteShare * 100).toFixed(1)}%</div>
          <div class="result-label">Last-Minute Share</div>
        </div>
        <div class="result-card">
          <div class="result-value">$${Math.round(aggregates.stdRevenue).toLocaleString()}</div>
          <div class="result-label">Revenue Std Dev</div>
        </div>
      </div>
      
      <div class="price-mix-section">
        <h3>Price Mix Distribution</h3>
        <div class="price-mix-grid">
          <div class="price-mix-item">
            <span class="price-label">LOW</span>
            <span class="price-count">${aggregates.priceMix.LOW}</span>
          </div>
          <div class="price-mix-item">
            <span class="price-label">MED</span>
            <span class="price-count">${aggregates.priceMix.MED}</span>
          </div>
          <div class="price-mix-item">
            <span class="price-label">HIGH</span>
            <span class="price-count">${aggregates.priceMix.HIGH}</span>
          </div>
        </div>
      </div>
    `;
    
    // Create Monte Carlo distribution chart
    this.createMonteCarloChart();
    
    const style = document.createElement('style');
    style.textContent = `
      .price-mix-section {
        margin: 1.5rem 0;
        padding: 1rem;
        background: var(--gray-50);
        border-radius: 0.5rem;
      }
      .price-mix-section h3 {
        margin-bottom: 1rem;
        color: var(--gray-900);
      }
      .price-mix-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }
      .price-mix-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: white;
        border-radius: 0.25rem;
        border: 1px solid var(--gray-200);
      }
      .price-label {
        font-weight: 600;
        color: var(--gray-700);
      }
      .price-count {
        font-weight: 700;
        color: var(--canyon-600);
      }
    `;
    document.head.appendChild(style);
  }

  createMonteCarloChart() {
    try {
      // Destroy existing chart if any
      if (this.charts.monteCarlo) {
        this.charts.monteCarlo.destroy();
      }

      // Check if canvas element exists
      const canvas = document.getElementById('monte-carlo-chart');
      if (!canvas) {
        console.error('Monte Carlo chart canvas not found');
        return;
      }

      // Check if policy matrix exists
      if (!this.policyMatrix) {
        console.error('No policy matrix available for chart');
        return;
      }

      // Generate revenue distribution from simulation
      const revenues = [];
      
      // Re-run to get individual trial revenues
      for (let i = 0; i < 100; i++) {
        const rng = new RNG(42 + i);
        let revenue = 0;
        let inventory = 7;
        
        for (let t = 0; t < 15 && inventory > 0; t++) {
          const capacityIdx = inventory - 1;
          const price = this.policyMatrix.getPrice(capacityIdx, t);
          const saleProb = CONFIG.SALE_PROBABILITIES[price] || 0;
          const sold = rng.next() < saleProb;
          
          if (sold) {
            revenue += price;
            inventory--;
          }
        }
        revenues.push(revenue);
      }

      // Create histogram bins
      const minRev = Math.min(...revenues);
      const maxRev = Math.max(...revenues);
      const binCount = 20;
      const binSize = (maxRev - minRev) / binCount;
      const bins = Array(binCount).fill(0);
      const binLabels = [];

      for (let i = 0; i < binCount; i++) {
        binLabels.push(`$${Math.round((minRev + i * binSize) / 1000)}K`);
      }

      revenues.forEach(rev => {
        const binIndex = Math.min(Math.floor((rev - minRev) / binSize), binCount - 1);
        bins[binIndex]++;
      });

      const ctx = canvas.getContext('2d');
      this.charts.monteCarlo = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: binLabels,
          datasets: [{
            label: 'Frequency',
            data: bins,
            backgroundColor: 'rgba(227, 81, 17, 0.7)',
            borderColor: 'rgb(227, 81, 17)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Revenue Distribution across 100 Trials'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Trials'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Revenue'
              }
            }
          }
        }
      });

      console.log('Monte Carlo chart created successfully');
    } catch (error) {
      console.error('Error creating Monte Carlo chart:', error);
    }
  }

  // ============================================
  // SUBMISSION
  // ============================================

  submitStrategy() {
    if (!this.simulationResults) {
      this.showError('No simulation results available to submit.');
      return;
    }

    const studentName = document.getElementById('student-name').value.trim();
    const studentEmail = document.getElementById('student-email').value.trim();

    if (!studentName || !studentEmail) {
      this.showError('Please fill in both student name and email.');
      return;
    }

    const button = document.getElementById('submit-strategy');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    button.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    setTimeout(() => {
      try {
        const submission = {
          simulation_results: this.simulationResults,
          philosophy: this.philosophy,
          student_name: studentName,
          student_email: studentEmail,
          timestamp: Date.now()
        };

        const submissions = JSON.parse(localStorage.getItem('canyon-sunset-submissions') || '[]');
        submissions.push(submission);
        localStorage.setItem('canyon-sunset-submissions', JSON.stringify(submissions));

        this.showSuccess(`Strategy submitted successfully! Submission ID: ${Date.now()}`);
        
        button.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';

      } catch (error) {
        this.showError(`Submission failed: ${error.message}`);
        button.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    }, 1000);
  }

  updateStrategySummary() {
    if (!this.simulationResults) return;

    const summary = document.getElementById('strategy-summary');
    const aggregates = this.simulationResults.aggregates;
    
    summary.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item">
          <strong>Average Revenue:</strong> $${Math.round(aggregates.avgRevenue).toLocaleString()}
        </div>
        <div class="summary-item">
          <strong>Fill Rate:</strong> ${(aggregates.fillRate * 100).toFixed(1)}%
        </div>
        <div class="summary-item">
          <strong>Average Price:</strong> $${Math.round(aggregates.avgPrice).toLocaleString()}
        </div>
      </div>
      <div class="philosophy-preview">
        <strong>Philosophy:</strong> ${this.philosophy || 'No philosophy provided'}
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .summary-item {
        padding: 0.5rem;
        background: var(--gray-50);
        border-radius: 0.25rem;
        font-size: 0.875rem;
      }
      .philosophy-preview {
        padding: 1rem;
        background: var(--canyon-50);
        border-radius: 0.5rem;
        border: 1px solid var(--canyon-200);
        font-size: 0.875rem;
        color: var(--canyon-800);
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // NAVIGATION
  // ============================================

  goToStep(stepName) {
    this.currentStep = stepName;
    this.updateProgressSteps();
    this.showStep(stepName);
  }

  showStep(stepName) {
    document.querySelectorAll('.step-content').forEach(step => {
      step.classList.remove('active');
    });

    const currentStepElement = document.getElementById(`${stepName}-step`);
    if (currentStepElement) {
      currentStepElement.classList.add('active');
    }

    // Handle step-specific initialization
    if (stepName === 'strategy') {
      // Ensure grid is generated when entering strategy page
      setTimeout(() => this.generatePlaygroundGrid(), 0);
    } else if (stepName === 'simulate') {
      // Show strategy preview when entering simulate page
      setTimeout(() => this.displayStrategyPreview(), 0);
    } else if (stepName === 'results' && this.simulationResults) {
      this.displayResults();
    } else if (stepName === 'submit' && this.simulationResults) {
      this.updateStrategySummary();
    }
  }

  updateProgressSteps() {
    const steps = ['teaching', 'strategy', 'simulate', 'results', 'submit'];
    const currentIndex = steps.indexOf(this.currentStep);

    document.querySelectorAll('.step').forEach((step, index) => {
      step.classList.remove('active', 'completed');
      
      if (index === currentIndex) {
        step.classList.add('active');
      } else if (index < currentIndex) {
        step.classList.add('completed');
      }
    });
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  showError(message) {
    const toast = document.getElementById('error-toast');
    const errorMessage = toast.querySelector('.error-message');
    
    errorMessage.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => this.hideError(), 5000);
  }

  showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: var(--success-50);
      border: 1px solid var(--success-500);
      border-radius: 0.5rem;
      padding: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-width: 400px;
      color: var(--success-600);
    `;
    
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.25rem;">✅</span>
        <span style="font-size: 0.875rem;">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.25rem; color: var(--success-500); cursor: pointer; padding: 0; width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center;">×</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  hideError() {
    document.getElementById('error-toast').style.display = 'none';
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CanyonSunsetApp();
});