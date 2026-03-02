"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { storePlayerSession } from "@/lib/player-session";

interface HabitInput {
  name: string;
  points: string;
  type: "good" | "bad";
}

export function CreateGameForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [totalWeeks, setTotalWeeks] = useState("4");

  const [habits, setHabits] = useState<HabitInput[]>([
    { name: "Exercise", points: "10", type: "good" },
    { name: "Read 30 mins", points: "5", type: "good" },
    { name: "Junk food", points: "10", type: "bad" },
  ]);

  const [creatorName, setCreatorName] = useState("");

  const addHabit = () => {
    setHabits([...habits, { name: "", points: "5", type: "good" }]);
  };

  const removeHabit = (index: number) => {
    if (habits.length <= 1) return;
    setHabits(habits.filter((_, i) => i !== index));
  };

  const updateHabit = (
    index: number,
    field: keyof HabitInput,
    value: string
  ) => {
    const updated = [...habits];
    updated[index] = { ...updated[index], [field]: value };
    setHabits(updated);
  };

  const handleSubmit = async () => {
    const validHabits = habits.filter((h) => h.name.trim() && h.points);
    if (validHabits.length === 0) {
      toast.error("Add at least one habit");
      return;
    }
    if (!creatorName.trim()) {
      toast.error("Enter your name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Habit Duel",
          habits: validHabits.map((h) => ({
            name: h.name.trim(),
            points: parseInt(h.points) || 5,
            type: h.type,
          })),
          total_weeks: parseInt(totalWeeks),
          creator_name: creatorName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create game");
        return;
      }

      if (!data.player_token) {
        toast.error("Could not create secure player session");
        return;
      }

      storePlayerSession(data.game_code, data.player_id, data.player_token);
      router.push(`/game/${data.game_code}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="neon-3d-card w-full max-w-lg bg-card/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-center tracking-wide">
          {step === 1 && "Game Setup"}
          {step === 2 && "Define Habits"}
          {step === 3 && "Your Name"}
        </CardTitle>
        <div className="flex justify-center gap-2 pt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? "bg-primary shadow-[0_0_12px_hsl(var(--primary))]" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Game Title (optional)</Label>
              <Input
                id="title"
                placeholder="Habit Duel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weeks">Number of Weeks</Label>
              <Select value={totalWeeks} onValueChange={setTotalWeeks}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      {w} {w === 1 ? "week" : "weeks"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add habits to track. Good habits earn positive points, bad habits
              earn negative points when completed.
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {habits.map((habit, i) => (
                <div
                  key={i}
                  className="flex items-end gap-2 rounded-lg border border-yellow-400/25 bg-black/35 p-3"
                >
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Habit name</Label>
                    <Input
                      placeholder="e.g. Exercise"
                      value={habit.name}
                      onChange={(e) => updateHabit(i, "name", e.target.value)}
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Points</Label>
                    <Input
                      type="number"
                      min="1"
                      value={habit.points}
                      onChange={(e) => updateHabit(i, "points", e.target.value)}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={habit.type}
                      onValueChange={(v) =>
                        updateHabit(i, "type", v as "good" | "bad")
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="bad">Bad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHabit(i)}
                    disabled={habits.length <= 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    X
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={addHabit}>
              + Add Habit
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  const valid = habits.filter(
                    (h) => h.name.trim() && h.points
                  );
                  if (valid.length === 0) {
                    toast.error("Add at least one habit with a name and points");
                    return;
                  }
                  setStep(3);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && creatorName.trim()) handleSubmit();
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || !creatorName.trim()}
              >
                {isSubmitting ? "Creating..." : "Create Game"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
