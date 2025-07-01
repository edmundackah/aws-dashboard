"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { motion } from "framer-motion";


interface SummaryCardProps {
  title: string;
  value: number;
  className?: string;
  isButton?: boolean;
  index: number; // Add the missing 'index' prop here
}

export function SummaryCard({ title, value, className, isButton = false, index }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        className={cn(
          "transition-all duration-300",
          isButton && "cursor-pointer hover:-translate-y-1 hover:shadow-lg",
          className
        )}
        role={isButton ? 'button' : 'figure'}
        tabIndex={isButton ? 0 : -1}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-extrabold">
            <AnimatedNumber target={value} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}