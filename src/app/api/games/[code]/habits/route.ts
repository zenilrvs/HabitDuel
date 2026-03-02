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
    const { player_id, name, points, type } = body as {
      player_id: string;
      name: string;
      points: number;
      type: "good" | "bad";
    };

    if (!player_id || !name?.trim() || !points || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (Math.abs(points) > 100) {
      return NextResponse.json(
        { error: "Points must be between 1 and 100" },
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

    if (game.status === "completed") {
      return NextResponse.json(
        { error: "Cannot add habits to a completed game" },
        { status: 400 }
      );
    }

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
        { error: "Only the game creator can add new habits" },
        { status: 403 }
      );
    }

    const currentHabits = (game.habits ?? []) as Habit[];
    const trimmedName = name.trim();
    const duplicate = currentHabits.some(
      (habit) => habit.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        { error: "A habit with this name already exists" },
        { status: 400 }
      );
    }

    const normalizedPoints = type === "bad" ? -Math.abs(points) : Math.abs(points);

    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: trimmedName,
      points: normalizedPoints,
      type,
    };

    const updatedHabits = [...currentHabits, newHabit];

    const { error: updateError } = await supabase
      .from("games")
      .update({ habits: updatedHabits })
      .eq("id", game.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ habit: newHabit });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
