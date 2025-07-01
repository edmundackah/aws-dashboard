// components/SummaryCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number"; // Import the new component

interface SummaryCardProps {
  title: string;
  value: number; // Value is now always a number
  className?: string;
  isButton?: boolean;
}

export function SummaryCard({ title, value, className, isButton = false }: SummaryCardProps) {
  return (
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
          {/* Use the AnimatedNumber component */}
          <AnimatedNumber target={value} />
        </div>
      </CardContent>
    </Card>
  );
}