import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingWindow } from "@/components/FloatingWindow";
import {
  Pen,
  ArrowUpRight,
  Square,
  Type,
  Eraser,
  Undo2,
  Redo2,
  X,
  Camera,
  Circle,
  Minus,
  Highlighter,
  GripHorizontal,
  Minimize2,
  Trash2,
  Save,
  FolderOpen,
  Stamp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useAnnotation, AnnotationTool } from "@/hooks/useAnnotation";
import { useDrawingTemplates } from "@/hooks/useDrawingTemplates";
import { PresetStamps, StampDefinition } from "@/components/PresetStamps";
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
    redo,
    getCanvasDataUrl,
  } = useAnnotation();

  const { templates, saveTemplate, deleteTemplate, loadTemplate } = useDrawingTemplates();

  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showStamps, setShowStamps] = useState(false);
  const [activeStamp, setActiveStamp] = useState<StampDefinition | null>(null);
  const [stampSize, setStampSize] = useState(80);
  const [stampRotation, setStampRotation] = useState(0);

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
      if (e.ctrlKey && e.shiftKey && e.key === "Z") {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        setShowSaveDialog(true);
      }
      if (e.key === "Escape") {
        if (showTemplates) setShowTemplates(false);
        else if (showSaveDialog) setShowSaveDialog(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, onClose, showTemplates, showSaveDialog]);

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

  const handleSelectStamp = useCallback((stamp: StampDefinition) => {
    if (activeStamp?.id === stamp.id) {
      setActiveStamp(null);
    } else {
      setActiveStamp(stamp);
    }
  }, [activeStamp]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeStamp) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Save undo state before placing stamp
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((stampRotation * Math.PI) / 180);
      activeStamp.draw(ctx, 0, 0, stampSize, state.color);
      ctx.restore();
      return;
    }
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

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !canvasRef.current) return;
    saveTemplate(templateName.trim(), canvasRef.current);
    setTemplateName("");
    setShowSaveDialog(false);
  };

  const handleLoadTemplate = (template: Parameters<typeof loadTemplate>[0]) => {
    if (!canvasRef.current) return;
    loadTemplate(template, canvasRef.current);
    setShowTemplates(false);
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
        className={cn("absolute inset-0", activeStamp ? "cursor-copy" : "cursor-crosshair")}
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

      {/* Save template dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <FloatingWindow
            title="שמור כתבנית"
            onClose={() => setShowSaveDialog(false)}
            defaultWidth={320}
            defaultHeight={180}
            minWidth={280}
            minHeight={150}
          >
            <div className="p-4 space-y-3">
              <Input
                autoFocus
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
                placeholder="שם התבנית..."
                className="border-accent/30 text-right"
                dir="rtl"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(false)}>
                  ביטול
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="gold-gradient text-primary-foreground border-0"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  שמור
                </Button>
              </div>
            </div>
          </FloatingWindow>
        )}
      </AnimatePresence>

      {/* Templates panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-4 right-4 z-[115] bg-background border-2 border-accent rounded-2xl p-4 gold-shadow w-72 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold text-foreground">תבניות שמורות</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTemplates(false)}
                className="h-7 w-7 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-2">
              {templates.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Save className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>אין תבניות שמורות</p>
                  <p className="text-xs mt-1">שמור ציור כתבנית עם Ctrl+S</p>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="group border border-accent/30 rounded-xl overflow-hidden hover:border-accent transition-colors cursor-pointer"
                    onClick={() => handleLoadTemplate(template)}
                  >
                    <div className="aspect-video bg-secondary/30 relative">
                      {template.thumbnailUrl && (
                        <img
                          src={template.thumbnailUrl}
                          alt={template.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded-lg">
                          טען תבנית
                        </span>
                      </div>
                    </div>
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs text-foreground font-medium truncate flex-1">{template.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset stamps panel */}
      <PresetStamps
        visible={showStamps}
        onClose={() => setShowStamps(false)}
        onSelectStamp={handleSelectStamp}
        activeStampId={activeStamp?.id || null}
        currentColor={state.color}
      />

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
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={undo}
                      disabled={state.undoCount === 0}
                      className="h-9 w-9 text-foreground hover:bg-accent/10 disabled:opacity-30"
                      title="בטל (Ctrl+Z)"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    {state.undoCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {state.undoCount}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={redo}
                      disabled={state.redoCount === 0}
                      className="h-9 w-9 text-foreground hover:bg-accent/10 disabled:opacity-30"
                      title="בצע שוב (Ctrl+Y / Ctrl+Shift+Z)"
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                    {state.redoCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {state.redoCount}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearCanvas}
                    className="h-9 w-9 text-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="נקה הכל"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-8 bg-accent/30" />

                  {/* Stamps button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setShowStamps(!showStamps); if (!showStamps) setActiveStamp(null); }}
                    className={cn(
                      "h-9 w-9 hover:bg-accent/10",
                      showStamps ? "gold-gradient text-primary-foreground" : "text-foreground"
                    )}
                    title="תבניות מוכנות"
                  >
                    <Stamp className="h-4 w-4" />
                  </Button>

                  {/* Stamp size & rotation sliders (when stamp active) */}
                  {activeStamp && (
                    <>
                      <div className="w-16 flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">גודל</span>
                        <Slider
                          value={[stampSize]}
                          min={30}
                          max={200}
                          step={10}
                          onValueChange={([v]) => setStampSize(v)}
                          className="w-full"
                        />
                      </div>
                      <div className="w-20 flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">סיבוב</span>
                        <Slider
                          value={[stampRotation]}
                          min={0}
                          max={360}
                          step={15}
                          onValueChange={([v]) => setStampRotation(v)}
                          className="w-full"
                        />
                        <span className="text-[10px] text-muted-foreground w-6">{stampRotation}°</span>
                      </div>
                    </>
                  )}

                  <div className="w-px h-8 bg-accent/30" />

                  {/* Template buttons */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSaveDialog(true)}
                    className="h-9 w-9 text-foreground hover:bg-accent/10"
                    title="שמור כתבנית (Ctrl+S)"
                  >
                    <Save className="h-4 w-4" />
                  </Button>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className={cn(
                        "h-9 w-9 hover:bg-accent/10",
                        showTemplates ? "gold-gradient text-primary-foreground" : "text-foreground"
                      )}
                      title="טען תבנית"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    {templates.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {templates.length}
                      </span>
                    )}
                  </div>

                  <div className="w-px h-8 bg-accent/30" />

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
