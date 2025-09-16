import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReleaseNote } from "./types";
import { FancyDate } from "./FancyDate";

interface ReleaseCardProps {
  release: ReleaseNote;
}

export function ReleaseCard({ release }: ReleaseCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow">
            <Badge variant="outline">v{release.version}</Badge>
            <CardTitle className="pt-2">{release.title}</CardTitle>
            <CardDescription className="pt-1">{release.summary}</CardDescription>
          </div>
          <FancyDate date={release.date} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {release.sections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground">
              {section.title.toUpperCase()}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
