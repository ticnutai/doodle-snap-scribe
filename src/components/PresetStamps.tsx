import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Check, XCircle, Star, AlertTriangle, Heart, ThumbsUp, ThumbsDown, Ban, Info, HelpCircle, Zap, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StampDefinition {
  id: string;
  label: string;
  category: string;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => void;
}

const stamps: StampDefinition[] = [
  // Arrows
  {
    id: "arrow-right", label: "חץ ימינה", category: "חצים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = size / 15; ctx.lineCap = "round";
      const hw = size / 2; const hh = size / 4;
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x + hw * 0.4, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + hw, y); ctx.lineTo(x + hw * 0.2, y - hh); ctx.lineTo(x + hw * 0.2, y + hh); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "arrow-left", label: "חץ שמאלה", category: "חצים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = size / 15; ctx.lineCap = "round";
      const hw = size / 2; const hh = size / 4;
      ctx.beginPath(); ctx.moveTo(x + hw, y); ctx.lineTo(x - hw * 0.4, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x - hw * 0.2, y - hh); ctx.lineTo(x - hw * 0.2, y + hh); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "arrow-up", label: "חץ למעלה", category: "חצים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = size / 15; ctx.lineCap = "round";
      const hw = size / 4; const hh = size / 2;
      ctx.beginPath(); ctx.moveTo(x, y + hh); ctx.lineTo(x, y - hh * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x - hw, y - hh * 0.2); ctx.lineTo(x + hw, y - hh * 0.2); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "arrow-down", label: "חץ למטה", category: "חצים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = size / 15; ctx.lineCap = "round";
      const hw = size / 4; const hh = size / 2;
      ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x, y + hh * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + hh); ctx.lineTo(x - hw, y + hh * 0.2); ctx.lineTo(x + hw, y + hh * 0.2); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "curved-arrow", label: "חץ מעוגל", category: "חצים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = size / 15; ctx.lineCap = "round";
      const r = size * 0.35;
      ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0, false); ctx.stroke();
      // arrowhead at end
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + r - size * 0.1, y - size * 0.15); ctx.lineTo(x + r + size * 0.1, y - size * 0.05); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  },
  // Checkmarks & Symbols
  {
    id: "checkmark", label: "סימן V", category: "סימנים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const s = size * 0.4;
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.6); ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "checkmark-circle", label: "V בעיגול", category: "סימנים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 15;
      ctx.beginPath(); ctx.arc(x, y, size * 0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = size / 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const s = size * 0.25;
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.6); ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "x-mark", label: "סימן X", category: "סימנים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 8; ctx.lineCap = "round";
      const s = size * 0.3;
      ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "x-circle", label: "X בעיגול", category: "סימנים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 15;
      ctx.beginPath(); ctx.arc(x, y, size * 0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = size / 8; ctx.lineCap = "round";
      const s = size * 0.2;
      ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "star", label: "כוכב", category: "סימנים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.fillStyle = color;
      const spikes = 5; const outerR = size * 0.4; const innerR = size * 0.18;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "exclamation", label: "סימן קריאה", category: "סימנים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.fillStyle = color;
      const w = size * 0.08; const h = size * 0.45;
      // Line
      ctx.beginPath();
      ctx.roundRect(x - w, y - h, w * 2, h * 1.4, w);
      ctx.fill();
      // Dot
      ctx.beginPath(); ctx.arc(x, y + h * 0.65, w * 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "question", label: "סימן שאלה", category: "סימנים",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = size / 12; ctx.lineCap = "round";
      const r = size * 0.2;
      ctx.beginPath(); ctx.arc(x, y - size * 0.15, r, Math.PI, 0, false); ctx.lineTo(x + r, y - size * 0.05);
      ctx.quadraticCurveTo(x, y + size * 0.05, x, y + size * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y + size * 0.3, size * 0.04, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },
  // Frames
  {
    id: "frame-rect", label: "מסגרת מלבן", category: "מסגרות",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 12; ctx.lineJoin = "round";
      const w = size * 0.8; const h = size * 0.6;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      ctx.restore();
    },
  },
  {
    id: "frame-rounded", label: "מסגרת מעוגלת", category: "מסגרות",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 12;
      const w = size * 0.8; const h = size * 0.6; const r = size * 0.1;
      ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, r); ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "frame-circle", label: "מסגרת עיגול", category: "מסגרות",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 12;
      ctx.beginPath(); ctx.arc(x, y, size * 0.4, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "frame-dashed", label: "מסגרת מקווקו", category: "מסגרות",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 15; ctx.setLineDash([size / 10, size / 15]);
      const w = size * 0.8; const h = size * 0.6;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      ctx.restore();
    },
  },
  {
    id: "bracket-left", label: "סוגר שמאל", category: "מסגרות",
    draw: (ctx, x, y, size, color) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 12; ctx.lineCap = "round";
      const h = size * 0.7; const w = size * 0.15;
      ctx.beginPath(); ctx.moveTo(x + w, y - h / 2); ctx.lineTo(x - w, y - h / 2); ctx.lineTo(x - w, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
      ctx.restore();
    },
  },
  // Numbers
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: `number-${n}`, label: `מספר ${n}`, category: "מספרים",
    draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
      ctx.save(); ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, size * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.font = `bold ${size * 0.4}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(n), x, y + 1);
      ctx.restore();
    },
  })),
];

const categories = [...new Set(stamps.map((s) => s.category))];

interface PresetStampsProps {
  visible: boolean;
  onClose: () => void;
  onSelectStamp: (stamp: StampDefinition) => void;
  activeStampId: string | null;
  currentColor: string;
}

export function PresetStamps({ visible, onClose, onSelectStamp, activeStampId, currentColor }: PresetStampsProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredStamps = stamps.filter((s) => s.category === activeCategory);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="fixed top-4 left-4 z-[115] bg-background border-2 border-accent rounded-2xl p-4 gold-shadow w-64 max-h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
            <h3 className="font-display text-sm font-bold text-foreground">תבניות מוכנות</h3>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 mb-3 flex-wrap justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stamps grid */}
          <div className="grid grid-cols-4 gap-2 overflow-auto flex-1">
            {filteredStamps.map((stamp) => {
              const isActive = activeStampId === stamp.id;
              return (
                <button
                  key={stamp.id}
                  onClick={() => onSelectStamp(stamp)}
                  title={stamp.label}
                  className={cn(
                    "aspect-square rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105",
                    isActive
                      ? "border-accent bg-accent/10 scale-105"
                      : "border-accent/20 hover:border-accent/50 bg-secondary/30"
                  )}
                >
                  <StampPreview stamp={stamp} color={currentColor} size={36} />
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground text-right mt-2">
            בחר תבנית ולחץ על הקנבס כדי להציב
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StampPreview({ stamp, color, size }: { stamp: StampDefinition; color: string; size: number }) {
  return (
    <canvas
      width={size}
      height={size}
      ref={(canvas) => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, size, size);
        stamp.draw(ctx, size / 2, size / 2, size * 0.85, color);
      }}
      className="pointer-events-none"
    />
  );
}

export { stamps };
