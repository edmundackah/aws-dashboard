"use client";

import { Header } from "@/components/header";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4">
      <Header />
      <Separator className="my-4" />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col min-h-0"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
