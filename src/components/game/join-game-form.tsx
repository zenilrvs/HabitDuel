"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { storePlayerSession } from "@/lib/player-session";

interface JoinGameFormProps {
  gameCode: string;
  gameTitle: string;
  onJoined: (playerId: string, playerToken: string) => void;
}

export function JoinGameForm({
  gameCode,
  gameTitle,
  onJoined,
}: JoinGameFormProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async () => {
    if (!name.trim()) {
      toast.error("Enter your name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/games/${gameCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to join game");
        return;
      }

      if (!data.player_token) {
        toast.error("Could not create secure player session");
        return;
      }

      storePlayerSession(data.game_code, data.player_id, data.player_token);
      onJoined(data.player_id, data.player_token);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="neon-3d-card w-full max-w-sm bg-card/80 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl tracking-wide">Join Game</CardTitle>
          <p className="text-muted-foreground">{gameTitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player-name">Your Name</Label>
            <Input
              id="player-name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) handleJoin();
              }}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? "Joining..." : "Join Game"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
