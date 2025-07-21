"use client";

import { Button } from "./ui/button";
import { Rocket } from "lucide-react";
import Link from "next/link";

export function MigrationBanner() {
  const docsUrl: string = process.env.NEXT_PUBLIC_DOCS_URL || "#";

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-primary/20 p-2 rounded-full">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-base text-primary">Still need to migrate? 🤔</h3>
          <p className="text-sm text-primary/80">Our comprehensive documentation makes it simple.</p>
        </div>
      </div>
      <Button asChild>
        <Link href={docsUrl} target="_blank" rel="noopener noreferrer">
          Learn More
        </Link>
      </Button>
    </div>
  );
}