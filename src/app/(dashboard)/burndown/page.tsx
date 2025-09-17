"use client";

import {BurndownPageClient} from "@/components/burndown-page-client";

export default function BurndownPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <BurndownPageClient />
    </main>
  );
}


