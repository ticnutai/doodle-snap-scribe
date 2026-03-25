import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TimerOverlayProps {
  seconds: number;
  onComplete: () => void;
}

export function TimerOverlay({ seconds, onComplete }: TimerOverlayProps) {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center"
    >
      <motion.div
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="font-display text-9xl font-bold text-accent"
        style={{
          textShadow: "0 4px 30px hsl(43 74% 49% / 0.5)",
        }}
      >
        {count}
      </motion.div>
    </motion.div>
  );
}
