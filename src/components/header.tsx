"use client";

import { NavigationBar } from "@/components/navigation-bar";

export const Header = () => {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <NavigationBar />
    </header>
  );
};