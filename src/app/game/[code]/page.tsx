"use client";

import { use } from "react";
import Link from "next/link";
import { useGame } from "@/hooks/use-game";
import { usePlayer } from "@/hooks/use-player";
import { GameBoard } from "@/components/game/game-board";
import { JoinGameForm } from "@/components/game/join-game-form";
import { WaitingRoom } from "@/components/game/waiting-room";
import { SelectPlayerView } from "@/components/game/select-player-view";

export default function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const gameCode = code.toUpperCase();

  const { game, players, entries, isLoading, error, refreshGame } =
    useGame(gameCode);
  const { playerId, isPlayerReady, setPlayer } = usePlayer(gameCode);

  if (isLoading || !isPlayerReady) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">
            Loading game...
          </p>
        </div>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Game not found</p>
          <p className="text-muted-foreground">
            The game code &quot;{gameCode}&quot; doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const isPlayerInGame = players.some((p) => p.id === playerId);
  if (!isPlayerInGame && game.status === "waiting") {
    return (
      <JoinGameForm
        gameCode={gameCode}
        gameTitle={game.title}
        onJoined={(id, token) => {
          setPlayer(id, token);
          refreshGame();
        }}
      />
    );
  }

  if (game.status === "waiting") {
    return <WaitingRoom game={game} />;
  }

  if (playerId && isPlayerInGame) {
    return (
      <GameBoard
        game={game}
        players={players}
        entries={entries}
        currentPlayerId={playerId}
        gameCode={gameCode}
        refreshGame={refreshGame}
      />
    );
  }

  if (players.length > 0) {
    return (
      <SelectPlayerView
        gameTitle={game.title}
        players={players}
        onSelectPlayer={(id) => {
          setPlayer(id, "");
        }}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-2xl font-bold">{game.title}</p>
        <p className="text-muted-foreground">
          This game is already in progress. You can&apos;t join anymore.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Create Your Own Game
        </Link>
      </div>
    </main>
  );
}
