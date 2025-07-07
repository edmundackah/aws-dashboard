import {ThemeToggle} from "./theme-toggle";

interface HeaderProps {
  lastUpdated: string;
}

export function Header({ lastUpdated }: HeaderProps) {
  const formattedDate = new Date(lastUpdated).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            AWS Migration Tracker
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden sm:block text-sm font-medium text-muted-foreground">
            Last Updated: {formattedDate}
          </p>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}