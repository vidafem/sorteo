'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PlatformAnimator() {
  const platforms = [
    { name: 'Instagram', icon: 'IG', color: '#E1306C' },
    { name: 'TikTok', icon: 'TT', color: '#000000' },
    { name: 'Facebook', icon: 'FB', color: '#1877F2' },
    { name: 'YouTube', icon: 'YT', color: '#FF0000' },
    { name: 'Twitter', icon: 'X', color: '#000000' },
    { name: 'LinkedIn', icon: 'IN', color: '#0A66C2' },
    { name: 'Twitch', icon: 'TV', color: '#9146FF' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % platforms.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [platforms.length]);

  const currentPlatform = platforms[currentIndex];

  return (
    <div className="space-y-4">
      <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
        <span className="text-white">Sorteo en </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="inline-block font-bold"
            style={{ color: currentPlatform.color }}
          >
            {currentPlatform.name}
          </motion.span>
        </AnimatePresence>
      </h1>
      <p className="mx-auto max-w-2xl text-base text-white/88 sm:text-lg">
        Organiza sorteos profesionales en tu red social favorita con una portada clara, confiable y atractiva.
      </p>
    </div>
  );
}
