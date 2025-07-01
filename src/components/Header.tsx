import Image from "next/image";
import { ThemeToggle } from "./theme-toggle"; // Import the toggle

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
          <Image
            src="https://img.icons8.com/win10/512/amazon-web-services.png"
            alt="AWS Icon"
            width={32}
            height={32}
            className="h-8 w-8"
          />
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