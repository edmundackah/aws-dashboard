import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Could Not Load Dashboard</h2>
      <p className="text-muted-foreground">{message}</p>
      <p className="text-muted-foreground mt-1">Please ensure the data source is available and refresh the page.</p>
    </div>
  );
}