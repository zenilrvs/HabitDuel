import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_VERSION = "v1";

function getPlayerTokenSecret() {
  const secret = process.env.PLAYER_TOKEN_SECRET;
  if (!secret) {
    throw new Error("PLAYER_TOKEN_SECRET is not configured");
  }
  return secret;
}

function encode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function createPlayerToken(playerId: string, gameId: string) {
  const payload = `${TOKEN_VERSION}:${playerId}:${gameId}`;
  const signature = createHmac("sha256", getPlayerTokenSecret())
    .update(payload)
    .digest("base64url");

  return `${encode(payload)}.${signature}`;
}

export function verifyPlayerToken(
  token: string,
  expectedPlayerId: string,
  expectedGameId: string
) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encodedPayload, providedSignature] = parts;

  try {
    const payload = decode(encodedPayload);
    const [version, playerId, gameId] = payload.split(":");
    if (
      version !== TOKEN_VERSION ||
      playerId !== expectedPlayerId ||
      gameId !== expectedGameId
    ) {
      return false;
    }

    const expectedSignature = createHmac("sha256", getPlayerTokenSecret())
      .update(payload)
      .digest("base64url");

    return timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
