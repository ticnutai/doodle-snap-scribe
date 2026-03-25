import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X, Minus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingWindowProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  defaultX?: number;
  defaultY?: number;
  className?: string;
  headerClassName?: string;
  /** If true, shows a minimize button */
  minimizable?: boolean;
}

export function FloatingWindow({
  title,
  children,
  onClose,
  defaultWidth = 800,
  defaultHeight = 500,
  minWidth = 300,
  minHeight = 200,
  defaultX,
  defaultY,
  className,
  headerClassName,
  minimizable = false,
}: FloatingWindowProps) {
  const [pos, setPos] = useState({
    x: defaultX ?? Math.max(0, (window.innerWidth - defaultWidth) / 2),
    y: defaultY ?? Math.max(0, (window.innerHeight - defaultHeight) / 2),
  });
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const preMaxState = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const isDragging = useRef(false);
  const isResizing = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Drag
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (isMaximized) return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos, isMaximized]);

  // Resize
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    if (isMaximized) return;
    isResizing.current = handle;
    resizeStart.current = { x: pos.x, y: pos.y, w: size.w, h: size.h, px: e.clientX, py: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  }, [pos, size, isMaximized]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDragging.current) {
        setPos({
          x: e.clientX - dragOffset.current.x,
          y: Math.max(0, e.clientY - dragOffset.current.y),
        });
      }
      if (isResizing.current) {
        const { x, y, w, h, px, py } = resizeStart.current;
        const dx = e.clientX - px;
        const dy = e.clientY - py;
        const handle = isResizing.current;

        let newX = x, newY = y, newW = w, newH = h;

        if (handle.includes("e")) newW = Math.max(minWidth, w + dx);
        if (handle.includes("s")) newH = Math.max(minHeight, h + dy);
        if (handle.includes("w")) {
          const proposedW = w - dx;
          if (proposedW >= minWidth) { newW = proposedW; newX = x + dx; }
        }
        if (handle.includes("n")) {
          const proposedH = h - dy;
          if (proposedH >= minHeight) { newH = proposedH; newY = y + dy; }
        }

        setSize({ w: newW, h: newH });
        setPos({ x: newX, y: newY });
      }
    };

    const handleUp = () => {
      isDragging.current = false;
      isResizing.current = null;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [minWidth, minHeight]);

  const toggleMaximize = () => {
    if (isMaximized) {
      setPos({ x: preMaxState.current.x, y: preMaxState.current.y });
      setSize({ w: preMaxState.current.w, h: preMaxState.current.h });
      setIsMaximized(false);
    } else {
      preMaxState.current = { x: pos.x, y: pos.y, w: size.w, h: size.h };
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth, h: window.innerHeight });
      setIsMaximized(true);
    }
  };

  const resizeHandles = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
  const handleCursors: Record<string, string> = {
    n: "cursor-n-resize", s: "cursor-s-resize",
    e: "cursor-e-resize", w: "cursor-w-resize",
    ne: "cursor-ne-resize", nw: "cursor-nw-resize",
    se: "cursor-se-resize", sw: "cursor-sw-resize",
  };
  const handleStyles: Record<string, string> = {
    n: "top-0 left-2 right-2 h-1.5",
    s: "bottom-0 left-2 right-2 h-1.5",
    e: "right-0 top-2 bottom-2 w-1.5",
    w: "left-0 top-2 bottom-2 w-1.5",
    ne: "top-0 right-0 w-3 h-3",
    nw: "top-0 left-0 w-3 h-3",
    se: "bottom-0 right-0 w-3 h-3",
    sw: "bottom-0 left-0 w-3 h-3",
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed z-[60] bottom-4"
        style={{ left: pos.x }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-background border-2 border-accent rounded-xl px-4 py-2 gold-shadow flex items-center gap-2 hover:bg-accent/10 transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5 text-accent" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className={cn(
        "fixed z-[60] flex flex-col bg-background border-2 border-accent rounded-2xl gold-shadow overflow-hidden",
        className
      )}
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
      }}
    >
      {/* Title bar - draggable */}
      <div
        onMouseDown={handleDragStart}
        onDoubleClick={toggleMaximize}
        className={cn(
          "flex items-center justify-between px-4 py-2 border-b border-accent/30 cursor-grab active:cursor-grabbing select-none shrink-0",
          headerClassName
        )}
      >
        <h3 className="font-display text-sm font-bold text-foreground truncate">{title}</h3>
        <div className="flex items-center gap-1">
          {minimizable && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMaximize}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">{children}</div>

      {/* Resize handles */}
      {!isMaximized &&
        resizeHandles.map((handle) => (
          <div
            key={handle}
            onMouseDown={(e) => handleResizeStart(e, handle)}
            className={cn("absolute", handleCursors[handle], handleStyles[handle], "z-10")}
          />
        ))}
    </motion.div>
  );
}
