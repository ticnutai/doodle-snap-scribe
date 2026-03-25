import { useState, useCallback } from "react";

export interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: Date;
  title: string;
  tags: string[];
}

export function useScreenCapture() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureScreen = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" } as any,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      // Wait a frame for video to render
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const dataUrl = canvas.toDataURL("image/png");
      const newScreenshot: Screenshot = {
        id: crypto.randomUUID(),
        dataUrl,
        timestamp: new Date(),
        title: `Screenshot ${screenshots.length + 1}`,
        tags: [],
      };

      setScreenshots((prev) => [newScreenshot, ...prev]);
      return newScreenshot;
    } catch (err) {
      console.error("Screen capture failed:", err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [screenshots.length]);

  const deleteScreenshot = useCallback((id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const downloadScreenshot = useCallback((screenshot: Screenshot) => {
    const link = document.createElement("a");
    link.href = screenshot.dataUrl;
    link.download = `${screenshot.title}.png`;
    link.click();
  }, []);

  return {
    screenshots,
    isCapturing,
    captureScreen,
    deleteScreenshot,
    downloadScreenshot,
  };
}
