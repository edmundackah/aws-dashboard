### Summary
Environment-aware summaries, clearer totals, and a small celebration when we hit milestones.

### What changed
- Added environment tabs (All, DEV, SIT, UAT, NFT) with persistent selection (defaults to DEV)
- Replaced the four KPI cards with two compact summary panels (SPAs, Microservices): migrated/total, percent, animated progress, env coverage
- “All” now means deployed to all envs; totals stay overall so percentages make sense
- Team progress chart reflects the selected env but divides by overall team totals
- Confetti + glow when a panel crosses a configurable threshold; green celebratory banner when both SPAs and MS meet the threshold across all envs
- Accept `otel` and `mssdk` from the summary endpoint for microservices

### Config
- `.env.local`: `NEXT_PUBLIC_CONFETTI_THRESHOLD_PCT=60` (default 50 if unset)

### Notes
- Better contrast for tabs/panels; progress bars animate
- Confetti runs on tab change when threshold is met

