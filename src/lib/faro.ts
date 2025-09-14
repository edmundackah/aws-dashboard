import type { Faro } from '@grafana/faro-web-sdk';

let faro: Faro | null = null;

export async function initializeFaroClient(): Promise<void> {
  if (typeof window === 'undefined' || faro) return;

  const enabled = (process.env.NEXT_PUBLIC_FARO_ENABLED ?? 'true').toLowerCase() !== 'false';
  if (!enabled) {
    return;
  }

  const url = process.env.NEXT_PUBLIC_FARO_URL;
  if (!url) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Faro URL not configured, skipping initialization.');
    }
    return;
  }

  const { getWebInstrumentations, initializeFaro } = await import('@grafana/faro-web-sdk');
  const { TracingInstrumentation } = await import('@grafana/faro-web-tracing');

  const paused = (process.env.NEXT_PUBLIC_FARO_PAUSED ?? 'false').toLowerCase() === 'true';
  const internalLoggerLevel = (process.env.NEXT_PUBLIC_FARO_INTERNAL_LOG_LEVEL ?? '').toLowerCase();
  const level = internalLoggerLevel === 'silent' || internalLoggerLevel === 'error' || internalLoggerLevel === 'warn' || internalLoggerLevel === 'debug'
    ? internalLoggerLevel
    : undefined;

  const config: any = {
    url,
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME ?? 'aws-dashboard',
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',

    },
    instrumentations: [
      ...getWebInstrumentations({
        // Optional, defaults to true:
        captureConsole: true,
      }),
      new TracingInstrumentation(),
    ],
    paused,
  };
  if (level) {
    config.internalLoggerLevel = level;
  }

  faro = initializeFaro(config);
}

export function getFaro() {
  return faro;
}
