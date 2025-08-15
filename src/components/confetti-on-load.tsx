"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiOnLoad() {
  useEffect(() => {
    const durationMs = 1200;
    const end = Date.now() + durationMs;
    const colors = ["#22c55e", "#6366f1", "#06b6d4", "#f59e0b", "#ef4444"]; // on-brand

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        ticks: 200,
        scalar: 0.9,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        ticks: 200,
        scalar: 0.9,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    // small initial burst
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors });
    requestAnimationFrame(frame);
  }, []);

  return null;
}


