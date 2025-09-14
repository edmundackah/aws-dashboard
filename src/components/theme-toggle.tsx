"use client";

import * as React from "react";
import {useTheme} from "next-themes";

import {Button} from "@/components/ui/button";
import {SunIcon} from "@/components/sun-icon";
import {MoonIcon} from "@/components/moon-icon";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="group"
    >
      <SunIcon className="h-4 w-4 block text-gray-400 dark:hidden group-hover:text-gray-600" />
      <MoonIcon className="h-4 w-4 hidden dark:block text-gray-500 dark:group-hover:text-gray-300" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}