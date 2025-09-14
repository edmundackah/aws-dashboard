## Release 3.0 – AWS Migration Dashboard

### Summary
This release delivers multi-tenant support, a major filters UX overhaul, a redesigned “Last updated” indicator, and URL-shareable state across the app. It also includes type safety improvements, build stability fixes, and an upgrade to Next.js 15.5.3.

### Highlights
- Multi-tenancy via Department selector (compact, modern UI)
- Powerful filter popover for SPAs and Microservices with shareable URLs
- Teams page logic now recomputes per-team counts by selected environment
- Redesigned “Last updated” indicator with hover details and refresh action
- URL query params persist filters and department for easy link sharing
- Consistent light/dark styling and accessibility improvements
- Next.js upgraded to 15.5.3; build stability fixes

---

### New Features & Enhancements

#### 1) Multi-tenancy (Department Selector)
- New `DepartmentSelector` component with compact popover, uppercase labels, and Building icon.
- Reads tenant names from `.env` variable `NEXT_PUBLIC_DEPARTMENTS` (comma-separated).
- API requests dynamically prefix endpoints with `/{department}/`.
- Department is persisted and synchronised to URL (`?department=...`).
- Styling matches the search bar for improved light mode visibility.

#### 2) Filters UX Overhaul (SPAs & Microservices)
- Consolidated all filters into a single `ServiceFiltersPopover`:
  - Team, Show by migration completion (Status), Environment
  - OTel version and MSSDK version (single-select) on Microservices
- Dynamic, data-driven options (OTel/MSSDK populate from actual version strings).
- Active filter chips with improved visibility in light mode.
- “Clear all” is destructive-styled and only visible when there are active filters.
- “Done” button added; Clear closes the popover; width and alignment tuned.
- Consistent combobox widths; chip height matches buttons.
- Popover layout widened and rebalanced to prevent overflow.

#### 3) Teams Page Behavior
- Environment dropdown only (no status control).
- Per-team migration counts recompute based on the selected environment (no filtering out teams).
- Removed “All environments” option on Teams.

#### 4) Redesigned “Last updated” Indicator
- Minimal nav bar dot; detailed info on hover (HoverCard):
  - Relative freshness, exact timestamp, color legend.
  - Refresh button with spin animation on click.
- Extracted into `LastUpdatedIndicator` component.

#### 5) Shareable Views via URL
- Filters for SPAs/Microservices/Teams sync to query params:
  - `team`, `status`, `env`, `otel`, `mssdk`
- Department also syncs via `department` query param.
- Page loads initialise filters/department from the URL.

#### 6) UI Consistency & Polish
- Light mode visibility improvements for chips and controls.
- Destructive-outline button variant for red-bordered actions.
- Standardised combobox widths (~240px) for a uniform look.
- Department selector uses uppercase labels and always shows a Building icon.
- Removed confetti on selection for a cleaner UX.
- Introduced a new segmented Theme Toggle (Light/System/Dark) with animated pill, improved accessibility, and enhanced light-mode edge contrast.

#### 7) Tables & Interactions
- `DataTable` pagination ellipsis shows `HoverCard` quick-jump interactions.

#### 8) Data & Store
- `use-dashboard-store` updated for multi-tenancy and cache handling.
- `processDashboardData` continues to normalise API response with optional summary merge.

#### 9) Type Safety & Build Stability
- Fixed implicit `any` and indexing errors by introducing `EnvKey`/`EnvFilter`.
- Correctly typed `StatusValue` handlers; removed explicit `any` casts.
- Wrapped pages/components using `useSearchParams` in Suspense where needed; guarded access and added optional chaining to prevent SSR issues.

#### 10) Framework Upgrade
- Upgraded to Next.js `15.5.3` via codemod.
- Rebuilt successfully; static prerendering validated for app routes.

#### 11) URL State Consistency
- Department is preserved alongside page filters on SPAs, Microservices, and Teams so links remain tenant-specific across navigation.

---

### Breaking Changes
- API endpoints are now prefixed with the active department: `/{department}/...`.
- Teams page no longer supports an “All environments” option.

### Configuration & Migration
1) Add departments to `.env`:
   - `NEXT_PUBLIC_DEPARTMENTS=DEV,OPS,PLAT,SEC` (example)
2) Verify public URLs and bookmarks:
   - Deep links may include `team`, `status`, `env`, `otel`, `mssdk`, and `department` query params.

### QA / Acceptance Checklist
- Department selector:
  - Displays uppercase names, uses Building icon, matches search bar styling.
  - Changes update data and `?department=...` in the URL.
- SPAs & Microservices pages:
  - Filter popover works; chips reflect state; Clear only shows when needed.
  - “Done” closes the popover; Clear resets and closes.
  - OTel/MSSDK show actual versions; filters apply correctly.
  - URL query params update on filter changes and initialise on load.
- Teams page:
  - Only environment dropdown; no “All” option.
  - Per-team migrated/outstanding counts recompute based on selected env.
- Last Updated:
  - Dot visible in navbar; hover shows freshness, timestamp, legend.
  - Refresh animates and updates data.
- Build & Types:
  - `npm run build` passes with no type or lint errors.

### Rollback Plan
- Revert to previous commit/tag and redeploy.
- Remove department URL prefixing at the API gateway if needed.

### Notes
- This MR includes a significant UI/UX overhaul while preserving core workflows.
- Follow-up ideas: saved filter presets, department-specific defaults, and analytics on filter usage.


