import { useState, useRef, useCallback } from "react";

export type AnnotationTool = "pen" | "arrow" | "rectangle" | "circle" | "line" | "highlighter" | "text" | "eraser";

export interface AnnotationState {
  tool: AnnotationTool;
  color: string;
  lineWidth: number;
  isDrawing: boolean;
  undoCount: number;
  redoCount: number;
}

export function useAnnotation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<AnnotationState>({
    tool: "pen",
    color: "hsl(220, 60%, 20%)",
    lineWidth: 3,
    isDrawing: false,
    undoCount: 0,
    redoCount: 0,
  });
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);
  const MAX_HISTORY = 50;

  const updateCounts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      undoCount: undoStack.current.length,
      redoCount: redoStack.current.length,
    }));
  }, []);

  const setTool = useCallback((tool: AnnotationTool) => {
    setState((prev) => ({ ...prev, tool }));
  }, []);

  const setColor = useCallback((color: string) => {
    setState((prev) => ({ ...prev, color }));
  }, []);

  const setLineWidth = useCallback((lineWidth: number) => {
    setState((prev) => ({ ...prev, lineWidth }));
  }, []);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const saveToUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(imageData);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    // New action clears redo stack
    redoStack.current = [];
    updateCounts();
  }, [updateCounts]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.current.length === 0) return;
    const ctx = canvas.getContext("2d")!;

    // Save current state to redo stack
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoStack.current.push(currentState);

    // Restore previous state
    const prev = undoStack.current.pop()!;
    ctx.putImageData(prev, 0, 0);
    updateCounts();
  }, [updateCounts]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || redoStack.current.length === 0) return;
    const ctx = canvas.getContext("2d")!;

    // Save current state to undo stack
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(currentState);

    // Restore redo state
    const next = redoStack.current.pop()!;
    ctx.putImageData(next, 0, 0);
    updateCounts();
  }, [updateCounts]);

  const clearPreview = useCallback(() => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const ctx = preview.getContext("2d")!;
    ctx.clearRect(0, 0, preview.width, preview.height);
  }, []);

  const drawShape = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      tool: AnnotationTool,
      start: { x: number; y: number },
      end: { x: number; y: number },
      color: string,
      lineWidth: number
    ) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (tool === "arrow") {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = Math.max(15, lineWidth * 5);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLen * Math.cos(angle - Math.PI / 6),
          end.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          end.x - headLen * Math.cos(angle + Math.PI / 6),
          end.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else if (tool === "rectangle") {
        ctx.beginPath();
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        ctx.stroke();
      } else if (tool === "circle") {
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = start.x + (end.x - start.x) / 2;
        const cy = start.y + (end.y - start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);
      startPoint.current = point;
      setState((prev) => ({ ...prev, isDrawing: true }));

      saveToUndo();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      if (state.tool === "pen" || state.tool === "eraser" || state.tool === "highlighter") {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
      }
    },
    [getCanvasPoint, state.tool, saveToUndo]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!state.isDrawing || !startPoint.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const point = getCanvasPoint(e);

      if (state.tool === "pen") {
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      } else if (state.tool === "highlighter") {
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lineWidth * 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.3;
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (state.tool === "eraser") {
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = state.lineWidth * 4;
        ctx.lineCap = "round";
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      } else if (
        state.tool === "arrow" ||
        state.tool === "rectangle" ||
        state.tool === "circle" ||
        state.tool === "line"
      ) {
        const preview = previewCanvasRef.current;
        if (!preview) return;
        const pCtx = preview.getContext("2d")!;
        pCtx.clearRect(0, 0, preview.width, preview.height);
        drawShape(pCtx, state.tool, startPoint.current, point, state.color, state.lineWidth);
      }
    },
    [state, getCanvasPoint, drawShape]
  );

  const stopDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !state.isDrawing || !startPoint.current) return;
      const ctx = canvas.getContext("2d")!;
      const point = getCanvasPoint(e);

      if (
        state.tool === "arrow" ||
        state.tool === "rectangle" ||
        state.tool === "circle" ||
        state.tool === "line"
      ) {
        drawShape(ctx, state.tool, startPoint.current, point, state.color, state.lineWidth);
        clearPreview();
      }

      setState((prev) => ({ ...prev, isDrawing: false }));
      startPoint.current = null;
    },
    [state, getCanvasPoint, drawShape, clearPreview]
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveToUndo();
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearPreview();
  }, [saveToUndo, clearPreview]);

  const getCanvasDataUrl = useCallback(() => {
    return canvasRef.current?.toDataURL("image/png") || null;
  }, []);

  return {
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
  };
}
