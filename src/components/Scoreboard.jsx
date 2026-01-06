import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { getCardsForRound, getFirstBidder } from "@/lib/gameLogic"
import { cn } from "@/lib/utils"

export function Scoreboard({ gameState, onEditRound }) {
  const { players, rounds, currentRound, bids, phase, gameMode } = gameState
  const [compact, setCompact] = useState(false)
  const [editModal, setEditModal] = useState(null)

  const handleLongPress = (roundIndex, playerIndex, bid, tricks) => {
    if (!rounds[roundIndex]?.completed || !onEditRound) return
    const cardsDealt = getCardsForRound(roundIndex, players.length, gameMode || "classic")
    setEditModal({
      roundIndex,
      playerIndex,
      playerName: players[playerIndex],
      cardsDealt,
      bid: bid ?? 0,
      tricks: tricks ?? 0,
    })
  }

  const handleSave = () => {
    if (!editModal || !onEditRound) return
    onEditRound(
      editModal.roundIndex,
      editModal.playerIndex,
      editModal.bid,
      editModal.tricks
    )
    setEditModal(null)
  }

  const checkRoundValidation = (roundIndex) => {
    const round = rounds[roundIndex]
    if (!round || !round.completed) return false

    const cardsDealt = getCardsForRound(roundIndex, players.length, gameMode || "classic")
    const totalBids = round.bids?.reduce((sum, bid) => sum + bid, 0) ?? 0
    const totalTricks = round.tricks?.reduce((sum, trick) => sum + (trick ?? 0), 0) ?? 0

    return totalBids === cardsDealt || totalTricks !== cardsDealt
  }

  const getCellClassName = (roundIndex, playerIndex) => {
    const round = rounds[roundIndex]
    if (!round || !round.completed) return ""

    const firstBidder = getFirstBidder(roundIndex, players.length)
    const playerBidIndex = round.bids.findIndex((_, i) => (firstBidder + i) % players.length === playerIndex)
    
    if (playerBidIndex === -1) return ""

    const bid = round.bids[playerBidIndex]
    const tricks = round.tricks[playerIndex]
    const isCorrect = bid === tricks
    const bonusApplied = round.bonusApplied?.[playerIndex] ?? false
    const cardsDealt = getCardsForRound(roundIndex, players.length, gameMode || "classic")
    const isOneCardRound = cardsDealt === 1
    // In alternative mode, 1-card rounds can have bonuses. In classic mode, they cannot.
    const canHaveBonus = !isOneCardRound || gameMode === "alternative"

    // Check if this round had bonus/penalty applied (5th consecutive)
    if (bonusApplied && canHaveBonus) {
      if (isCorrect) {
        return "bg-yellow-500 text-white font-bold"
      } else {
        return "bg-black text-white font-bold"
      }
    }

    // Otherwise, use standard coloring
    if (isCorrect) {
      return "bg-green-500 text-white"
    } else {
      return "bg-red-500 text-white"
    }
  }

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Scoreboard</CardTitle>
            <CardDescription>Round {currentRound + 1} of {rounds.length}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompact(!compact)}
          >
            {compact ? "Normal" : "Compact"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden w-full max-w-full">
        <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 w-full max-w-full">
          <table className={cn("w-full border-collapse", compact ? "text-xs" : "text-sm")} style={{ tableLayout: 'auto' }}>
            <thead className="sticky top-0 bg-background z-20">
              <tr className="border-b">
                <th className={cn("text-left font-semibold sticky left-0 bg-background z-30", compact ? "p-1" : "p-2")} style={{ width: '60px' }}>
                  #
                </th>
                {players.map((player, index) => (
                  <th key={index} className={cn("text-center font-semibold bg-background", compact ? "p-1" : "p-2")}>
                    {player}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rounds.map((round, roundIndex) => {
                const cardsDealt = getCardsForRound(roundIndex, players.length, gameMode || "classic")
                const firstBidder = getFirstBidder(roundIndex, players.length)

                const hasWarning = checkRoundValidation(roundIndex)

                return (
                  <tr key={roundIndex} className={cn("border-b", roundIndex === currentRound && "bg-muted/50")}>
                    <td className={cn(
                      "font-semibold sticky left-0 bg-background z-10",
                      compact ? "p-1" : "p-2",
                      hasWarning && "bg-yellow-500 text-white"
                    )}>
                      {cardsDealt}
                    </td>
                    {players.map((player, playerIndex) => {
                      // Check if this is the current round with bids in progress
                      const isCurrentRound = roundIndex === currentRound
                      const currentRoundBids = isCurrentRound && phase === "bidding" ? bids : null
                      const currentRoundFirstBidder = isCurrentRound ? getFirstBidder(currentRound, players.length) : null
                      
                      // Get bid from either completed round or current round in progress
                      let playerBidIndex = -1
                      let bid = null
                      
                      if (round.completed && round.bids) {
                        playerBidIndex = round.bids.findIndex(
                          (_, i) => (firstBidder + i) % players.length === playerIndex
                        )
                        if (playerBidIndex !== -1) {
                          bid = round.bids[playerBidIndex]
                        }
                      } else if (currentRoundBids && currentRoundFirstBidder !== null) {
                        playerBidIndex = currentRoundBids.findIndex(
                          (_, i) => (currentRoundFirstBidder + i) % players.length === playerIndex
                        )
                        if (playerBidIndex !== -1) {
                          bid = currentRoundBids[playerBidIndex]
                        }
                      }

                      const tricks = round.tricks?.[playerIndex] ?? null
                      
                      // Calculate cumulative score up to this round
                      const cumulativeScore = rounds.slice(0, roundIndex + 1).reduce((sum, r) => {
                        return sum + (r.scores?.[playerIndex] ?? 0)
                      }, 0)

                      // Show bid if available, otherwise show dash
                      if (bid === null && tricks === null) {
                        return (
                          <td key={playerIndex} className={cn("text-center", compact ? "p-1" : "p-2")}>
                            -
                          </td>
                        )
                      }

                      const cellBgClass = round.completed ? getCellClassName(roundIndex, playerIndex) : ""
                      const hasBgColor = cellBgClass.includes("bg-")

                      return (
                        <td
                          key={playerIndex}
                          className={cn(
                            "text-center border-l select-none",
                            compact ? "p-1" : "p-2",
                            cellBgClass
                          )}
                          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                          onTouchStart={(e) => {
                            if (!round.completed || !onEditRound) return
                            e.preventDefault()
                            const touch = e.touches[0]
                            const startTime = Date.now()
                            const startX = touch.clientX
                            const startY = touch.clientY

                            const handleTouchEnd = () => {
                              const duration = Date.now() - startTime
                              if (duration >= 500) {
                                // Long press detected
                                e.preventDefault()
                                handleLongPress(roundIndex, playerIndex, bid, tricks)
                              }
                              document.removeEventListener("touchend", handleTouchEnd)
                              document.removeEventListener("touchmove", handleTouchMove)
                            }

                            const handleTouchMove = (moveEvent) => {
                              const touch = moveEvent.touches[0]
                              const deltaX = Math.abs(touch.clientX - startX)
                              const deltaY = Math.abs(touch.clientY - startY)
                              // If moved more than 10px, cancel long press
                              if (deltaX > 10 || deltaY > 10) {
                                document.removeEventListener("touchend", handleTouchEnd)
                                document.removeEventListener("touchmove", handleTouchMove)
                              }
                            }

                            document.addEventListener("touchend", handleTouchEnd, { once: true })
                            document.addEventListener("touchmove", handleTouchMove, { once: true })
                          }}
                          onMouseDown={(e) => {
                            if (!round.completed || !onEditRound) return
                            e.preventDefault()
                            const startTime = Date.now()

                            const startX = e.clientX
                            const startY = e.clientY

                            const handleMouseMove = (moveEvent) => {
                              const deltaX = Math.abs(moveEvent.clientX - startX)
                              const deltaY = Math.abs(moveEvent.clientY - startY)
                              // If moved more than 5px, cancel long press
                              if (deltaX > 5 || deltaY > 5) {
                                document.removeEventListener("mouseup", handleMouseUpCheck)
                                document.removeEventListener("mousemove", handleMouseMove)
                              }
                            }

                            const handleMouseUpCheck = () => {
                              const duration = Date.now() - startTime
                              if (duration >= 500) {
                                handleLongPress(roundIndex, playerIndex, bid, tricks)
                              }
                              document.removeEventListener("mouseup", handleMouseUpCheck)
                              document.removeEventListener("mousemove", handleMouseMove)
                            }

                            document.addEventListener("mouseup", handleMouseUpCheck, { once: true })
                            document.addEventListener("mousemove", handleMouseMove, { once: true })
                          }}
                          onContextMenu={(e) => {
                            // Prevent context menu on long press
                            if (!round.completed || !onEditRound) return
                            e.preventDefault()
                          }}
                          onSelectStart={(e) => {
                            if (!round.completed || !onEditRound) return
                            e.preventDefault()
                          }}
                        >
                          <div className={cn("flex flex-col", compact && "gap-0")}>
                            <div className={compact ? "text-xs" : "text-xs"}>
                              {bid !== null ? bid : "-"} / {tricks !== null ? tricks : "-"}
                            </div>
                            {round.completed && (
                              <div className={cn(
                                "font-semibold",
                                compact ? "text-xs" : "text-xs",
                                hasBgColor ? "text-white" : (cumulativeScore >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")
                              )}>
                                {cumulativeScore}
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className={cn("sticky left-0 bg-background z-10", compact ? "p-1" : "p-2")}>
                  Total
                </td>
                {players.map((player, playerIndex) => {
                  const totalScore = rounds.reduce((sum, round) => {
                    return sum + (round.scores?.[playerIndex] ?? 0)
                  }, 0)
                  return (
                    <td key={playerIndex} className={cn("text-center", compact ? "p-1" : "p-2")}>
                      <span className={cn(
                        compact ? "text-xs" : "text-sm",
                        totalScore >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                      )}>
                        {totalScore}
                      </span>
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>

      {editModal && (
        <EditRoundModal
          modal={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleSave}
          onUpdate={(updates) => setEditModal({ ...editModal, ...updates })}
        />
      )}
    </Card>
  )
}

function EditRoundModal({ modal, onClose, onSave, onUpdate }) {
  const { playerName, cardsDealt, bid, tricks } = modal

  const adjustBid = (delta) => {
    const newBid = Math.max(0, Math.min(cardsDealt, bid + delta))
    onUpdate({ bid: newBid })
  }

  const adjustTricks = (delta) => {
    const newTricks = Math.max(0, Math.min(cardsDealt, tricks + delta))
    onUpdate({ tricks: newTricks })
  }

  return (
    <Dialog open={!!modal} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica scor</DialogTitle>
          <DialogDescription>
            Modifica scor pentru {playerName} (runda cu {cardsDealt === 1 ? "o carte" : `${cardsDealt} carti`})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Licitate:</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBid(-1)}
                disabled={bid <= 0}
              >
                -
              </Button>
              <div className="flex-1 text-center text-2xl font-bold min-w-[60px]">
                {bid}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBid(1)}
                disabled={bid >= cardsDealt}
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Luate:</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustTricks(-1)}
                disabled={tricks <= 0}
              >
                -
              </Button>
              <div className="flex-1 text-center text-2xl font-bold min-w-[60px]">
                {tricks}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustTricks(1)}
                disabled={tricks >= cardsDealt}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuleaza
          </Button>
          <Button onClick={onSave}>
            Salveaza
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

