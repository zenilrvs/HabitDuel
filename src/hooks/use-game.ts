"use client";

import { useState, useEffect, useCallback } from "react";
import { Game, Player, DailyEntry } from "@/lib/types";

interface UseGameReturn {
  game: Game | null;
  players: Player[];
  entries: DailyEntry[];
  isLoading: boolean;
  error: string | null;
  refreshGame: () => Promise<void>;
}

interface GameStateResponse {
  game: Game;
  players: Player[];
  entries: DailyEntry[];
}

export function useGame(gameCode: string): UseGameReturn {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameCode}/state`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || "Failed to load game");
      }

      const data = (await response.json()) as GameStateResponse;
      setGame(data.game);
      setPlayers(data.players);
      setEntries(data.entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setIsLoading(false);
    }
  }, [gameCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll server state to keep devices in sync even when realtime sockets fail.
  useEffect(() => {
    const id = window.setInterval(() => {
      fetchData();
    }, 5000);

    return () => {
      window.clearInterval(id);
    };
  }, [fetchData]);

  return {
    game,
    players,
    entries,
    isLoading,
    error,
    refreshGame: fetchData,
  };
}
