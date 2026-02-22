'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HeartBurst Component
 * 
 * USAGE:
 * 
 * 1. Import it:
 *    import HeartBurst from '@/components/HeartBurst';
 * 
 * 2. Add state in your parent component:
 *    const [burstOrigin, setBurstOrigin] = useState(null);
 * 
 * 3. On your like button click, call this:
 *    const handleLikeClick = (e) => {
 *      const rect = e.currentTarget.getBoundingClientRect();
 *      setBurstOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
 *      // ... rest of your like logic
 *    };
 * 
 * 4. Render the component anywhere in your JSX:
 *    <HeartBurst origin={burstOrigin} onDone={() => setBurstOrigin(null)} />
 */

export default function HeartBurst({ origin, onDone }) {
  if (!origin) return null;

  // Build 20 heart particles fanning out in a V shape (two diverging streams)
  const particles = Array.from({ length: 20 }).map((_, i) => {
    const isLeftStream = i % 2 === 0;

    // Left stream: angles going upper-left (-120° to -60°)
    // Right stream: angles going upper-right (-120° to -60° mirrored)
    const baseAngle = isLeftStream
      ? -150 + (i / 2) * 18   // fans left
      : -30 - (i / 2) * 18;   // fans right

    const angleRad = (baseAngle * Math.PI) / 180;
    const distance = 60 + Math.random() * 90;

    return {
      id: i,
      tx: Math.cos(angleRad) * distance,
      ty: Math.sin(angleRad) * distance,
      size: 12 + Math.random() * 20,
      delay: Math.random() * 0.2,
      duration: 0.7 + Math.random() * 0.5,
    };
  });

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: origin.x - p.size / 2,
              y: origin.y - p.size / 2,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: origin.x - p.size / 2 + p.tx,
              y: origin.y - p.size / 2 + p.ty,
              scale: [0, 1.4, 1],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
            onAnimationComplete={() => {
              // Fire onDone after the last particle finishes
              if (p.id === particles.length - 1 && onDone) {
                onDone();
              }
            }}
            style={{
              position: 'fixed',
              width: p.size,
              height: p.size,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="#ef4444"
              style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.85))' }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>,
    document.body
  );
}