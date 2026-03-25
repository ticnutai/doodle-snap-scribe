import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Screenshot } from "@/hooks/useScreenCapture";

interface PinnedScreenshotProps {
  screenshot: Screenshot;
  onUnpin: () => void;
}

export function PinnedScreenshot({ screenshot, onUnpin }: PinnedScreenshotProps) {
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(0.3);

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed z-[90] top-10 right-10 select-none"
      style={{ opacity }}
    >
      <div className="relative group">
        {/* Controls */}
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background border-2 border-accent rounded-lg p-1 flex items-center gap-1 gold-shadow">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
              onClick={() => setScale((s) => Math.max(0.15, s - 0.05))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground"
              onClick={() => setScale((s) => Math.min(1, s + 0.05))}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <div className="w-px h-4 bg-accent/30" />
            <input
              type="range"
              min={20}
              max={100}
              value={opacity * 100}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              className="w-14 h-1 accent-accent"
            />
            <div className="w-px h-4 bg-accent/30" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={onUnpin}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div
          className="border-2 border-accent rounded-xl overflow-hidden gold-shadow cursor-grab active:cursor-grabbing"
          style={{ width: `${Math.round(800 * scale)}px` }}
        >
          <img
            src={screenshot.dataUrl}
            alt={screenshot.title}
            className="w-full pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </motion.div>
  );
}
