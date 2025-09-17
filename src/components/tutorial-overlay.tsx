"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LOCAL_STORAGE_KEY = "mr3_tutorial_dismissed";

type Feature = { title: string; body: string; example?: string };

const features: Feature[] = [
  {
    title: "Multi-tenancy",
    body:
      "Select a department from the Department selector. The active department prefixes API calls and is preserved in the URL.",
    example: "Example URL: ?department=DEV",
  },
  {
    title: "Enhanced Burndown Predictions",
    body:
      "Burndown status now uses linear regression to calculate burn rates and project completion dates with confidence scores.",
    example: "Hover over the info icon (ℹ) in the card header to see detailed projections for SPAs and Microservices.",
  },
  {
    title: "Redesigned Last Updated",
    body:
      "Hover the navbar indicator to see freshness, timestamp, and a refresh action.",
    example: "Click Refresh to trigger data re-fetch with a spinning animation.",
  },
  {
    title: "Theme Toggle (Light / Dark)",
    body:
      "Choose between Light and Dark for a simpler UI. System option was removed for clarity.",
    example: "Use the toggle in the navbar; your preference persists across sessions.",
  },
  {
    title: "Keyboard Shortcuts",
    body:
      "Open the command palette or export data quickly with the keyboard.",
    example: "Cmd/Ctrl + K → Command palette, Cmd/Ctrl + E → Export",
  },
];

export function TutorialOverlay() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    // Don't show if user dismissed before
    const dismissed = typeof window !== "undefined" && window.localStorage.getItem(LOCAL_STORAGE_KEY) === "1";
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  React.useEffect(() => {
    // Allow manual re-open via a custom event
    const handler: EventListener = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("mr3:open-tutorial", handler);
    return () => window.removeEventListener("mr3:open-tutorial", handler);
  }, []);

  const closeAndRemember = React.useCallback(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  }, []);

  if (!open) return null;

  const atLast = step >= features.length - 1;
  const f = features[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="w-[min(92vw,760px)] shadow-2xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">What’s new in Migration Tracker 3.0</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-base font-semibold text-primary">{f.title}</div>
              <div className="text-sm text-muted-foreground leading-6">{f.body}</div>
              {f.example && (
                <div className="mt-2 text-[12px] text-foreground/80 font-mono bg-muted/40 rounded px-2 py-1 inline-block">
                  {f.example}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                {features.map((_, i) => (
                  <span
                    key={i}
                    className={
                      "h-1.5 w-6 rounded-full " + (i <= step ? "bg-primary/80" : "bg-muted-foreground/30")
                    }
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={closeAndRemember}>Don’t show again</Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
                {!atLast ? (
                  <Button onClick={() => setStep((s) => Math.min(s + 1, features.length - 1))}>Next</Button>
                ) : (
                  <Button onClick={closeAndRemember}>Finish</Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
