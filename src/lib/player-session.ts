interface StoredPlayerSession {
  playerId: string;
  token: string;
}

function sessionKey(gameCode: string) {
  return `habitduel_player_${gameCode.toUpperCase()}`;
}

export function readPlayerSession(gameCode: string): StoredPlayerSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(sessionKey(gameCode));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredPlayerSession>;
    if (typeof parsed.playerId === "string") {
      return { playerId: parsed.playerId, token: parsed.token ?? "" };
    }

    // Legacy fallback where only player id was stored
    if (!raw.startsWith("{")) {
      return {
        playerId: raw,
        token: "",
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function storePlayerSession(
  gameCode: string,
  playerId: string,
  token: string
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      sessionKey(gameCode),
      JSON.stringify({ playerId, token })
    );
  } catch {
    // localStorage not available
  }
}

export function clearPlayerSession(gameCode: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(sessionKey(gameCode));
  } catch {
    // localStorage not available
  }
}
