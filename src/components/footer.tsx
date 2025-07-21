"use client";

export function Footer() {
  return (
    <footer className="flex h-14 items-center gap-4 border-t bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mt-auto">
      <div className="container mx-auto flex justify-center items-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} AWS Migration Tracker. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
