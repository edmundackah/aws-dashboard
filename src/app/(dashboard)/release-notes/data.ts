import type { ReleaseNote } from "@/components/release-notes/types";

export const releaseNotes: ReleaseNote[] = [
  {
    version: "3.1",
    title: "Lean UI, live SPA previews, and hydration fixes",
    date: "2025-10-05",
    summary:
      "This release streamlines the interface by removing the tutorial overlay and legacy sidebar components, introduces a richer SPA homepage experience with live preview on hover, and applies hydration mismatch fixes for a smoother, more reliable client render.",
    sections: [
      {
        title: "Highlights",
        items: [
          "Removed tutorial overlay for a cleaner, distraction-free dashboard",
          "Retired unused sidebar components to simplify the codebase",
          "SPA table: homepage now shows favicon, tidy domain, and a live preview hover (best-effort)",
          "Hydration improvements: eliminate non-deterministic render values and defer time-based state to effects",
        ],
      },
      {
        title: "Enhancements",
        items: [
          "SPA homepage hover shows a sandboxed live preview when the site permits embedding; gracefully falls back when blocked by CSP/X-Frame-Options",
          "Quick actions added: Open in new tab and Copy URL",
          "Homepage label now displays a concise domain with favicon for faster recognition",
        ],
      },
      {
        title: "Removals",
        items: [
          "Tutorial overlay removed",
          "Unused sidebar components removed",
        ],
      },
      {
        title: "Fixes",
        items: [
          "Addressed hydration mismatch risks by making skeleton widths deterministic on first render and initialising time values after mount",
          "Further client-only safeguards: localStorage/window access moved into effects or guarded initialisers",
        ],
      },
    ],
  },
  {
    version: "3.0",
    title: "Multi-tenancy, Enhanced Burndown Predictions, and Shareable URLs",
    date: "2024-09-15",
    summary:
      "This release delivers multi-tenant support, enhanced burndown predictions with statistical analysis, a major filters UX revamp, a redesigned 'Last updated' indicator, and URL-shareable state across the app. It also includes type safety improvements, build stability fixes, and an upgrade to Next.js 15.5.3.",
    sections: [
      {
        title: "Highlights",
        items: [
          "Multi-tenancy via Department selector (compact, modern UI)",
          "Enhanced burndown predictions using linear regression and confidence scores",
          "Powerful filter popover for SPAs and Microservices with shareable URLs",
          "Teams page logic now recomputes per-team counts by selected environment",
          "Redesigned 'Last updated' indicator with hover details and refresh action",
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
          "Redesigned 'Last updated' Indicator",
          "Shareable Views via URL",
          "UI Consistency & Polish",
          "Enhanced Burndown Predictions with Linear Regression",
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
