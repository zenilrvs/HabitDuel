"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Game, Player, DailyEntry } from "@/lib/types";
import { getCurrentWeekAndDay } from "@/lib/game-utils";
import { DailyTab } from "./daily-tab";
import { WeeklyTab } from "./weekly-tab";

interface GameBoardProps {
  game: Game;
  players: Player[];
  entries: DailyEntry[];
  currentPlayerId: string;
  gameCode: string;
  refreshGame: () => Promise<void>;
}

export function GameBoard({
  game,
  players,
  entries,
  currentPlayerId,
  gameCode,
  refreshGame,
}: GameBoardProps) {
  const [activeTab, setActiveTab] = useState("daily");
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitPoints, setNewHabitPoints] = useState("5");
  const [newHabitType, setNewHabitType] = useState<"good" | "bad">("good");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const opponent = players.find((p) => p.id !== currentPlayerId);

  const { week: currentWeek } = game.start_date
    ? getCurrentWeekAndDay(game.start_date)
    : { week: 1 };

  const isOver = currentWeek > game.total_weeks;
  const canAddHabit = Boolean(currentPlayer?.is_creator);

  const handleAddHabit = async () => {
    if (!canAddHabit) {
      toast.error("Only the creator can add habits.");
      return;
    }

    if (!newHabitName.trim()) {
      toast.error("Enter a habit name");
      return;
    }

    const parsedPoints = parseInt(newHabitPoints, 10);
    if (!parsedPoints || parsedPoints < 1 || parsedPoints > 100) {
      toast.error("Points must be between 1 and 100");
      return;
    }

    setIsAddingHabit(true);
    try {
      const res = await fetch(`/api/games/${gameCode}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: currentPlayerId,
          name: newHabitName.trim(),
          points: parsedPoints,
          type: newHabitType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add habit");
        return;
      }

      toast.success("Habit added for both players");
      setNewHabitName("");
      setNewHabitPoints("5");
      setNewHabitType("good");
      setHabitDialogOpen(false);
      await refreshGame();
    } catch {
      toast.error("Failed to add habit. Check your connection.");
    } finally {
      setIsAddingHabit(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`/api/games/${gameCode}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: currentPlayerId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to reset game");
        return;
      }

      toast.success("Game reset! Starting fresh from Week 1.");
      setResetDialogOpen(false);
      await refreshGame();
    } catch {
      toast.error("Failed to reset. Check your connection.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-screen pb-8">
      <div className="border-b border-yellow-400/25 bg-card/60 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-wide">{game.title}</h1>
              <p className="text-sm text-muted-foreground">
                {isOver
                  ? "Competition Complete!"
                  : `Week ${Math.min(currentWeek, game.total_weeks)} of ${game.total_weeks}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isOver ? "secondary" : "default"}
                className="text-xs shadow-[0_0_16px_hsl(var(--primary)/0.45)]"
              >
                {isOver ? "Finished" : "Live"}
              </Badge>
              {currentPlayer?.is_creator && (
                <>
                  <Dialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={!canAddHabit}>
                        + Add Habit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-yellow-400/30 bg-card/95">
                      <DialogHeader>
                        <DialogTitle>Add Habit Mid-Game</DialogTitle>
                        <DialogDescription>
                          This habit is immediately added for both players and can
                          be tracked from today onward.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="new-habit-name">Habit name</Label>
                          <Input
                            id="new-habit-name"
                            placeholder="e.g. Meditate"
                            value={newHabitName}
                            onChange={(e) => setNewHabitName(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="new-habit-points">Points</Label>
                            <Input
                              id="new-habit-points"
                              type="number"
                              min="1"
                              max="100"
                              value={newHabitPoints}
                              onChange={(e) => setNewHabitPoints(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={newHabitType}
                              onValueChange={(value) =>
                                setNewHabitType(value as "good" | "bad")
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="bad">Bad</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleAddHabit}
                          disabled={isAddingHabit || !newHabitName.trim()}
                        >
                          {isAddingHabit ? "Adding..." : "Add Habit"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                        Reset
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-yellow-400/30 bg-card/95">
                      <DialogHeader>
                        <DialogTitle>Reset Game</DialogTitle>
                        <DialogDescription>
                          This will clear all entries for both players and restart from Week 1 today. Your habits and points will stay the same.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => setResetDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleReset}
                          disabled={isResetting}
                        >
                          {isResetting ? "Resetting..." : "Yes, Reset Game"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-300 shadow-[0_0_10px_#fde047]" />
              <span className="text-sm font-medium">
                {currentPlayer?.name || "You"}
              </span>
            </div>
            {opponent && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-sky-300 shadow-[0_0_10px_#7dd3fc]" />
                <span className="text-sm font-medium">{opponent.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="daily" className="flex-1">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1">
              Weekly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4">
            <DailyTab
              game={game}
              players={players}
              entries={entries}
              currentPlayerId={currentPlayerId}
              gameCode={gameCode}
            />
          </TabsContent>

          <TabsContent value="weekly" className="mt-4">
            <WeeklyTab
              game={game}
              players={players}
              entries={entries}
              currentPlayerId={currentPlayerId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
