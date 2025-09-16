import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReleaseNote } from "./types";

interface ReleaseCardProps {
  release: ReleaseNote;
  align: "left" | "right";
}

export function ReleaseCard({ release, align }: ReleaseCardProps) {
  return (
    <Card
      className={`w-full ${
        align === "left" ? "md:mr-auto" : "md:ml-auto"
      } md:w-[calc(50%-2rem)]`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">v{release.version}</Badge>
          <time className="text-sm text-muted-foreground">
            {release.date}
          </time>
        </div>
        <CardTitle className="pt-2">{release.title}</CardTitle>
        <CardDescription>{release.summary}</CardDescription>
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
