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
          <div key={release.version} className="relative flex items-start">
            <div className="absolute left-1/2 top-4 -translate-x-1/2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <GitMerge className="h-5 w-5" />
              </span>
            </div>
            <ReleaseCard
              release={release}
              align={index % 2 === 0 ? "right" : "left"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
