import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pen,
  ArrowUpRight,
  Square,
  Type,
  Eraser,
  Undo2,
  X,
  Camera,
  Circle,
  Minus,
  Highlighter,
  GripHorizontal,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAnnotation, AnnotationTool } from "@/hooks/useAnnotation";
import { cn } from "@/lib/utils";

interface AnnotateOverlayProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const tools: { id: AnnotationTool; icon: any; label: string }[] = [
  { id: "pen", icon: Pen, label: "עט" },
  { id: "highlighter", icon: Highlighter, label: "מדגיש" },
  { id: "arrow", icon: ArrowUpRight, label: "חץ" },
  { id: "line", icon: Minus, label: "קו" },
  { id: "rectangle", icon: Square, label: "מלבן" },
  { id: "circle", icon: Circle, label: "עיגול" },
  { id: "text", icon: Type, label: "טקסט" },
  { id: "eraser", icon: Eraser, label: "מחק" },
];

const colors = [
  "hsl(220, 60%, 20%)",
  "hsl(0, 84%, 60%)",
  "hsl(43, 74%, 49%)",
  "hsl(142, 76%, 36%)",
  "hsl(210, 100%, 50%)",
  "hsl(0, 0%, 0%)",
  "hsl(0, 0%, 100%)",
];

export function AnnotateOverlay({ onCapture, onClose }: AnnotateOverlayProps) {
  const {
    canvasRef,
    previewCanvasRef,
    state,
    setTool,
    setColor,
    setLineWidth,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    undo,
    getCanvasDataUrl,
  } = useAnnotation();

  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Toolbar drag state
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingToolbar = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const preview = previewCanvasRef.current;
    if (!canvas || !preview) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    preview.width = window.innerWidth;
    preview.height = window.innerHeight;
  }, [canvasRef, previewCanvasRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, onClose]);

  // Toolbar dragging
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, [role=slider]")) return;
    isDraggingToolbar.current = true;
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const rect = toolbar.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingToolbar.current) return;
      setToolbarPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleUp = () => {
      isDraggingToolbar.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

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
    ctx.font = `${Math.max(state.lineWidth * 6, 16)}px "DM Sans", sans-serif`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextInput("");
    setTextPos(null);
  };

  const handleCapture = () => {
    const dataUrl = getCanvasDataUrl();
    if (dataUrl) onCapture(dataUrl);
    onClose();
  };

  const toolbarStyle: React.CSSProperties = toolbarPos
    ? { position: "fixed", left: toolbarPos.x, top: toolbarPos.y, transform: "none" }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/20"
    >
      {/* Main drawing canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onClick={handleCanvasClick}
      />

      {/* Preview canvas for shapes */}
      <canvas
        ref={previewCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Text input popup */}
      {textPos && (
        <div className="absolute z-[110]" style={{ left: textPos.x, top: textPos.y - 40 }}>
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

      {/* Toolbar - Minimized */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed z-[110]"
            style={
              toolbarPos
                ? { left: toolbarPos.x, top: toolbarPos.y }
                : { bottom: 24, left: "50%", transform: "translateX(-50%)" }
            }
          >
            <button
              onClick={() => setIsMinimized(false)}
              className="w-12 h-12 rounded-full gold-gradient gold-shadow flex items-center justify-center hover:scale-110 transition-transform"
              title="פתח סרגל כלים"
            >
              <Pen className="h-5 w-5 text-primary-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar - Full */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            ref={toolbarRef}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "z-[110]",
              !toolbarPos && "absolute bottom-6 left-1/2 -translate-x-1/2"
            )}
            style={toolbarStyle}
            onMouseDown={handleToolbarMouseDown}
          >
            <div className="bg-background border-2 border-accent rounded-2xl p-3 gold-shadow select-none">
              {/* Drag handle + minimize */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-1 text-muted-foreground cursor-grab active:cursor-grabbing">
                  <GripHorizontal className="h-4 w-4" />
                  <span className="text-xs">גרור כדי להזיז</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="מזער"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {/* Tools */}
                <div className="flex items-center gap-1 flex-wrap max-w-[240px]">
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
                <div className="flex items-center gap-1.5 flex-wrap max-w-[130px]">
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={undo}
                    className="h-9 w-9 text-foreground hover:bg-accent/10"
                    title="בטל (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearCanvas}
                    className="h-9 w-9 text-foreground hover:bg-accent/10"
                    title="נקה הכל"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={handleCapture}
                    className="gold-gradient text-primary-foreground border-0 h-9 px-4 font-semibold gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    צלם
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
