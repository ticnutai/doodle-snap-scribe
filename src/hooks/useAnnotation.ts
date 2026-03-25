import { useState, useRef, useCallback } from "react";

export type AnnotationTool = "pen" | "arrow" | "rectangle" | "text" | "eraser";

export interface AnnotationState {
  tool: AnnotationTool;
  color: string;
  lineWidth: number;
  isDrawing: boolean;
}

export function useAnnotation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<AnnotationState>({
    tool: "pen",
    color: "hsl(220, 60%, 20%)",
    lineWidth: 3,
    isDrawing: false,
  });
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

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

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);
      lastPoint.current = point;
      setState((prev) => ({ ...prev, isDrawing: true }));

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      if (state.tool === "pen" || state.tool === "eraser") {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
      }
    },
    [getCanvasPoint, state.tool]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!state.isDrawing) return;
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
      } else if (state.tool === "eraser") {
        ctx.strokeStyle = "white";
        ctx.lineWidth = state.lineWidth * 4;
        ctx.lineCap = "round";
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }

      lastPoint.current = point;
    },
    [state, getCanvasPoint]
  );

  const stopDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !state.isDrawing) return;
      const ctx = canvas.getContext("2d")!;
      const point = getCanvasPoint(e);

      if (state.tool === "arrow" && lastPoint.current) {
        const start = lastPoint.current;
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lineWidth;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(point.y - start.y, point.x - start.x);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
          point.x - headLen * Math.cos(angle - Math.PI / 6),
          point.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
          point.x - headLen * Math.cos(angle + Math.PI / 6),
          point.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (state.tool === "rectangle" && lastPoint.current) {
        const start = lastPoint.current;
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lineWidth;
        ctx.strokeRect(
          start.x,
          start.y,
          point.x - start.x,
          point.y - start.y
        );
      }

      setState((prev) => ({ ...prev, isDrawing: false }));
      lastPoint.current = null;
    },
    [state, getCanvasPoint]
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCanvasDataUrl = useCallback(() => {
    return canvasRef.current?.toDataURL("image/png") || null;
  }, []);

  return {
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
  };
}
