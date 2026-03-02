"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/lib/types";

interface SelectPlayerViewProps {
  gameTitle: string;
  players: Player[];
  onSelectPlayer: (playerId: string) => void;
}

export function SelectPlayerView({
  gameTitle,
  players,
  onSelectPlayer,
}: SelectPlayerViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="neon-3d-card w-full max-w-md bg-card/80 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl tracking-wide">Choose Player View</CardTitle>
          <p className="text-muted-foreground">{gameTitle}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Which player are you using this device as?
          </p>
          {players.map((player) => (
            <Button
              key={player.id}
              className="w-full"
              variant="outline"
              onClick={() => onSelectPlayer(player.id)}
            >
              {player.name}
              {player.is_creator ? " (Creator)" : ""}
            </Button>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
