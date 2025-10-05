"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="text-center space-y-3 max-w-md">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
            <button className="px-3 py-2 rounded-md border" onClick={() => reset()}>Try again</button>
            {process.env.NODE_ENV !== "production" && error?.digest && (
              <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}


