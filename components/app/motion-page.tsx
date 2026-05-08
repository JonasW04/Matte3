"use client";

import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

export function MotionPage({ children }: PropsWithChildren) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
