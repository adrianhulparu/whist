import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PlayerSetup({ onStartGame }) {
  const [players, setPlayers] = useState(["", "", "", ""])
  const [numPlayers, setNumPlayers] = useState(4)

  const handleNumPlayersChange = (newNum) => {
    if (newNum >= 4 && newNum <= 6) {
      setNumPlayers(newNum)
      const newPlayers = [...players]
      if (newNum > players.length) {
        while (newPlayers.length < newNum) {
          newPlayers.push("")
        }
      } else {
        newPlayers.splice(newNum)
      }
      setPlayers(newPlayers)
    }
  }

  const handlePlayerNameChange = (index, value) => {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
  }

  const handleStart = () => {
    if (players.every((name) => name.trim() !== "")) {
      onStartGame(players.map((name) => name.trim()))
    }
  }

  const canStart = players.slice(0, numPlayers).every((name) => name.trim() !== "") && numPlayers >= 4

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardDescription>
          Adauga numele jucatorilor in ordine contrar acelor ceasornicului, incepand cu primul care imparte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Numar de jucatori</Label>
          <div className="flex gap-2">
            {[4, 5, 6].map((num) => (
              <Button
                key={num}
                variant={numPlayers === num ? "default" : "outline"}
                onClick={() => handleNumPlayersChange(num)}
                className="flex-1"
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {players.slice(0, numPlayers).map((player, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`player-${index}`}>Jucator {index + 1}</Label>
              <Input
                id={`player-${index}`}
                value={player}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                placeholder={`Numele jucatorului ${index + 1}`}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleStart} disabled={!canStart} className="w-full" size="lg">
          Incepe jocul
        </Button>
      </CardContent>
    </Card>
  )
}

