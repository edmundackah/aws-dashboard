// ambient env var declarations for type completion only
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type __ENV__ = {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_SUMMARY_API_URL: string;
  NEXT_PUBLIC_AWS_ICON_URL: string;
  NEXT_PUBLIC_BURNDOWN_API_URL: string;
  // Default burndown target dates (ISO yyyy-mm-dd)
  NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_DEV?: string;
  NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_DEV?: string;
  NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_SIT?: string;
  NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_SIT?: string;
  NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_UAT?: string;
  NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_UAT?: string;
  NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_NFT?: string;
  NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_NFT?: string;
  NEXT_PUBLIC_DOCS_URL: string;
  NEXT_PUBLIC_CONFETTI_THRESHOLD_PCT?: string;
  NEXT_PUBLIC_CONFETTI_MODE?: "off" | "eco" | "normal" | string;
  NEXT_PUBLIC_CONFETTI_COOLDOWN_MS?: string;
}

declare module "canvas-confetti";

declare global {
  interface Window {
    __BURNDOWN_TARGET_OVERRIDES__?: Record<string, { spa?: string; ms?: string }>
  }
}

export {}