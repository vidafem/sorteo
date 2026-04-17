"use client";
import { motion } from "framer-motion";

export default function NumberDisplay({ numero }: { numero: number | null }) {
  return (
    <motion.div
      key={numero}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1.5, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="text-7xl font-bold"
    >
      {numero ?? "???"}
    </motion.div>
  );
}