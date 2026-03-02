"use client";

import { useCallback, useReducer, useSyncExternalStore } from "react";
import {
  clearPlayerSession,
  readPlayerSession,
  storePlayerSession,
} from "@/lib/player-session";

function subscribeHydration() {
  return () => {};
}

export function usePlayer(gameCode: string) {
  const [, rerender] = useReducer((c: number) => c + 1, 0);
  const isPlayerReady = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  );

  const stored = isPlayerReady ? readPlayerSession(gameCode) : null;
  const playerId = stored?.playerId ?? null;
  const playerToken = stored?.token || null;

  const setPlayer = useCallback(
    (playerId: string, playerToken: string) => {
      storePlayerSession(gameCode, playerId, playerToken);
      rerender();
    },
    [gameCode]
  );

  const clearPlayer = useCallback(() => {
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
