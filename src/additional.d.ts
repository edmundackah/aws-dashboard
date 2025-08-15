namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_SUMMARY_API_URL: string;
    NEXT_PUBLIC_AWS_ICON_URL: string;
    NEXT_PUBLIC_DOCS_URL: string;
    NEXT_PUBLIC_CONFETTI_THRESHOLD_PCT?: string;
  }
}

declare module "canvas-confetti";