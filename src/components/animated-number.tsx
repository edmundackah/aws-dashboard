"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current === target) return;

    if (target > 0) {
      const interval = setInterval(() => {
        setCurrent((prev) => {
          if (prev < target) {
            const increment = Math.ceil((target - prev) / 10);
            return prev + increment;
          } else {
            clearInterval(interval);
            return target;
          }
        });
      }, 40);

      return () => clearInterval(interval);
    } else {
      setCurrent(0);
    }
  }, [target, current]); // Add 'current' to dependency array for correctness

  return <>{current.toLocaleString()}</>;
}