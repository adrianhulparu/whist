/**
 * Calculate the total number of rounds based on number of players
 */
export function calculateTotalRounds(numPlayers) {
  return 12 + 3 * numPlayers;
}

/**
 * Calculate how many cards should be dealt in a given round
 */
export function getCardsForRound(roundIndex, numPlayers) {
  const totalRounds = calculateTotalRounds(numPlayers);
  
  // First X rounds: 1 card each
  if (roundIndex < numPlayers) {
    return 1;
  }
  
  // Next 6 rounds: 2, 3, 4, 5, 6, 7
  if (roundIndex < numPlayers + 6) {
    return roundIndex - numPlayers + 2;
  }
  
  // Next X rounds: 8 cards each
  if (roundIndex < numPlayers + 6 + numPlayers) {
    return 8;
  }
  
  // Next 6 rounds: 7, 6, 5, 4, 3, 2
  if (roundIndex < numPlayers + 6 + numPlayers + 6) {
    const position = roundIndex - (numPlayers + 6 + numPlayers);
    return 7 - position;
  }
  
  // Last X rounds: 1 card each
  return 1;
}

/**
 * Get the dealer index for a given round (0-based)
 */
export function getDealerForRound(roundIndex, numPlayers) {
  return roundIndex % numPlayers;
}

/**
 * Get the index of the first player to bid (dealer's right)
 */
export function getFirstBidder(roundIndex, numPlayers) {
  const dealer = getDealerForRound(roundIndex, numPlayers);
  return (dealer + 1) % numPlayers;
}

/**
 * Calculate score for a round
 * Returns { score, bonusApplied } where bonusApplied indicates if 5 consecutive bonus/penalty was applied
 */
export function calculateScore(bid, tricks, previousConsecutive) {
  const diff = Math.abs(bid - tricks);
  let baseScore = 0;
  
  if (diff === 0) {
    // Correct bid: 5 points + 1 point per trick
    baseScore = 5 + tricks;
  } else {
    // Wrong bid: -1 point per trick off
    baseScore = -diff;
  }
  
  // Check for 5 consecutive bonuses/penalties
  let bonus = 0;
  let bonusApplied = false;
  if (previousConsecutive.correct >= 4 && diff === 0) {
    // 5th correct in a row
    bonus = 5;
    bonusApplied = true;
  } else if (previousConsecutive.wrong >= 4 && diff !== 0) {
    // 5th wrong in a row
    bonus = -5;
    bonusApplied = true;
  }
  
  return { score: baseScore + bonus, bonusApplied };
}

/**
 * Update consecutive tracking
 * If bonusApplied is true, resets the count to 0 (bonus was applied, start fresh)
 */
export function updateConsecutive(bid, tricks, previousConsecutive, bonusApplied = false) {
  // If bonus was applied, reset the count
  if (bonusApplied) {
    return { correct: 0, wrong: 0 };
  }
  
  const diff = Math.abs(bid - tricks);
  const isCorrect = diff === 0;
  
  if (isCorrect) {
    return {
      correct: previousConsecutive.correct + 1,
      wrong: 0
    };
  } else {
    return {
      correct: 0,
      wrong: previousConsecutive.wrong + 1
    };
  }
}

/**
 * Validate last bidder's bid
 */
export function validateLastBid(totalBids, lastBid, cardsPerPlayer) {
  return totalBids + lastBid !== cardsPerPlayer;
}

