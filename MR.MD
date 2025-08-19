## Burndown UX, status colors, and tooltip improvements

### Summary

- Switch burndown to a compact 2x2 grid that fits one screen without scrolling.
- Make charts and cards more compact; restore Y-axis label; fix last date tick clipping.
- Standardize status colors (Completed = blue, On track = green) across guides and badges.
- Reintroduce tooltips (tables and burndown badges), remove pointer, and use accessible dark-mode styles.
- Add a floating help button that opens a simple status guide modal (no accordion), small and unobtrusive.

### Key changes

- Layout and sizing
  - 2x2 grid, equal-height rows that fill the viewport without empty space.
  - Reduced card and chart paddings; tightened margins; increased chart right margin to avoid cropping the last tick.
  - Restored Y-axis label with slightly larger font and added left margin to avoid clipping.
  - Removed dynamic outline colors on cards; kept the celebratory `rainbow-glow` when SPA and MS are both completed.

- Status colors and guides
  - Completed: blue
  - On track: green
  - At risk: amber
  - Missed: red
  - Updated `StatusGuide` and `StatusExplainer` dot colors and normalized all dots to perfect circles.

- Tooltips
  - Re-enabled tooltip on table `StatusBadge` with clear copy.
  - Added tooltips to SPA/MS badges on burndown cards with status and (if available) target date.
  - Reworked tooltip visuals: removed pointer/arrow, ensured accessible contrast in dark mode (`dark:bg-black dark:text-white dark:border-white/20`).

- Help FAB and modal
  - Added a floating question-mark button (smaller 40×40) at bottom-right.
  - Opens a modal with an inline status guide list (no accordion, no animations).

### Files changed

- `src/components/burndown-page-client.tsx`
  - 2x2 grid, equal-height rows; spacing tweaks; added `BurndownHelpFab`.
  - Help modal content (inline status guide), smaller FAB button.

- `src/components/burndown/BurndownEnvChartCard.tsx`
  - Compact header/content/footer; tightened chart margins and sizing.
  - Restored Y-axis label; increased left margin; increased right margin to 24.
  - Recolored SPA/MS status badges (Completed=blue, On track=green) and added tooltips.

- `src/components/burndown/StatusGuide.tsx`, `src/components/burndown/StatusExplainer.tsx`
  - Updated color mapping; dots are fully round; copy clarified.

- `src/components/status-badge.tsx`
  - Reintroduced tooltip around the destructive badge for NOT_MIGRATED.

- `src/components/ui/tooltip.tsx`
  - Removed arrow pointer; accessible dark-mode colors; unified visual style.

- `src/components/ui/card.tsx`
  - Slightly reduced default vertical padding/gap to support the compact view.

### Testing

1. Burndown
   - Navigate to Burndown page; confirm 2x2 layout fits completely without scrolling.
   - Verify last X-axis tick/date is fully visible (no clipping).
   - Confirm Y-axis label reads “Services Remaining” and is legible.
   - Hover SPA/MS badges: tooltip shows status and target date (if present).
   - Click the bottom-right help FAB: modal opens with status guide; dots are round; close modal.

2. Tables (SPAs/Microservices)
   - Hover the “Not Migrated” status badge: tooltip appears with explanatory text.
   - Toggle dark mode: tooltip background remains readable with sufficient contrast.

### Accessibility

- Tooltip colors in dark mode use high-contrast foreground on dark background.
- Help FAB has `aria-label` for screen readers.
- Reduced motion: no entrance animations in the help modal.

### Rollback plan
- Revert this MR to restore prior sizing, colors, and tooltip behaviors (including arrow pointer and older status color mapping).

### Notes
- Global `Card` spacing was minimally reduced; visually scan other pages for any unintended layout shifts.


