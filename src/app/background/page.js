'use client'
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

export default function LikeButton() {
  const [isLiked, setIsLiked] = useState(false);
  const [showSparks, setShowSparks] = useState(false);

  const toggleLike = () => {
    if (!isLiked) {
      setShowSparks(true);
      setTimeout(() => setShowSparks(false), 800);
    }
    setIsLiked(!isLiked);
  };

  // Heart animation states
const heartVariants = {
  unliked: { 
    scale: 1, 
    rotate: 0, 
    color: "#6b7280" 
  },
  liked: { 
    // The "Shake" sequence: 0 -> -15° -> 15° -> -10° -> 10° -> 0°
    rotate: [0, -15, 15, -10, 10, 0],
    scale: [1, 1.2, 1], // Small pulse while shaking
    color: "#ef4444",
    transition: { 
      duration: 0.4, 
      type: "tween", 
      ease: "easeInOut" 
    }
  }
};


  return (
    <div className="relative flex items-center justify-center p-10 mt-50">
      <motion.button
        onClick={toggleLike}
        animate={isLiked ? "liked" : "unliked"}
        variants={heartVariants}
        whileTap={{ scale: 0.8 }} // Squishy feel on click
        className="relative z-10 p-2 outline-none"
      >
        <Heart fill={isLiked ? "currentColor" : "none"} size={40} />
      </motion.button>

      {/* Sparkle Burst */}
      <AnimatePresence>
        {showSparks && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: 0, 
                  scale: 1, 
                  x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 50 + 20),
                  y: -(Math.random() * 50 + 20) 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute w-2 h-2 bg-red-400 rounded-full"
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
