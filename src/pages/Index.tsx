import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { MainPanel } from "@/components/MainPanel";
import { AnnotateOverlay } from "@/components/AnnotateOverlay";
import { PinnedScreenshot } from "@/components/PinnedScreenshot";
import { TimerOverlay } from "@/components/TimerOverlay";
import { RegionSelectOverlay } from "@/components/RegionSelectOverlay";
import { useScreenCapture, Screenshot } from "@/hooks/useScreenCapture";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, signOut } = useAuth();
  const {
    screenshots,
    isCapturing,
    captureScreen,
    captureRegion,
    saveCroppedRegion,
    deleteScreenshot,
    downloadScreenshot,
    togglePin,
    saveAnnotation,
    moveToFolder,
    reorderScreenshots,
  } = useScreenCapture();

  const [showAnnotate, setShowAnnotate] = useState(false);
  const [localPinned, setLocalPinned] = useState<Screenshot[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [regionScreenshot, setRegionScreenshot] = useState<string | null>(null);

  const handleAnnotateCapture = useCallback(
    (dataUrl: string) => {
      saveAnnotation(dataUrl);
    },
    [saveAnnotation]
  );

  const handleTimerCapture = useCallback((seconds: number) => {
    setTimerSeconds(seconds);
  }, []);

  const handleTimerComplete = useCallback(() => {
    setTimerSeconds(null);
    captureScreen();
  }, [captureScreen]);

  const handleRegionCapture = useCallback(async () => {
    const dataUrl = await captureRegion();
    if (dataUrl) {
      setRegionScreenshot(dataUrl);
    }
  }, [captureRegion]);

  const handleRegionCrop = useCallback(
    (croppedDataUrl: string) => {
      saveCroppedRegion(croppedDataUrl);
      setRegionScreenshot(null);
    },
    [saveCroppedRegion]
  );

  const handlePin = useCallback((screenshot: Screenshot) => {
    setLocalPinned((prev) => {
      if (prev.find((s) => s.id === screenshot.id)) return prev;
      return [...prev, screenshot];
    });
    togglePin(screenshot.id);
  }, [togglePin]);

  const handleUnpin = useCallback((id: string) => {
    setLocalPinned((prev) => prev.filter((s) => s.id !== id));
    togglePin(id);
  }, [togglePin]);

  const handleCopy = useCallback(async (screenshot: Screenshot) => {
    try {
      const res = await fetch(screenshot.dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, []);

  return (
    <div className="h-screen bg-background overflow-hidden" dir="rtl">
      {/* Main Panel - always visible */}
      <MainPanel
        screenshots={screenshots}
        onCapture={captureScreen}
        onRegionCapture={handleRegionCapture}
        onAnnotateMode={() => setShowAnnotate(true)}
        onTimerCapture={handleTimerCapture}
        onDelete={deleteScreenshot}
        onDownload={downloadScreenshot}
        onPin={handlePin}
        onCopy={handleCopy}
        isCapturing={isCapturing}
        onSignOut={signOut}
      />

      {/* Overlays */}
      <AnimatePresence>
        {showAnnotate && (
          <AnnotateOverlay
            onCapture={handleAnnotateCapture}
            onClose={() => setShowAnnotate(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {timerSeconds !== null && (
          <TimerOverlay seconds={timerSeconds} onComplete={handleTimerComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {regionScreenshot && (
          <RegionSelectOverlay
            screenshotDataUrl={regionScreenshot}
            onCrop={handleRegionCrop}
            onCancel={() => setRegionScreenshot(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {localPinned.map((s) => (
          <PinnedScreenshot
            key={s.id}
            screenshot={s}
            onUnpin={() => handleUnpin(s.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Index;
