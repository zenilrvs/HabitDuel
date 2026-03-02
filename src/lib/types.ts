export interface Habit {
  id: string;
  name: string;
  points: number;
  type: "good" | "bad";
}

export interface Game {
  id: string;
  game_code: string;
  title: string;
  habits: Habit[];
  total_weeks: number;
  start_date: string | null;
  status: "waiting" | "active" | "completed";
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  is_creator: boolean;
  joined_at: string;
}

export interface DailyEntry {
  id: string;
  game_id: string;
  player_id: string;
  habit_id: string;
  week_number: number;
  day_number: number;
  completed: boolean;
  updated_at: string;
}
