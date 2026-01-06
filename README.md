# Whist Card Game Web App

A mobile-first web application for managing the game logic of a Whist card game variant. Built with React, Vite, and Tailwind CSS.

## Features

- Support for 4-6 players
- Automatic round calculation based on number of players
- Score tracking with automatic calculation
- Color-coded scoreboard showing bid accuracy
- Local storage persistence
- Mobile-optimized UI

## Game Rules Implementation

- **Rounds**: 12 + 3×X rounds (where X = number of players)
- **Round progression**:
  - X rounds of 1 card
  - Rounds of 2, 3, 4, 5, 6, 7 cards
  - X rounds of 8 cards
  - Rounds of 7, 6, 5, 4, 3, 2 cards
  - X rounds of 1 card
- **Scoring**:
  - Correct bid: 5 points + 1 point per trick
  - Wrong bid: -1 point per trick off
  - 5 consecutive correct bids: +5 bonus (excludes 1-card rounds)
  - 5 consecutive wrong bids: -5 penalty (excludes 1-card rounds)
- **Bidding restriction**: Last bidder cannot make the total bids equal the cards dealt

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The server will start and display the local and network URLs. To access from your phone:
- Make sure your phone is on the same Wi-Fi network as your computer
- Look for the "Local" and "Network" URLs in the terminal output
- Use the "Network" URL (e.g., `http://192.168.1.xxx:5173`) on your phone's browser

3. Build for production:
```bash
npm run build
```

## Deployment to GitHub Pages

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to GitHub Pages.

**Important**: Before deploying, update the `base` path in `vite.config.js` to match your repository name.

## Usage

1. **Setup**: Enter player names in counterclockwise order, starting with the first dealer
2. **Gameplay**: Follow the prompts for each round:
   - Dealer information
   - Bidding phase
   - Game playing
   - Trick entry
3. **Scoreboard**: View the complete game history with color-coded results:
   - Green: Correct bid
   - Red: Wrong bid
   - Gold: 5th consecutive correct bid
   - Black: 5th consecutive wrong bid

## Technology Stack

- React 18
- Vite
- Tailwind CSS
- shadcn/ui components
- LocalStorage for state persistence

