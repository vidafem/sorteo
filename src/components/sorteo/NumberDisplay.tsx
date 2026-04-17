"use client";
import { motion } from "framer-motion";

export default function NumberDisplay({ numero }: { numero: number | null }) {
  return (
    <motion.div
      key={numero}
      initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      className="text-8xl font-black text-white drop-shadow-2xl"
      style={{
        textShadow: "0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.6)",
      }}
    >
      {numero?.toString().padStart(3, '0') ?? "???"}
    </motion.div>
  );
}