-- HabitDuel Database Schema

-- Games table
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_code VARCHAR(6) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL DEFAULT 'Habit Duel',
  habits JSONB NOT NULL,
  total_weeks INTEGER NOT NULL DEFAULT 4 CHECK (total_weeks >= 1 AND total_weeks <= 52),
  start_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  is_creator BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, name)
);

-- Daily entries table
CREATE TABLE daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  habit_id VARCHAR(36) NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id, habit_id, week_number, day_number)
);

-- Indexes
CREATE INDEX idx_games_code ON games(game_code);
CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_entries_game_player ON daily_entries(game_id, player_id);
CREATE INDEX idx_entries_week ON daily_entries(game_id, week_number);
CREATE INDEX idx_entries_lookup ON daily_entries(game_id, player_id, week_number, day_number);

-- Row Level Security (permissive for anon since no auth)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select" ON games FOR SELECT TO anon USING (true);
CREATE POLICY "games_insert" ON games FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "games_update" ON games FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "players_select" ON players FOR SELECT TO anon USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "entries_select" ON daily_entries FOR SELECT TO anon USING (true);
CREATE POLICY "entries_insert" ON daily_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "entries_update" ON daily_entries FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE daily_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
