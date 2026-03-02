"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Game, Player, DailyEntry } from "@/lib/types";

interface UseGameReturn {
  game: Game | null;
  players: Player[];
  entries: DailyEntry[];
  isLoading: boolean;
  error: string | null;
  refreshGame: () => Promise<void>;
}

export function useGame(gameCode: string): UseGameReturn {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseRef = useRef(createClient());

  const fetchData = useCallback(async () => {
    const supabase = supabaseRef.current;
    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("game_code", gameCode.toUpperCase())
        .single();

      if (gameError) throw new Error("Game not found");
      setGame(gameData);

      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameData.id)
        .order("is_creator", { ascending: false });

      setPlayers(playersData || []);

      const { data: entriesData } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("game_id", gameData.id);

      setEntries(entriesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setIsLoading(false);
    }
  }, [gameCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!game?.id) return;

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`game-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_entries",
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setEntries((prev) => {
              const exists = prev.some((e) => e.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new as DailyEntry];
            });
          } else if (payload.eventType === "UPDATE") {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === payload.new.id ? (payload.new as DailyEntry) : e
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          setPlayers((prev) => {
            const exists = prev.some((p) => p.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Player];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          setGame(payload.new as Game);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id]);

  return {
    game,
    players,
    entries,
    isLoading,
    error,
    refreshGame: fetchData,
  };
}
