import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { player_id } = body as { player_id: string };

    if (!player_id) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: game } = await supabase
      .from("games")
      .select("id, status")
      .eq("game_code", code.toUpperCase())
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Only the creator can reset
    const { data: player } = await supabase
      .from("players")
      .select("id, is_creator")
      .eq("id", player_id)
      .eq("game_id", game.id)
      .single();

    if (!player) {
      return NextResponse.json(
        { error: "Player not found in this game" },
        { status: 403 }
      );
    }

    if (!player.is_creator) {
      return NextResponse.json(
        { error: "Only the game creator can reset the game" },
        { status: 403 }
      );
    }

    // Delete all daily entries for this game
    const { error: deleteError } = await supabase
      .from("daily_entries")
      .delete()
      .eq("game_id", game.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    // Reset start_date to today and set status back to active
    const today = new Date().toISOString().split("T")[0];
    const { error: updateError } = await supabase
      .from("games")
      .update({ start_date: today, status: "active" })
      .eq("id", game.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
