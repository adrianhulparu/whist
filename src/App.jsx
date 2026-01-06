import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerSetup } from "@/components/PlayerSetup"
import { GameAction } from "@/components/GameAction"
import { Scoreboard } from "@/components/Scoreboard"
import { saveGameState, loadGameState, clearGameState } from "@/lib/storage"
import {
  getCardsForRound,
  calculateTotalRounds,
  calculateScore,
  updateConsecutive,
  getFirstBidder,
} from "@/lib/gameLogic"
import { Button } from "@/components/ui/button"

function App() {
  const [gameState, setGameState] = useState(null)

  useEffect(() => {
    const saved = loadGameState()
    if (saved) {
      setGameState(saved)
    }
  }, [])

      const handleStartGame = (playerNames) => {
    const numPlayers = playerNames.length
    const totalRounds = calculateTotalRounds(numPlayers)

    const newGameState = {
      players: playerNames,
      currentRound: 0,
      phase: "dealer",
      bids: [],
      tricks: [],
      currentTrickPlayerIndex: 0,
      rounds: Array(totalRounds).fill(null).map(() => ({
        completed: false,
        bids: [],
        tricks: [],
        scores: [],
        bonusApplied: [],
      })),
    }

    setGameState(newGameState)
    saveGameState(newGameState)
  }

  const updateGameState = (updater) => {
    setGameState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      saveGameState(next)
      return next
    })
  }

  const handleNextStep = (newPhase) => {
    updateGameState((prev) => ({
      ...prev,
      phase: newPhase,
    }))
  }

  const handleBid = (bid) => {
    updateGameState((prev) => {
      const newBids = [...prev.bids, bid]
      const allBidsComplete = newBids.length === prev.players.length

      if (allBidsComplete) {
        // Update round with bids
        const updatedRounds = [...prev.rounds]
        const firstBidder = getFirstBidder(prev.currentRound, prev.players.length)
        updatedRounds[prev.currentRound] = {
          ...updatedRounds[prev.currentRound],
          bids: [...newBids],
          trickOrder: Array.from({ length: prev.players.length }, (_, i) => 
            (firstBidder + i) % prev.players.length
          ),
        }

        return {
          ...prev,
          bids: [],
          tricks: [],
          currentTrickPlayerIndex: 0,
          phase: "playing",
          rounds: updatedRounds,
        }
      }

      return {
        ...prev,
        bids: newBids,
      }
    })
  }

  const handleTricks = (trick) => {
    updateGameState((prev) => {
      const round = prev.rounds[prev.currentRound]
      const trickOrder = round.trickOrder || []
      const currentTrickIndex = prev.currentTrickPlayerIndex ?? 0
      
      // Build tricks array in player order (not trick order)
      let newTricks = [...prev.tricks]
      if (newTricks.length <= currentTrickIndex) {
        // Initialize tricks array if needed
        newTricks = Array(prev.players.length).fill(null)
        // Fill in all previous tricks
        for (let i = 0; i < currentTrickIndex; i++) {
          const playerIndex = trickOrder[i]
          if (prev.tricks[i] !== null && prev.tricks[i] !== undefined) {
            newTricks[playerIndex] = prev.tricks[i]
          }
        }
      }
      
      const playerIndex = trickOrder[currentTrickIndex]
      newTricks[playerIndex] = trick
      
      const cardsDealt = getCardsForRound(prev.currentRound, prev.players.length)
      const totalTricksSoFar = newTricks.filter(t => t !== null && t !== undefined).reduce((sum, t) => sum + t, 0)
      const remainingCount = trickOrder.length - currentTrickIndex - 1
      
      // Auto-fill last player if we're on second-to-last and can calculate
      if (remainingCount === 1 && currentTrickIndex === trickOrder.length - 2) {
        const lastPlayerIndex = trickOrder[trickOrder.length - 1]
        const lastPlayerTrick = Math.max(0, cardsDealt - totalTricksSoFar)
        newTricks[lastPlayerIndex] = lastPlayerTrick
      }
      // If total tricks equals cards dealt, auto-fill remaining players with 0
      else if (totalTricksSoFar === cardsDealt && remainingCount > 0) {
        for (let i = currentTrickIndex + 1; i < trickOrder.length; i++) {
          const remainingPlayerIndex = trickOrder[i]
          newTricks[remainingPlayerIndex] = 0
        }
      }

      const allTricksComplete = currentTrickIndex >= trickOrder.length - 1 || newTricks.filter(t => t !== null && t !== undefined).length === prev.players.length

      if (allTricksComplete) {
        // Calculate scores
        const roundIndex = prev.currentRound
        const cardsDealt = getCardsForRound(roundIndex, prev.players.length)
        const firstBidder = getFirstBidder(roundIndex, prev.players.length)
        const round = prev.rounds[roundIndex]

        // Calculate consecutive states for each player (excluding 1-card rounds)
        // Reset after bonus/penalty is applied
        const consecutiveStates = prev.players.map((_, playerIndex) => {
          let state = { correct: 0, wrong: 0 }
          for (let i = 0; i < roundIndex; i++) {
            const prevRound = prev.rounds[i]
            if (prevRound && prevRound.completed) {
              const prevCardsDealt = getCardsForRound(i, prev.players.length)
              const prevFirstBidder = getFirstBidder(i, prev.players.length)
              const prevPlayerBidIndex = prevRound.bids.findIndex(
                (_, idx) => (prevFirstBidder + idx) % prev.players.length === playerIndex
              )
              
              if (prevPlayerBidIndex !== -1) {
                const prevBid = prevRound.bids[prevPlayerBidIndex]
                const prevTricks = prevRound.tricks[playerIndex]
                const prevBonusApplied = prevRound.bonusApplied?.[playerIndex] ?? false
                
                // Skip 1-card rounds for consecutive tracking (they reset the count)
                if (prevCardsDealt === 1) {
                  state = { correct: 0, wrong: 0 }
                } else {
                  // Update consecutive count, resetting if bonus was applied
                  state = updateConsecutive(prevBid, prevTricks, state, prevBonusApplied)
                }
              }
            }
          }
          return state
        })

        // Calculate scores for each player
        const scores = []
        const bonusApplied = []
        prev.players.forEach((_, playerIndex) => {
          const playerBidIndex = round.bids.findIndex(
            (_, i) => (firstBidder + i) % prev.players.length === playerIndex
          )
          const bid = round.bids[playerBidIndex]
          const tricks = newTricks[playerIndex]
          const consecutive = consecutiveStates[playerIndex]

          // Check if this would be the 5th consecutive
          // If it's a 1-card round, don't apply bonus and reset count
          if (cardsDealt === 1) {
            // 1-card rounds don't count for bonus/penalty, so use empty consecutive state
            const result = calculateScore(bid, tricks, { correct: 0, wrong: 0 })
            scores.push(result.score)
            bonusApplied.push(false) // No bonus applied on 1-card rounds
          } else {
            // Regular round - apply bonus if at 5th consecutive
            const result = calculateScore(bid, tricks, consecutive)
            scores.push(result.score)
            bonusApplied.push(result.bonusApplied)
          }
        })

        const updatedRounds = [...prev.rounds]
        updatedRounds[roundIndex] = {
          ...updatedRounds[roundIndex],
          tricks: [...newTricks],
          scores: [...scores],
          bonusApplied: [...bonusApplied],
          completed: true,
        }

        const nextRound = roundIndex + 1
        const totalRounds = calculateTotalRounds(prev.players.length)
        const isGameComplete = nextRound >= totalRounds

        return {
          ...prev,
          tricks: [],
          currentTrickPlayerIndex: 0,
          bids: [],
          currentRound: isGameComplete ? roundIndex : nextRound,
          phase: isGameComplete ? "complete" : "dealer",
          rounds: updatedRounds,
        }
      }

      return {
        ...prev,
        tricks: newTricks,
        currentTrickPlayerIndex: currentTrickIndex + 1,
      }
    })
  }

  const handleEditRound = (roundIndex, playerIndex, newBid, newTricks) => {
    updateGameState((prev) => {
      const updatedRounds = [...prev.rounds]
      const round = updatedRounds[roundIndex]
      if (!round || !round.completed) return prev

      const firstBidder = getFirstBidder(roundIndex, prev.players.length)
      const playerBidIndex = round.bids.findIndex(
        (_, i) => (firstBidder + i) % prev.players.length === playerIndex
      )

      if (playerBidIndex === -1) return prev

      // Update bid and tricks
      const newBids = [...round.bids]
      newBids[playerBidIndex] = newBid

      const newTricksArray = [...round.tricks]
      newTricksArray[playerIndex] = newTricks

      const cardsDealt = getCardsForRound(roundIndex, prev.players.length)

      // Recalculate consecutive states for each player
      const consecutiveStates = prev.players.map((_, pIndex) => {
        let state = { correct: 0, wrong: 0 }
        for (let i = 0; i < roundIndex; i++) {
          const prevRound = updatedRounds[i]
          if (prevRound && prevRound.completed) {
            const prevCardsDealt = getCardsForRound(i, prev.players.length)
            const prevFirstBidder = getFirstBidder(i, prev.players.length)
            const prevPlayerBidIndex = prevRound.bids.findIndex(
              (_, idx) => (prevFirstBidder + idx) % prev.players.length === pIndex
            )

            if (prevPlayerBidIndex !== -1) {
              const prevBid = prevRound.bids[prevPlayerBidIndex]
              const prevTricks = prevRound.tricks[pIndex]
              const prevBonusApplied = prevRound.bonusApplied?.[pIndex] ?? false

              if (prevCardsDealt === 1) {
                state = { correct: 0, wrong: 0 }
              } else {
                state = updateConsecutive(prevBid, prevTricks, state, prevBonusApplied)
              }
            }
          }
        }
        return state
      })

      // Recalculate scores for all players in this round
      const scores = []
      const bonusApplied = []
      prev.players.forEach((_, pIndex) => {
        const pBidIndex = newBids.findIndex(
          (_, i) => (firstBidder + i) % prev.players.length === pIndex
        )
        const bid = newBids[pBidIndex]
        const tricks = newTricksArray[pIndex]
        const consecutive = consecutiveStates[pIndex]

        if (cardsDealt === 1) {
          const result = calculateScore(bid, tricks, { correct: 0, wrong: 0 })
          scores.push(result.score)
          bonusApplied.push(false)
        } else {
          const result = calculateScore(bid, tricks, consecutive)
          scores.push(result.score)
          bonusApplied.push(result.bonusApplied)
        }
      })

      updatedRounds[roundIndex] = {
        ...round,
        bids: newBids,
        tricks: newTricksArray,
        scores: [...scores],
        bonusApplied: [...bonusApplied],
      }

      // Recalculate all subsequent rounds
      for (let i = roundIndex + 1; i < updatedRounds.length; i++) {
        const subsequentRound = updatedRounds[i]
        if (subsequentRound && subsequentRound.completed) {
          const subCardsDealt = getCardsForRound(i, prev.players.length)
          const subFirstBidder = getFirstBidder(i, prev.players.length)

          const subConsecutiveStates = prev.players.map((_, pIndex) => {
            let state = { correct: 0, wrong: 0 }
            for (let j = 0; j < i; j++) {
              const prevRound = updatedRounds[j]
              if (prevRound && prevRound.completed) {
                const prevCardsDealt = getCardsForRound(j, prev.players.length)
                const prevFirstBidder = getFirstBidder(j, prev.players.length)
                const prevPlayerBidIndex = prevRound.bids.findIndex(
                  (_, idx) => (prevFirstBidder + idx) % prev.players.length === pIndex
                )

                if (prevPlayerBidIndex !== -1) {
                  const prevBid = prevRound.bids[prevPlayerBidIndex]
                  const prevTricks = prevRound.tricks[pIndex]
                  const prevBonusApplied = prevRound.bonusApplied?.[pIndex] ?? false

                  if (prevCardsDealt === 1) {
                    state = { correct: 0, wrong: 0 }
                  } else {
                    state = updateConsecutive(prevBid, prevTricks, state, prevBonusApplied)
                  }
                }
              }
            }
            return state
          })

          const subScores = []
          const subBonusApplied = []
          prev.players.forEach((_, pIndex) => {
            const pBidIndex = subsequentRound.bids.findIndex(
              (_, bidIdx) => (subFirstBidder + bidIdx) % prev.players.length === pIndex
            )
            const bid = subsequentRound.bids[pBidIndex]
            const tricks = subsequentRound.tricks[pIndex]
            const consecutive = subConsecutiveStates[pIndex]

            if (subCardsDealt === 1) {
              const result = calculateScore(bid, tricks, { correct: 0, wrong: 0 })
              subScores.push(result.score)
              subBonusApplied.push(false)
            } else {
              const result = calculateScore(bid, tricks, consecutive)
              subScores.push(result.score)
              subBonusApplied.push(result.bonusApplied)
            }
          })

          updatedRounds[i] = {
            ...subsequentRound,
            scores: [...subScores],
            bonusApplied: [...subBonusApplied],
          }
        }
      }

      return {
        ...prev,
        rounds: updatedRounds,
      }
    })
  }

  const handleReplayRound = () => {
    if (confirm("Are you sure you want to replay this round? This will reset all bids and tricks for this round.")) {
      updateGameState((prev) => {
        const roundIndex = prev.currentRound
        const updatedRounds = [...prev.rounds]
        
        // Reset the round data
        updatedRounds[roundIndex] = {
          completed: false,
          bids: [],
          tricks: [],
          scores: [],
          bonusApplied: [],
        }

        return {
          ...prev,
          bids: [],
          tricks: [],
          currentTrickPlayerIndex: 0,
          phase: "dealer",
          rounds: updatedRounds,
        }
      })
    }
  }

  const handleNewGame = () => {
    if (confirm("Are you sure you want to start a new game? This will clear all progress.")) {
      clearGameState()
      setGameState(null)
    }
  }

  if (!gameState) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <PlayerSetup onStartGame={handleStartGame} />
        </div>
      </div>
    )
  }

  if (gameState.phase === "complete") {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Game Complete!</h1>
            <Scoreboard gameState={gameState} onEditRound={handleEditRound} />
            <Button onClick={handleNewGame} className="mt-4">New Game</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen p-4 flex flex-col overflow-x-hidden w-full" style={{ maxWidth: '100vw', boxSizing: 'border-box' }}>
      <div className="w-full flex-1 flex flex-col min-h-0" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold">Whist v2</h1>
          <Button variant="outline" onClick={handleNewGame} size="sm">
            Joc nou
          </Button>
        </div>

        <Tabs defaultValue="action" className="w-full max-w-full flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full max-w-full grid-cols-2 mb-4 flex-shrink-0">
            <TabsTrigger value="action">Instructiuni</TabsTrigger>
            <TabsTrigger value="scoreboard">Scor</TabsTrigger>
          </TabsList>
          <TabsContent value="action" className="mt-0 flex-1 min-h-0 overflow-auto w-full max-w-full">
            <GameAction
              gameState={gameState}
              onNextStep={handleNextStep}
              onBid={handleBid}
              onTricks={handleTricks}
              onReplayRound={handleReplayRound}
            />
          </TabsContent>
          <TabsContent value="scoreboard" className="mt-0 flex-1 min-h-0 w-full max-w-full">
            <Scoreboard gameState={gameState} onEditRound={handleEditRound} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App

