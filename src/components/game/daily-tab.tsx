"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Game, Player, DailyEntry } from "@/lib/types";
import {
  getCurrentWeekAndDay,
  getDateForDay,
  formatDate,
  isDayAccessible,
  calculateDayScore,
} from "@/lib/game-utils";

interface DailyTabProps {
  game: Game;
  players: Player[];
  entries: DailyEntry[];
  currentPlayerId: string;
  gameCode: string;
}

export function DailyTab({
  game,
  players,
  entries,
  currentPlayerId,
  gameCode,
}: DailyTabProps) {
  const { week: currentWeek, day: currentDay } = game.start_date
    ? getCurrentWeekAndDay(game.start_date)
    : { week: 1, day: 1 };

  const effectiveWeek = Math.min(currentWeek, game.total_weeks);
  const effectiveDay = currentWeek > game.total_weeks ? 7 : currentDay;

  const [selectedWeek, setSelectedWeek] = useState(effectiveWeek);
  const [selectedDay, setSelectedDay] = useState(effectiveDay);
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [optimisticStates, setOptimisticStates] = useState<Record<string, boolean>>(
    {}
  );

  const opponent = players.find((p) => p.id !== currentPlayerId);

  const getHabitKey = useCallback(
    (habitId: string, playerId: string) =>
      `${habitId}:${playerId}:${selectedWeek}:${selectedDay}`,
    [selectedWeek, selectedDay]
  );

  const isEntryCompleted = useCallback(
    (habitId: string, playerId: string) => {
      const optimisticKey = getHabitKey(habitId, playerId);
      if (optimisticKey in optimisticStates) {
        return optimisticStates[optimisticKey];
      }

      return entries.some(
        (e) =>
          e.habit_id === habitId &&
          e.player_id === playerId &&
          e.week_number === selectedWeek &&
          e.day_number === selectedDay &&
          e.completed
      );
    },
    [entries, getHabitKey, optimisticStates, selectedWeek, selectedDay]
  );

  const updateHabitCompletion = async (habitId: string, nextCompleted: boolean) => {
    const toggleKey = `${habitId}-${selectedWeek}-${selectedDay}`;
    if (pendingToggles.has(toggleKey)) return;

    const optimisticKey = getHabitKey(habitId, currentPlayerId);
    const previousValue = isEntryCompleted(habitId, currentPlayerId);

    setPendingToggles((prev) => new Set(prev).add(toggleKey));
    setOptimisticStates((prev) => ({ ...prev, [optimisticKey]: nextCompleted }));

    try {
      const res = await fetch(`/api/games/${gameCode}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: currentPlayerId,
          habit_id: habitId,
          week_number: selectedWeek,
          day_number: selectedDay,
          completed: nextCompleted,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setOptimisticStates((prev) => ({ ...prev, [optimisticKey]: previousValue }));
        toast.error(data.error || "Failed to update");
      }
    } catch {
      setOptimisticStates((prev) => ({ ...prev, [optimisticKey]: previousValue }));
      toast.error("Failed to update. Check your connection.");
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(toggleKey);
        return next;
      });
    }
  };

  const canAccessDay = game.start_date
    ? isDayAccessible(game.start_date, selectedWeek, selectedDay)
    : false;

  const myScore = calculateDayScore(
    game.habits,
    entries,
    currentPlayerId,
    selectedWeek,
    selectedDay
  );

  const opponentScore = opponent
    ? calculateDayScore(
        game.habits,
        entries,
        opponent.id,
        selectedWeek,
        selectedDay
      )
    : 0;

  const displayDate = game.start_date
    ? formatDate(getDateForDay(game.start_date, selectedWeek, selectedDay))
    : "";

  const canGoPrevDay = selectedWeek > 1 || selectedDay > 1;
  const canGoNextDay = game.start_date
    ? isDayAccessible(
        game.start_date,
        selectedDay === 7 ? selectedWeek + 1 : selectedWeek,
        selectedDay === 7 ? 1 : selectedDay + 1
      ) && (selectedDay < 7 || selectedWeek < game.total_weeks)
    : false;

  const goToPrevDay = () => {
    if (selectedDay > 1) {
      setSelectedDay(selectedDay - 1);
    } else if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
      setSelectedDay(7);
    }
  };

  const goToNextDay = () => {
    if (selectedDay < 7) {
      setSelectedDay(selectedDay + 1);
    } else if (selectedWeek < game.total_weeks) {
      setSelectedWeek(selectedWeek + 1);
      setSelectedDay(1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevDay}
            disabled={!canGoPrevDay}
          >
            &larr;
          </Button>
          <div className="text-center">
            <p className="font-semibold">
              Week {selectedWeek} &middot; Day {selectedDay}
            </p>
            <p className="text-sm text-muted-foreground">{displayDate}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextDay}
            disabled={!canGoNextDay}
          >
            &rarr;
          </Button>
        </div>

        <div className="flex justify-center gap-1">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
            const accessible = game.start_date
              ? isDayAccessible(game.start_date, selectedWeek, d)
              : false;
            const isSelected = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => accessible && setSelectedDay(d)}
                disabled={!accessible}
                className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.8)]"
                    : accessible
                      ? "bg-muted hover:bg-accent"
                      : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                D{d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {game.habits.map((habit) => {
          const myCompleted = isEntryCompleted(habit.id, currentPlayerId);
          const opponentCompleted = opponent
            ? isEntryCompleted(habit.id, opponent.id)
            : false;
          const isGood = habit.type === "good";
          const toggleKey = `${habit.id}-${selectedWeek}-${selectedDay}`;
          const isPending = pendingToggles.has(toggleKey);

          return (
            <Card
              key={habit.id}
              className="neon-3d-card bg-card/75 backdrop-blur-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{habit.name}</p>
                      <Badge
                        variant="outline"
                        className={
                          isGood
                            ? "text-green-300 border-green-500/45 bg-green-500/12 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
                            : "text-red-300 border-red-500/45 bg-red-500/12 shadow-[0_0_12px_rgba(239,68,68,0.22)]"
                        }
                      >
                        {habit.points > 0 ? "+" : ""}
                        {habit.points}
                      </Badge>
                    </div>
                    {opponent && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-sky-300 mr-1" />
                        {opponent.name}: {opponentCompleted ? "Yes" : "No"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={!canAccessDay || isPending}
                      className={`${myCompleted ? "!bg-green-600 !border-green-300 !text-white shadow-[0_0_16px_rgba(34,197,94,0.55)]" : "!bg-green-600/20 !border-green-500/40 !text-white/75 hover:!bg-green-600/30"}`}
                      onClick={() => updateHabitCompletion(habit.id, true)}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={!canAccessDay || isPending}
                      className={`${!myCompleted ? "!bg-red-600 !border-red-300 !text-white shadow-[0_0_16px_rgba(239,68,68,0.55)]" : "!bg-red-600/20 !border-red-500/40 !text-white/75 hover:!bg-red-600/30"}`}
                      onClick={() => updateHabitCompletion(habit.id, false)}
                    >
                      No
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="neon-3d-card bg-muted/40">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-muted-foreground text-center mb-3">
            Day {selectedDay} Score
          </p>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <span className="text-xs text-muted-foreground">You</span>
              </div>
              <p
                className={`text-2xl font-bold ${myScore > 0 ? "text-green-300" : myScore < 0 ? "text-red-300" : ""}`}
              >
                {myScore > 0 ? "+" : ""}
                {myScore}
              </p>
            </div>
            {opponent && (
              <div className="text-center">
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                  <span className="text-xs text-muted-foreground">
                    {opponent.name}
                  </span>
                </div>
                <p
                  className={`text-2xl font-bold ${opponentScore > 0 ? "text-green-300" : opponentScore < 0 ? "text-red-300" : ""}`}
                >
                  {opponentScore > 0 ? "+" : ""}
                  {opponentScore}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
