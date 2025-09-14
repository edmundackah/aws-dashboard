"use client";

import {useEffect, useRef} from "react";
import {animate} from "framer-motion";

interface AnimatedNumberProps {
  value: number;
}

export const AnimatedNumber = ({ value }: AnimatedNumberProps) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 1,
      onUpdate(value) {
        node.textContent = Math.round(value).toLocaleString();
      },
    });

    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} />;
};