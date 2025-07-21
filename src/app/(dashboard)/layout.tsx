"use client";

import { Header } from "@/components/header";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4">
      <Header />
      <Separator className="my-4" />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
