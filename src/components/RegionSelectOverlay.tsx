import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Crop, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegionSelectOverlayProps {
  screenshotDataUrl: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function RegionSelectOverlay({
  screenshotDataUrl,
  onCrop,
  onCancel,
}: RegionSelectOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);

  // Load screenshot image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawCanvas(img, null);
    };
    img.src = screenshotDataUrl;
  }, [screenshotDataUrl]);

  const drawCanvas = useCallback(
    (img: HTMLImageElement, sel: { x: number; y: number; w: number; h: number } | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      // Draw screenshot scaled to fit
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (canvas.width - drawW) / 2;
      const offsetY = (canvas.height - drawH) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      if (sel) {
        // Dim everything outside selection
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        // Top
        ctx.fillRect(0, 0, canvas.width, sel.y);
        // Bottom
        ctx.fillRect(0, sel.y + sel.h, canvas.width, canvas.height - sel.y - sel.h);
        // Left
        ctx.fillRect(0, sel.y, sel.x, sel.h);
        // Right
        ctx.fillRect(sel.x + sel.w, sel.y, canvas.width - sel.x - sel.w, sel.h);

        // Selection border
        ctx.strokeStyle = "hsl(43, 74%, 49%)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
        ctx.setLineDash([]);

        // Corner handles
        const handleSize = 8;
        ctx.fillStyle = "hsl(43, 74%, 49%)";
        const corners = [
          [sel.x, sel.y],
          [sel.x + sel.w, sel.y],
          [sel.x, sel.y + sel.h],
          [sel.x + sel.w, sel.y + sel.h],
        ];
        corners.forEach(([cx, cy]) => {
          ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
        });

        // Size label
        const img2 = imgRef.current!;
        const sc = Math.min(canvas.width / img2.width, canvas.height / img2.height);
        const realW = Math.round(sel.w / sc);
        const realH = Math.round(sel.h / sc);
        const label = `${realW} × ${realH}`;
        ctx.font = '13px "DM Sans", sans-serif';
        ctx.fillStyle = "hsl(43, 74%, 49%)";
        const metrics = ctx.measureText(label);
        const labelX = sel.x + sel.w / 2 - metrics.width / 2;
        const labelY = sel.y - 8;
        ctx.fillStyle = "hsl(220, 60%, 20%)";
        ctx.fillRect(labelX - 6, labelY - 14, metrics.width + 12, 20);
        ctx.fillStyle = "hsl(43, 74%, 49%)";
        ctx.fillText(label, labelX, labelY);
      }
    },
    []
  );

  const getSelection = () => {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    return { x, y, w, h };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsSelecting(true);
    setHasSelection(false);
    const rect = canvasRef.current!.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setStart(p);
    setEnd(p);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setEnd(p);

    if (imgRef.current) {
      const sel = {
        x: Math.min(start.x, p.x),
        y: Math.min(start.y, p.y),
        w: Math.abs(p.x - start.x),
        h: Math.abs(p.y - start.y),
      };
      drawCanvas(imgRef.current, sel);
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    const sel = getSelection();
    if (sel.w > 10 && sel.h > 10) {
      setHasSelection(true);
    }
  };

  const handleCrop = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const sel = getSelection();
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const offsetX = (canvas.width - img.width * scale) / 2;
    const offsetY = (canvas.height - img.height * scale) / 2;

    // Convert screen coords to image coords
    const srcX = (sel.x - offsetX) / scale;
    const srcY = (sel.y - offsetY) / scale;
    const srcW = sel.w / scale;
    const srcH = sel.h / scale;

    // Clamp to image bounds
    const clampedX = Math.max(0, srcX);
    const clampedY = Math.max(0, srcY);
    const clampedW = Math.min(img.width - clampedX, srcW);
    const clampedH = Math.min(img.height - clampedY, srcH);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = clampedW;
    cropCanvas.height = clampedH;
    const cropCtx = cropCanvas.getContext("2d")!;
    cropCtx.drawImage(img, clampedX, clampedY, clampedW, clampedH, 0, 0, clampedW, clampedH);

    onCrop(cropCanvas.toDataURL("image/png"));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && hasSelection) handleCrop();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasSelection, onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Instructions / Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110]"
      >
        <div className="bg-background border-2 border-accent rounded-2xl p-3 gold-shadow flex items-center gap-3">
          {!hasSelection ? (
            <p className="text-sm text-muted-foreground px-3">
              גרור כדי לבחור אזור לצילום
            </p>
          ) : (
            <Button
              onClick={handleCrop}
              className="gold-gradient text-primary-foreground border-0 h-9 px-4 font-semibold gap-2"
            >
              <Crop className="h-4 w-4" />
              חתוך וצלם (Enter)
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-9 w-9 text-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
