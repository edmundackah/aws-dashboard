"use client";

import { motion } from "framer-motion";
import { GitMerge } from "lucide-react";
import { ReleaseCard } from "./ReleaseCard";
import type { ReleaseNote } from "./types";

interface ReleaseTimelineProps {
  releases: ReleaseNote[];
}

export function ReleaseTimeline({ releases }: ReleaseTimelineProps) {
  return (
    <div className="relative">
      <div
        className="absolute left-1/2 h-full w-px bg-border -translate-x-1/2"
        aria-hidden="true"
      />

      <div className="space-y-16">
        {releases.map((release, index) => (
          <motion.div
            key={release.version}
            className="relative flex items-start"
            initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="absolute left-1/2 top-4 -translate-x-1/2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <GitMerge className="h-5 w-5" />
              </span>
            </div>
            <div
              className={`w-full ${
                index % 2 === 0 ? "md:ml-auto" : "md:mr-auto"
              } md:w-[calc(50%-2rem)]`}
            >
              <ReleaseCard release={release} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
