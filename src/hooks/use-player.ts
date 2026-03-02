"use client";

import { useCallback, useReducer, useState, useSyncExternalStore } from "react";
import {
  clearPlayerSession,
  readPlayerSession,
  storePlayerSession,
} from "@/lib/player-session";

interface InMemorySession {
  gameCode: string;
  playerId: string;
  playerToken: string;
}

function subscribeHydration() {
  return () => {};
}

export function usePlayer(gameCode: string) {
  const [, rerender] = useReducer((c: number) => c + 1, 0);
  const [inMemorySession, setInMemorySession] = useState<InMemorySession | null>(
    null
  );
  const isPlayerReady = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  );

  const stored = isPlayerReady ? readPlayerSession(gameCode) : null;
  const activeInMemory =
    inMemorySession?.gameCode === gameCode ? inMemorySession : null;
  const playerId = activeInMemory?.playerId ?? stored?.playerId ?? null;
  const playerToken = activeInMemory?.playerToken ?? stored?.token ?? null;

  const setPlayer = useCallback(
    (playerId: string, playerToken: string) => {
      setInMemorySession({ gameCode, playerId, playerToken });
      storePlayerSession(gameCode, playerId, playerToken);
      rerender();
    },
    [gameCode]
  );

  const clearPlayer = useCallback(() => {
    setInMemorySession((prev) => (prev?.gameCode === gameCode ? null : prev));
    clearPlayerSession(gameCode);
    rerender();
  }, [gameCode]);

  return {
    playerId,
    playerToken,
    isPlayerReady,
    setPlayer,
    clearPlayer,
  };
}
