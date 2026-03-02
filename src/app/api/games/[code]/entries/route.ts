import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Habit } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const {
      player_id,
      habit_id,
      week_number,
      day_number,
      completed,
    } = body as {
      player_id: string;
      habit_id: string;
      week_number: number;
      day_number: number;
      completed: boolean;
    };

    if (!player_id || !habit_id || !week_number || !day_number) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: game } = await supabase
      .from("games")
      .select("id, status, habits")
      .eq("game_code", code.toUpperCase())
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "active") {
      return NextResponse.json(
        { error: "Game is not active" },
        { status: 400 }
      );
    }

    const habits = (game.habits ?? []) as Habit[];
    const habitExists = habits.some((habit) => habit.id === habit_id);
    if (!habitExists) {
      return NextResponse.json({ error: "Habit not found" }, { status: 400 });
    }

    const { data: player } = await supabase
      .from("players")
      .select("id")
      .eq("id", player_id)
      .eq("game_id", game.id)
      .single();

    if (!player) {
      return NextResponse.json(
        { error: "Player not found in this game" },
        { status: 403 }
      );
    }

    const { data: entry, error: entryError } = await supabase
      .from("daily_entries")
      .upsert(
        {
          game_id: game.id,
          player_id,
          habit_id,
          week_number,
          day_number,
          completed,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "game_id,player_id,habit_id,week_number,day_number",
        }
      )
      .select()
      .single();

    if (entryError) {
      return NextResponse.json(
        { error: entryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
