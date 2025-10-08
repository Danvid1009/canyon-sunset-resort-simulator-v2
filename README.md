# Canyon Sunset Resort Simulator v2.0

A frontend-only interactive playground for dynamic pricing strategy simulation using Monte Carlo methods.

## 🎮 Features

### Interactive Playground
- **7×15 Grid Interface**: Click cells to cycle through pricing levels (LOW → MED → HIGH → LOW)
- **Real-time Strategy Building**: Visual feedback with color-coded pricing levels
- **Quick Actions**: Clear all, randomize, and export to CSV
- **Export Functionality**: Download your strategy as a CSV file

### Simulation Engine
- **Monte Carlo Simulation**: Deterministic results with configurable seed
- **Sale Probabilities**: LOW=90%, MED=80%, HIGH=40%
- **Comprehensive Results**: Revenue, fill rate, price mix analysis
- **Sample Trial Visualization**: See how your strategy performs in detail

### Workflow
1. **🎮 Playground** - Build your pricing strategy interactively
2. **📁 Upload CSV** - Alternative: upload existing strategy files
3. **⚡ Simulate** - Run Monte Carlo simulation with custom parameters
4. **📊 Results** - Analyze performance metrics and statistics
5. **📤 Submit** - Submit strategy for evaluation (stored locally)

## 🚀 Quick Start

1. Open `index.html` in your web browser
2. Click on grid cells to set pricing levels
3. Click "Run Simulation" to test your strategy
4. Review results and submit your final strategy

## 📊 Configuration

### Price Levels
- **LOW**: $30,000 (90% sale probability)
- **MED**: $40,000 (80% sale probability)  
- **HIGH**: $50,000 (40% sale probability)

### Simulation Parameters
- **Capacity Levels**: 7 (fixed)
- **Time Periods**: 15 (fixed)
- **Trials**: 10,000 (configurable)
- **Seed**: 42 (configurable for deterministic results)

## 💾 Data Storage

Results and submissions are stored in browser localStorage:
- `canyon-sunset-results`: Latest simulation results
- `canyon-sunset-submissions`: All submitted strategies

## 🎨 Design

Maintains the original canyon/sunset theme with:
- Warm orange/red gradient backgrounds
- Color-coded pricing levels (green=LOW, orange=MED, red=HIGH)
- Responsive design for mobile and desktop
- Clean, modern interface

## 🔧 Technical Details

### Architecture
- **Pure HTML/CSS/JavaScript**: No build tools or frameworks
- **Client-side Simulation**: Monte Carlo engine runs in browser
- **Deterministic RNG**: Linear Congruential Generator for reproducible results
- **CSV Processing**: Built-in parser and validator

### Browser Compatibility
- Modern browsers with ES6+ support
- LocalStorage for data persistence
- File API for CSV uploads

## 📁 File Structure

```
├── index.html          # Main application
├── styles.css          # Canyon/sunset themed styling
├── simulation.js       # Monte Carlo simulation engine
├── app.js             # Application logic and UI
└── README.md          # This file
```

## 🎯 Usage Tips

1. **Start with Playground**: Build intuition by clicking through different pricing strategies
2. **Use Randomize**: Get inspiration from random configurations
3. **Export/Import**: Save strategies as CSV files for sharing
4. **Philosophy**: Always provide reasoning for your pricing decisions
5. **Multiple Runs**: Try different seeds to understand variability

## 🔮 Future Enhancements

- Leaderboard integration
- Strategy comparison tools
- Advanced analytics and visualizations
- Multi-player competitive mode

---

*Built with ❤️ for dynamic pricing education*