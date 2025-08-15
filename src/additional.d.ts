namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_SUMMARY_API_URL: string;
    NEXT_PUBLIC_AWS_ICON_URL: string;
    NEXT_PUBLIC_DOCS_URL: string;
    NEXT_PUBLIC_CONFETTI_THRESHOLD_PCT?: string;
    NEXT_PUBLIC_CONFETTI_MODE?: "off" | "eco" | "normal" | string;
    NEXT_PUBLIC_CONFETTI_COOLDOWN_MS?: string;
  }
}

declare module "canvas-confetti";