"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedNumber } from "./animated-number";

interface SummaryCardProps {
  title: string;
  migrated: number;
  outstanding: number;
  index: number;
  migratedLabel?: string;
}

export function SummaryCard({
                              title,
                              migrated,
                              outstanding,
                              index,
                              migratedLabel = "Migrated",
                            }: SummaryCardProps) {
  const total = migrated + outstanding;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-l font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold">
              <AnimatedNumber target={migrated} />
            </div>
            <span className="text-2xl text-muted-foreground">
              / {total.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground pt-1">
            {migratedLabel}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}