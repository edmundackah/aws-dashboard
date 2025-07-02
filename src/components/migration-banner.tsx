"use client";

import {motion} from "framer-motion";
import Link from "next/link";
import {Button} from "./ui/button";

export function MigrationBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }} // Delay to appear after the cards
    >
      <div className="bg-primary text-primary-foreground p-6 rounded-lg mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Still need to migrate? 🤔</h3>
          <p className="text-sm text-primary-foreground/80">Our new documentation makes it simple.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="#">Read the Docs</Link>
        </Button>
      </div>
    </motion.div>
  );
}