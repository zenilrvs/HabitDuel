import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGameCode } from "@/lib/game-utils";
import { Habit } from "@/lib/types";
import { createPlayerToken } from "@/lib/player-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, habits, total_weeks, creator_name } = body as {
      title?: string;
      habits: Omit<Habit, "id">[];
      total_weeks: number;
      creator_name: string;
    };

    if (!habits || habits.length === 0) {
      return NextResponse.json(
        { error: "At least one habit is required" },
        { status: 400 }
      );
    }

    if (!creator_name?.trim()) {
      return NextResponse.json(
        { error: "Creator name is required" },
        { status: 400 }
      );
    }

    if (!total_weeks || total_weeks < 1 || total_weeks > 52) {
      return NextResponse.json(
        { error: "Weeks must be between 1 and 52" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const habitsWithIds: Habit[] = habits.map((h) => ({
      ...h,
      id: crypto.randomUUID(),
      points: h.type === "bad" ? -Math.abs(h.points) : Math.abs(h.points),
    }));

    let gameCode = "";
    let attempts = 0;
    while (attempts < 5) {
      gameCode = generateGameCode();
      const { data: existing } = await supabase
        .from("games")
        .select("id")
        .eq("game_code", gameCode)
        .single();
      if (!existing) break;
      attempts++;
    }

    if (attempts >= 5) {
      return NextResponse.json(
        { error: "Could not generate unique game code" },
        { status: 500 }
      );
    }

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        game_code: gameCode,
        title: title?.trim() || "Habit Duel",
        habits: habitsWithIds,
        total_weeks,
        status: "waiting",
      })
      .select()
      .single();

    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        game_id: game.id,
        name: creator_name.trim(),
        is_creator: true,
      })
      .select()
      .single();

    if (playerError) {
      return NextResponse.json(
        { error: playerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        game_code: game.game_code,
        game_id: game.id,
        player_id: player.id,
        player_token: createPlayerToken(player.id, game.id),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
