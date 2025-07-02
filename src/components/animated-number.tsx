// components/animated-number.tsx
"use client";

import {useEffect, useState} from "react";

export function AnimatedNumber({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current === target) return;

    // Start the animation only when the target is greater than 0
    if (target > 0) {
      const interval = setInterval(() => {
        setCurrent((prev) => {
          if (prev < target) {
            // Increment faster for larger numbers
            const increment = Math.ceil((target - prev) / 10);
            return prev + increment;
          } else {
            clearInterval(interval);
            return target;
          }
        });
      }, 40); // Adjust speed of animation here

      return () => clearInterval(interval);
    } else {
      // If target is 0, set it immediately
      setCurrent(0);
    }
  }, [current, target]);

  return <>{current}</>;
}