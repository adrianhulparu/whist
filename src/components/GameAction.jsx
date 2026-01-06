import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getCardsForRound, getDealerForRound, getFirstBidder, validateLastBid } from "@/lib/gameLogic"
import { cn } from "@/lib/utils"

export function GameAction({ gameState, onNextStep, onBid, onTricks, onReplayRound, onSelectPlayer }) {
  const { players, currentRound, bids, tricks, phase } = gameState
  const cardsDealt = getCardsForRound(currentRound, players.length)
  const dealerIndex = getDealerForRound(currentRound, players.length)
  const firstBidder = getFirstBidder(currentRound, players.length)

  if (phase === "dealer") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Runda {currentRound + 1} / {gameState.rounds?.length ?? "?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xl font-normal">
              <span className="text-xl font-bold text-primary">{players[dealerIndex]}</span> imparte cate <span className="font-bold text-primary">{cardsDealt === 1 ? 'o carte' : `${cardsDealt} carti`}</span>
            </p>
          </div>
          <Button onClick={() => onNextStep("bidding")} className="w-full" size="lg">
            INCEPE LICITATIA
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === "bidding") {
    const currentBidderIndex = (firstBidder + bids.length) % players.length
    const isLastBidder = bids.length === players.length - 1
    const totalBids = bids.reduce((sum, bid) => sum + bid, 0)

    return (
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2 mt-4">
            <Label>Maini licitate</Label>
            <div className="grid grid-cols-2 gap-2">
              {bids.map((bid, index) => {
                const bidderIndex = (firstBidder + index) % players.length
                return (
                  <div key={index} className="text-sm">
                    {players[bidderIndex]}: <span className="font-semibold">{bid}</span>
                  </div>
                )
              })}
            </div>
            </div>
            <div className="text-3xl font-bold text-primary">{players[currentBidderIndex]}</div> 
           {isLastBidder && (
             <Card className="bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500">
               <CardContent className="p-4">
                 <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100 text-center">
                   Nu ai voie <span className="text-2xl">{cardsDealt - totalBids}</span>
                 </div>
               </CardContent>
             </Card>
           )}
            <BidInput
            player={players[currentBidderIndex]}
            maxBid={cardsDealt}
            isLastBidder={isLastBidder}
            totalBids={totalBids}
            cardsDealt={cardsDealt}
            onBid={(bid) => {
              if (isLastBidder) {
                if (validateLastBid(totalBids, bid, cardsDealt)) {
                  onBid(bid)
                } else {
                  alert(`Invalid bid! Your bid (${bid}) + total bids (${totalBids}) cannot equal ${cardsDealt}`)
                }
              } else {
                onBid(bid)
              }
            }}
          />
        </CardContent>
      </Card>
    )
  }

  if (phase === "playing") {
    const round = gameState.rounds[currentRound]
    const roundBids = round.bids || []
    const totalBids = roundBids.reduce((sum, bid) => sum + bid, 0)
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>{players[firstBidder]} da prima carte</CardTitle>
          <CardDescription>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                S-au {totalBids > cardsDealt ? 'supra' : 'sub'}licitat <span className="font-semibold">{Math.abs(totalBids - cardsDealt)}</span> din <span className="font-semibold">{cardsDealt} maini date</span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Maini licitate:</Label>
            <div className="grid grid-cols-2 gap-2">
              {roundBids.map((bid, index) => {
                const bidderIndex = (firstBidder + index) % players.length
                return (
                  <div key={index} className="text-sm">
                    {players[bidderIndex]}: <span className="font-semibold">{bid}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onNextStep("tricks")} className="flex-1" size="lg">
              Calculeaza
            </Button>
            <Button 
              onClick={() => onReplayRound && onReplayRound()} 
              variant="outline" 
              className="flex-1" 
              size="lg"
            >
              Rejoaca runda
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (phase === "tricks") {
    const round = gameState.rounds[currentRound]
    const trickOrder = round.trickOrder || []
    const currentTrickIndex = gameState.currentTrickPlayerIndex ?? 0
    const currentPlayerIndex = trickOrder[currentTrickIndex] ?? currentTrickIndex
    const isLastPlayer = currentTrickIndex === trickOrder.length - 1
    
    // Calculate total tricks bid
    const totalBids = round.bids ? round.bids.reduce((sum, bid) => sum + bid, 0) : 0
    
    // Build display of all players with their bids and tricks (if entered)
    // If trickOrder is empty, fallback to player order
    const playerOrder = trickOrder.length > 0 ? trickOrder : players.map((_, i) => i)
    
    // Find which players have entered tricks
    const playersWithTricks = new Set()
    if (tricks && Array.isArray(tricks)) {
      tricks.forEach((trick, idx) => {
        if (trick !== null && trick !== undefined) {
          playersWithTricks.add(idx)
        }
      })
    }
    
    // Find the default next player (first in trickOrder without tricks)
    let defaultNextPlayerIndex = null
    for (let i = 0; i < playerOrder.length; i++) {
      const playerIdx = playerOrder[i]
      if (!playersWithTricks.has(playerIdx)) {
        defaultNextPlayerIndex = playerIdx
        break
      }
    }
    
    // Use selected player or default to the next player in order
    const selectedPlayerIndex = gameState.selectedPlayerIndex !== undefined 
      ? gameState.selectedPlayerIndex 
      : defaultNextPlayerIndex
    
    const allPlayersData = playerOrder.map((playerIdx, bidIndex) => ({
      player: players[playerIdx],
      playerIndex: playerIdx,
      bid: round.bids && round.bids[bidIndex] !== undefined ? round.bids[bidIndex] : null,
      tricks: tricks && tricks[playerIdx] !== undefined ? tricks[playerIdx] : null,
      isCurrent: playerIdx === selectedPlayerIndex,
      isEntered: playersWithTricks.has(playerIdx)
    }))

    return (
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 mt-4">
              {allPlayersData.map((entry, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "text-sm p-2 rounded cursor-pointer transition-colors",
                    entry.isCurrent && "bg-primary/10 border-2 border-primary",
                    !entry.isEntered && !entry.isCurrent && "hover:bg-muted",
                    entry.isEntered && "opacity-75"
                  )}
                  onClick={() => {
                    if (!entry.isEntered && onSelectPlayer) {
                      onSelectPlayer(entry.playerIndex)
                    }
                  }}
                >
                  <div className="font-semibold">{entry.player}</div>
                  <div>
                    licitate: <span className="font-semibold">{entry.bid ?? "-"}</span>
                    {entry.isEntered && (
                      <> / luate: <span className="font-semibold">{entry.tricks}</span></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
            {selectedPlayerIndex !== null && (
              <>
                <div className="space-y-2 text-3xl font-bold text-primary">{players[selectedPlayerIndex]}</div>
                <TrickInput
                  player={players[selectedPlayerIndex]}
                  maxTricks={cardsDealt}
                  cardsDealt={cardsDealt}
                  enteredTricks={allPlayersData.filter(e => e.isEntered).map(e => e.tricks).filter(t => t !== null)}
                  isLastPlayer={allPlayersData.filter(e => !e.isEntered).length === 1}
                  onTrick={(trick) => onTricks(trick, selectedPlayerIndex)}
                />
              </>
            )}
        </CardContent>
      </Card>
    )
  }

  return null
}

function BidInput({ player, maxBid, isLastBidder, totalBids, cardsDealt, onBid }) {
  const [selectedBid, setSelectedBid] = useState(null)

  const handleSubmit = () => {
    if (selectedBid === null) return

    if (isLastBidder) {
      if (validateLastBid(totalBids, selectedBid, cardsDealt)) {
        onBid(selectedBid)
        setSelectedBid(null)
      } else {
        alert(`Invalid bid! Your bid (${selectedBid}) + total bids (${totalBids}) cannot equal ${cardsDealt}`)
      }
    } else {
      onBid(selectedBid)
      setSelectedBid(null)
    }
  }

  // Filter out invalid bids for last bidder instead of disabling them
  const availableBids = Array.from({ length: maxBid + 1 }, (_, i) => i).filter((bidValue) => {
    if (!isLastBidder) return true
    return validateLastBid(totalBids, bidValue, cardsDealt)
  });

  

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {availableBids.map((bidValue) => {
          const selected = selectedBid === bidValue

          return (
            <Button
              key={bidValue}
              type="button"
              variant={selected ? "default" : "outline"}
              onClick={() => setSelectedBid(bidValue)}
              className={cn(
                "h-12 text-lg font-semibold",
                selected && "ring-2 ring-ring ring-offset-2"
              )}
            >
              {bidValue}
            </Button>
          )
        })}
      </div>
      {selectedBid !== null && (
        <Button onClick={handleSubmit} className="w-full" size="lg">
          Confirm
        </Button>
      )}
    </div>
  )
}

function TrickInput({ player, maxTricks, cardsDealt, enteredTricks, isLastPlayer, onTrick }) {
  const [selectedTrick, setSelectedTrick] = useState(null)
  const totalEntered = enteredTricks.reduce((sum, t) => sum + t, 0)
  const remainingTricks = Math.max(0, cardsDealt - totalEntered)
  const maxAvailableTricks = Math.min(maxTricks, remainingTricks)
  const autoFillValue = isLastPlayer ? Math.max(0, cardsDealt - totalEntered) : null

  const handleSubmit = () => {
    if (selectedTrick !== null) {
      onTrick(selectedTrick)
      setSelectedTrick(null)
    } else if (isLastPlayer && autoFillValue !== null && autoFillValue >= 0 && autoFillValue <= maxTricks) {
      // Auto-submit if it's the last player and value can be calculated
      onTrick(autoFillValue)
    }
  }

  // Auto-select if it's the last player
  useEffect(() => {
    if (isLastPlayer && autoFillValue !== null && autoFillValue >= 0 && autoFillValue <= maxTricks) {
      setSelectedTrick(autoFillValue)
    }
  }, [isLastPlayer, autoFillValue, maxTricks])

  return (
    <div className="space-y-3">
      {/* <Label>Maini luate (0 to {maxTricks}):</Label> */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: maxAvailableTricks + 1 }, (_, i) => i).map((trickValue) => {
          const selected = selectedTrick === trickValue

          return (
            <Button
              key={trickValue}
              type="button"
              variant={selected ? "default" : "outline"}
              onClick={() => setSelectedTrick(trickValue)}
              className={cn(
                "h-12 text-lg font-semibold",
                selected && "ring-2 ring-ring ring-offset-2"
              )}
            >
              {trickValue}
            </Button>
          )
        })}
      </div>
      {selectedTrick !== null && (
        <Button onClick={handleSubmit} className="w-full" size="lg">
          Confirm
        </Button>
      )}
    </div>
  )
}


