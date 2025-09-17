import { format, parseISO } from "date-fns";

interface FancyDateProps {
  date: string;
}

export function FancyDate({ date }: FancyDateProps) {
  const parsedDate = parseISO(date);
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-2 text-center text-muted-foreground shadow-sm w-16 h-16 border">
      <div className="text-xs font-semibold uppercase tracking-wider">
        {format(parsedDate, "MMM")}
      </div>
      <div className="text-2xl font-bold text-foreground">
        {format(parsedDate, "d")}
      </div>
      <div className="text-xs">{format(parsedDate, "yyyy")}</div>
    </div>
  );
}
