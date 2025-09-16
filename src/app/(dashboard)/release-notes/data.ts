import type { ReleaseNote } from "@/components/release-notes/types";

export const releaseNotes: ReleaseNote[] = [
  {
    version: "3.0",
    title: "Multi-tenancy, Filters UX Revamp, and Shareable URLs",
    date: "2024-09-15",
    summary:
      "This release delivers multi-tenant support, a major filters UX revamp, a redesigned “Last updated” indicator, and URL-shareable state across the app. It also includes type safety improvements, build stability fixes, and an upgrade to Next.js 15.5.3.",
    sections: [
      {
        title: "Highlights",
        items: [
          "Multi-tenancy via Department selector (compact, modern UI)",
          "Powerful filter popover for SPAs and Microservices with shareable URLs",
          "Teams page logic now recomputes per-team counts by selected environment",
          "Redesigned “Last updated” indicator with hover details and refresh action",
          "URL query params persist filters and department for easy link sharing",
          "Consistent light/dark styling and accessibility improvements",
          "Next.js upgraded to 15.5.3; build stability fixes",
        ],
      },
      {
        title: "New Features & Enhancements",
        items: [
          "Multi-tenancy (Department Selector)",
          "Filters UX Revamp (SPAs & Microservices)",
          "Teams Page Behaviour",
          "Redesigned “Last updated” Indicator",
          "Shareable Views via URL",
          "UI Consistency & Polish",
          "Burndown Chart Improvements",
          "Release Tutorial Overlay",
          "Tables & Interactions",
          "Data & Store",
          "Type Safety & Build Stability",
          "Framework Upgrade",
          "URL State Consistency",
        ],
      },
    ],
  },
  {
    version: "2.5",
    title: "Burndown UX, status colours, and tooltip improvements",
    date: "2024-07-28",
    summary:
      "Switch burndown to a compact 2x2 grid that fits one screen without scrolling, standardise status colours, reintroduce accessible tooltips, and add a floating help button with a simple status guide.",
    sections: [
      {
        title: "Key Changes",
        items: [
          "Layout and sizing",
          "Status colours and guides",
          "Tooltips",
          "Help FAB and modal",
        ],
      },
    ],
  },
];
