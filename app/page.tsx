"use client";

import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import HiraganaQuiz from "./components/HiraganaQuiz";

export default function Home() {
  const [mode, setMode] = useState<"hiragana" | "katakana">("hiragana");
  const nextMode = mode === "hiragana" ? "katakana" : "hiragana";
  const nextModeLabel = nextMode === "hiragana" ? "Hiragana" : "Katakana";

  return (
    <>
      <div>
        <div
          className="flex items-center justify-between px-6"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "64px",
            zIndex: 1100,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(6px)",
          }}
        >
          <h1 className="text-3xl">Kanamuna</h1>
          <button
            onClick={() => setMode(nextMode)}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            Switch to {nextModeLabel}
          </button>
        </div>
        <HiraganaQuiz key={mode} mode={mode} />
      </div>
      <Analytics />
    </>
  );
}
