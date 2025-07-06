import type { Metadata } from "next";
import localFont from 'next/font/local';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const poppins = localFont({
  src: [
    {
      path: '../fonts/poppins-v23-latin-300.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/poppins-v23-latin-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/poppins-v23-latin-600.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "AWS Migration Tracker",
  description: "Dashboard for tracking AWS migration progress.",
};

export default function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
    <body className={cn("min-h-screen bg-background font-sans antialiased")}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster richColors />
    </ThemeProvider>
    </body>
    </html>
  );
}