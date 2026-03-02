import { Habit, DailyEntry } from "./types";

export function generateGameCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getCurrentWeekAndDay(startDate: string): {
  week: number;
  day: number;
} {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { week: 1, day: 1 };

  const week = Math.floor(diffDays / 7) + 1;
  const day = (diffDays % 7) + 1;

  return { week, day };
}

export function getDateForDay(
  startDate: string,
  week: number,
  day: number
): Date {
  const start = new Date(startDate + "T00:00:00");
  const offset = (week - 1) * 7 + (day - 1);
  start.setDate(start.getDate() + offset);
  return start;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isGameOver(startDate: string, totalWeeks: number): boolean {
  const { week } = getCurrentWeekAndDay(startDate);
  return week > totalWeeks;
}

export function isDayAccessible(
  startDate: string,
  week: number,
  day: number
): boolean {
  const current = getCurrentWeekAndDay(startDate);
  if (week < current.week) return true;
  if (week === current.week && day <= current.day) return true;
  return false;
}

export function calculateDayScore(
  habits: Habit[],
  entries: DailyEntry[],
  playerId: string,
  week: number,
  day: number
): number {
  return habits.reduce((score, habit) => {
    const entry = entries.find(
      (e) =>
        e.player_id === playerId &&
        e.habit_id === habit.id &&
        e.week_number === week &&
        e.day_number === day
    );
    if (entry?.completed) {
      return score + habit.points;
    }
    return score;
  }, 0);
}

export function calculateWeekScore(
  habits: Habit[],
  entries: DailyEntry[],
  playerId: string,
  week: number
): number {
  let total = 0;
  for (let day = 1; day <= 7; day++) {
    total += calculateDayScore(habits, entries, playerId, week, day);
  }
  return total;
}

export function calculateCumulativeScore(
  habits: Habit[],
  entries: DailyEntry[],
  playerId: string,
  upToWeek: number
): number {
  let total = 0;
  for (let week = 1; week <= upToWeek; week++) {
    total += calculateWeekScore(habits, entries, playerId, week);
  }
  return total;
}
