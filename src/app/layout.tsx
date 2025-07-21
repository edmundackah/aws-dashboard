import {Poppins} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import {Toaster} from "@/components/ui/sonner";
import {cn} from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: "AWS Migration Tracker",
  description: "Dashboard for tracking AWS migration progress.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
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