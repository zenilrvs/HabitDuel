import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("game_code", code.toUpperCase())
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const { data: players } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", game.id)
      .order("is_creator", { ascending: false });

    const { data: entries } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("game_id", game.id);

    return NextResponse.json({
      game,
      players: players ?? [],
      entries: entries ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
