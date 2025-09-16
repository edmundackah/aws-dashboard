import { releaseNotes } from "./data";
import { ReleaseTimeline } from "@/components/release-notes/ReleaseTimeline";
import { ReleaseNotesHeader } from "@/components/release-notes/ReleaseNotesHeader";

export default function ReleaseNotesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="container mx-auto max-w-4xl py-8">
        <ReleaseNotesHeader />
        <ReleaseTimeline releases={releaseNotes} />
      </div>
    </div>
  );
}
