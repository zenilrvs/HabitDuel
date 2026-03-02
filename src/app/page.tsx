import { CreateGameForm } from "@/components/game/create-game-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold tracking-[0.08em] sm:text-6xl">
          HabitDuel
        </h1>
        <p className="mt-2 text-lg text-yellow-100/80">
          A neon-space challenge to build better habits together.
        </p>
      </div>
      <CreateGameForm />
    </main>
  );
}
