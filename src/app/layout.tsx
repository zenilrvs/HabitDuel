import type { Metadata } from "next";
import { Orbitron, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HabitDuel - Compete on Habits",
  description:
    "Challenge a friend to build better habits. Track daily, compete weekly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${orbitron.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
