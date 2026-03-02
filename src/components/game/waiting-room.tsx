"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/lib/types";

interface WaitingRoomProps {
  game: Game;
}

export function WaitingRoom({ game }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const gameUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/game/${game.game_code}`
      : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="neon-3d-card w-full max-w-md bg-card/80 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl tracking-wide">{game.title}</CardTitle>
          <p className="text-muted-foreground">
            Waiting for your opponent to dock into this duel...
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-center">
              Share this link to invite a friend:
            </p>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border border-yellow-400/25 bg-black/35 px-3 py-2 text-sm font-mono truncate">
                {gameUrl || `/game/${game.game_code}`}
              </div>
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-yellow-400/20 bg-black/25 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Game Code</span>
              <Badge variant="secondary" className="font-mono">
                {game.game_code}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>
                {game.total_weeks} {game.total_weeks === 1 ? "week" : "weeks"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Habits</span>
              <span>{game.habits.length} defined</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
