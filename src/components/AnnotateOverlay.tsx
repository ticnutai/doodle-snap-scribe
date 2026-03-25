import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Pen,
  ArrowUpRight,
  Square,
  Type,
  Eraser,
  Undo2,
  X,
  Camera,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAnnotation, AnnotationTool } from "@/hooks/useAnnotation";
import { cn } from "@/lib/utils";
import type { Screenshot } from "@/hooks/useScreenCapture";

interface AnnotateOverlayProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const tools: { id: AnnotationTool; icon: any; label: string }[] = [
  { id: "pen", icon: Pen, label: "עט" },
  { id: "arrow", icon: ArrowUpRight, label: "חץ" },
  { id: "rectangle", icon: Square, label: "מלבן" },
  { id: "text", icon: Type, label: "טקסט" },
  { id: "eraser", icon: Eraser, label: "מחק" },
];

const colors = [
  "hsl(220, 60%, 20%)",
  "hsl(0, 84%, 60%)",
  "hsl(43, 74%, 49%)",
  "hsl(142, 76%, 36%)",
  "hsl(0, 0%, 0%)",
  "hsl(0, 0%, 100%)",
];

export function AnnotateOverlay({ onCapture, onClose }: AnnotateOverlayProps) {
  const {
    canvasRef,
    state,
    setTool,
    setColor,
    setLineWidth,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    getCanvasDataUrl,
  } = useAnnotation();

  const containerRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, [canvasRef]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.tool === "text") {
      const rect = canvasRef.current!.getBoundingClientRect();
      setTextPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const placeText = () => {
    if (!textPos || !textInput || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.fillStyle = state.color;
    ctx.font = `${state.lineWidth * 6}px "DM Sans", sans-serif`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextInput("");
    setTextPos(null);
  };

  const handleCapture = () => {
    const dataUrl = getCanvasDataUrl();
    if (dataUrl) {
      onCapture(dataUrl);
    }
    onClose();
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/20"
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onClick={handleCanvasClick}
      />

      {/* Text input popup */}
      {textPos && (
        <div
          className="absolute z-[110]"
          style={{ left: textPos.x, top: textPos.y - 40 }}
        >
          <div className="flex gap-1 bg-background border-2 border-accent rounded-lg p-1 gold-shadow">
            <input
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && placeText()}
              placeholder="הקלד טקסט..."
              className="px-2 py-1 text-sm bg-transparent text-foreground outline-none w-40"
              dir="rtl"
            />
            <Button size="sm" onClick={placeText} className="gold-gradient text-primary-foreground border-0 h-7">
              ✓
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110]"
      >
        <div className="bg-background border-2 border-accent rounded-2xl p-3 gold-shadow flex items-center gap-3">
          {/* Tools */}
          <div className="flex items-center gap-1">
            {tools.map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant="ghost"
                size="icon"
                onClick={() => setTool(id)}
                title={label}
                className={cn(
                  "h-9 w-9 rounded-lg",
                  state.tool === id
                    ? "gold-gradient text-primary-foreground"
                    : "text-foreground hover:bg-accent/10"
                )}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          <div className="w-px h-8 bg-accent/30" />

          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-transform",
                  state.color === c
                    ? "border-accent scale-125"
                    : "border-transparent hover:scale-110"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-8 bg-accent/30" />

          {/* Line width */}
          <div className="w-20">
            <Slider
              value={[state.lineWidth]}
              min={1}
              max={10}
              step={1}
              onValueChange={([v]) => setLineWidth(v)}
              className="w-full"
            />
          </div>

          <div className="w-px h-8 bg-accent/30" />

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            onClick={clearCanvas}
            className="h-9 w-9 text-foreground hover:bg-accent/10"
            title="נקה הכל"
          >
            <Undo2 className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleCapture}
            className="gold-gradient text-primary-foreground border-0 h-9 px-4 font-semibold gap-2"
          >
            <Camera className="h-4 w-4" />
            צלם
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 text-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
