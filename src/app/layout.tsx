import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // Import provider
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AWS Migration Tracker",
  description: "Dashboard for tracking AWS migration progress.",
};

export default function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
    {/* Set defaultTheme="dark" and disable system theme preference */}
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
    </body>
    </html>
  );
}