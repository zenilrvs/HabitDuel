"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Game, Player, DailyEntry } from "@/lib/types";
import {
  getCurrentWeekAndDay,
  calculateDayScore,
  calculateWeekScore,
  calculateCumulativeScore,
} from "@/lib/game-utils";

interface WeeklyTabProps {
  game: Game;
  players: Player[];
  entries: DailyEntry[];
  currentPlayerId: string;
}

export function WeeklyTab({
  game,
  players,
  entries,
  currentPlayerId,
}: WeeklyTabProps) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const opponent = players.find((p) => p.id !== currentPlayerId);

  const { week: liveWeek } = game.start_date
    ? getCurrentWeekAndDay(game.start_date)
    : { week: 1 };

  const displayWeeks = Math.min(liveWeek, game.total_weeks);

  const getWeekScoreForPlayer = (playerId: string, week: number) =>
    calculateWeekScore(game.habits, entries, playerId, week);

  const getCumulativeForPlayer = (playerId: string) =>
    calculateCumulativeScore(game.habits, entries, playerId, displayWeeks);

  const myTotal = getCumulativeForPlayer(currentPlayerId);
  const opponentTotal = opponent ? getCumulativeForPlayer(opponent.id) : 0;

  return (
    <div className="space-y-4">
      {/* Scoreboard Summary */}
      <Card className="neon-3d-card bg-card/80">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground text-center mb-4">
            Overall Standing
          </p>
          <div className="flex justify-around items-end">
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-2">
                <div className="h-3 w-3 rounded-full bg-yellow-300" />
                <span className="text-sm font-medium">
                  {currentPlayer?.name || "You"}
                </span>
                {myTotal > opponentTotal && opponent && (
                  <span className="text-lg" title="Leading">
                    &#128081;
                  </span>
                )}
              </div>
              <p
                className={`text-3xl font-bold ${myTotal > 0 ? "text-green-600" : myTotal < 0 ? "text-red-600" : ""}`}
              >
                {myTotal}
              </p>
            </div>
            <div className="text-muted-foreground text-xl font-light mb-1">
              vs
            </div>
            {opponent ? (
              <div className="text-center">
                <div className="flex items-center gap-1.5 justify-center mb-2">
                  <div className="h-3 w-3 rounded-full bg-sky-300" />
                  <span className="text-sm font-medium">{opponent.name}</span>
                  {opponentTotal > myTotal && (
                    <span className="text-lg" title="Leading">
                      &#128081;
                    </span>
                  )}
                </div>
                <p
                  className={`text-3xl font-bold ${opponentTotal > 0 ? "text-green-600" : opponentTotal < 0 ? "text-red-600" : ""}`}
                >
                  {opponentTotal}
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Waiting for opponent</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Week-by-week table */}
      <Card className="neon-3d-card bg-card/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Week</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                      <div className="h-2 w-2 rounded-full bg-yellow-300" />
                    {currentPlayer?.name || "You"}
                  </div>
                </TableHead>
                {opponent && (
                  <TableHead className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <div className="h-2 w-2 rounded-full bg-sky-300" />
                      {opponent.name}
                    </div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: displayWeeks }, (_, i) => i + 1).map(
                (week) => {
                  const myWeekScore = getWeekScoreForPlayer(
                    currentPlayerId,
                    week
                  );
                  const oppWeekScore = opponent
                    ? getWeekScoreForPlayer(opponent.id, week)
                    : 0;
                  const isLive =
                    week === liveWeek && liveWeek <= game.total_weeks;
                  const isExpanded = expandedWeek === week;
                  const myWinning = opponent && myWeekScore > oppWeekScore;
                  const oppWinning = opponent && oppWeekScore > myWeekScore;

                  return (
                    <TableRow key={week} className="group">
                      <TableCell
                        colSpan={opponent ? 3 : 2}
                        className="p-0"
                      >
                        {/* Week summary row */}
                        <button
                          className="w-full text-left hover:bg-accent/50 transition-colors"
                          onClick={() =>
                            setExpandedWeek(isExpanded ? null : week)
                          }
                        >
                          <div className="flex items-center px-4 py-3">
                            <div className="w-24 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {isExpanded ? "\u25BC" : "\u25B6"}
                              </span>
                              <span className="font-medium">W{week}</span>
                              {isLive && (
                                <Badge
                                  variant="default"
                                  className="text-[10px] px-1.5 py-0 h-4 animate-pulse"
                                >
                                  Live
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 text-center">
                              <span
                                className={`font-semibold ${myWinning ? "text-green-600" : ""}`}
                              >
                                {myWeekScore}
                                {myWinning && " \u2605"}
                              </span>
                            </div>
                            {opponent && (
                              <div className="flex-1 text-center">
                                <span
                                  className={`font-semibold ${oppWinning ? "text-green-600" : ""}`}
                                >
                                  {oppWeekScore}
                                  {oppWinning && " \u2605"}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Expanded day breakdown */}
                        {isExpanded && (
                          <div className="border-t bg-muted/30 px-4 py-3">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs h-8 w-16">
                                    Day
                                  </TableHead>
                                  <TableHead className="text-xs text-center h-8">
                                    {currentPlayer?.name || "You"}
                                  </TableHead>
                                  {opponent && (
                                    <TableHead className="text-xs text-center h-8">
                                      {opponent.name}
                                    </TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Array.from(
                                  { length: 7 },
                                  (_, d) => d + 1
                                ).map((day) => {
                                  const myDayScore = calculateDayScore(
                                    game.habits,
                                    entries,
                                    currentPlayerId,
                                    week,
                                    day
                                  );
                                  const oppDayScore = opponent
                                    ? calculateDayScore(
                                        game.habits,
                                        entries,
                                        opponent.id,
                                        week,
                                        day
                                      )
                                    : 0;

                                  return (
                                    <TableRow key={day}>
                                      <TableCell className="text-xs py-1.5 w-16">
                                        D{day}
                                      </TableCell>
                                      <TableCell
                                        className={`text-xs text-center py-1.5 ${myDayScore > 0 ? "text-green-600" : myDayScore < 0 ? "text-red-600" : "text-muted-foreground"}`}
                                      >
                                        {myDayScore !== 0 &&
                                          (myDayScore > 0 ? "+" : "")}
                                        {myDayScore}
                                      </TableCell>
                                      {opponent && (
                                        <TableCell
                                          className={`text-xs text-center py-1.5 ${oppDayScore > 0 ? "text-green-600" : oppDayScore < 0 ? "text-red-600" : "text-muted-foreground"}`}
                                        >
                                          {oppDayScore !== 0 &&
                                            (oppDayScore > 0 ? "+" : "")}
                                          {oppDayScore}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  );
                                })}
                                <TableRow className="border-t font-medium">
                                  <TableCell className="text-xs py-1.5">
                                    Total
                                  </TableCell>
                                  <TableCell className="text-xs text-center py-1.5 font-bold">
                                    {myWeekScore}
                                  </TableCell>
                                  {opponent && (
                                    <TableCell className="text-xs text-center py-1.5 font-bold">
                                      {oppWeekScore}
                                    </TableCell>
                                  )}
                                </TableRow>
                              </TableBody>
                            </Table>

                            {/* Per-habit breakdown */}
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Habit breakdown for Week {week}
                              </p>
                              <div className="space-y-1">
                                {game.habits.map((habit) => {
                                  const myHabitCount = Array.from(
                                    { length: 7 },
                                    (_, d) => d + 1
                                  ).filter((day) =>
                                    entries.some(
                                      (e) =>
                                        e.habit_id === habit.id &&
                                        e.player_id === currentPlayerId &&
                                        e.week_number === week &&
                                        e.day_number === day &&
                                        e.completed
                                    )
                                  ).length;

                                  const oppHabitCount = opponent
                                    ? Array.from(
                                        { length: 7 },
                                        (_, d) => d + 1
                                      ).filter((day) =>
                                        entries.some(
                                          (e) =>
                                            e.habit_id === habit.id &&
                                            e.player_id === opponent.id &&
                                            e.week_number === week &&
                                            e.day_number === day &&
                                            e.completed
                                        )
                                      ).length
                                    : 0;

                                  return (
                                    <div
                                      key={habit.id}
                                      className="flex items-center justify-between text-xs py-1"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="truncate max-w-[120px]">
                                          {habit.name}
                                        </span>
                                        <span
                                          className={
                                            habit.type === "good"
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }
                                        >
                                          ({habit.points > 0 ? "+" : ""}
                                          {habit.points})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-yellow-300">
                                          {myHabitCount}/7
                                        </span>
                                        {opponent && (
                                          <span className="text-sky-300">
                                            {oppHabitCount}/7
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }
              )}
              {/* Cumulative total */}
              <TableRow className="border-t-2 font-bold bg-muted/30">
                <TableCell
                  colSpan={opponent ? 3 : 2}
                  className="p-0"
                >
                  <div className="flex items-center px-4 py-3">
                    <div className="w-24">Total</div>
                    <div className="flex-1 text-center">
                      <span
                        className={
                          myTotal > 0
                            ? "text-green-600"
                            : myTotal < 0
                              ? "text-red-600"
                              : ""
                        }
                      >
                        {myTotal}
                        {opponent && myTotal > opponentTotal && " \uD83D\uDC51"}
                      </span>
                    </div>
                    {opponent && (
                      <div className="flex-1 text-center">
                        <span
                          className={
                            opponentTotal > 0
                              ? "text-green-600"
                              : opponentTotal < 0
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {opponentTotal}
                          {opponentTotal > myTotal && " \uD83D\uDC51"}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
