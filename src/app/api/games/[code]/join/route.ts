import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPlayerToken } from "@/lib/player-token";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { player_name } = body as { player_name: string };

    if (!player_name?.trim()) {
      return NextResponse.json(
        { error: "Player name is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("game_code", code.toUpperCase())
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "waiting") {
      return NextResponse.json(
        { error: "Game is already in progress or completed" },
        { status: 400 }
      );
    }

    const { data: existingPlayers } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", game.id);

    if (existingPlayers && existingPlayers.length >= 2) {
      return NextResponse.json({ error: "Game is full" }, { status: 400 });
    }

    const creatorName = existingPlayers?.[0]?.name?.toLowerCase();
    if (creatorName === player_name.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Name is already taken. Please choose a different name." },
        { status: 400 }
      );
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        game_id: game.id,
        name: player_name.trim(),
        is_creator: false,
      })
      .select()
      .single();

    if (playerError) {
      return NextResponse.json(
        { error: playerError.message },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("games")
      .update({ status: "active", start_date: today })
      .eq("id", game.id);

    return NextResponse.json({
      player_id: player.id,
      game_id: game.id,
      game_code: game.game_code,
      player_token: createPlayerToken(player.id, game.id),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
