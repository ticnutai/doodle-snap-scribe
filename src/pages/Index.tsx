import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { AnnotateOverlay } from "@/components/AnnotateOverlay";
import { GalleryPanel } from "@/components/GalleryPanel";
import { PinnedScreenshot } from "@/components/PinnedScreenshot";
import { TimerOverlay } from "@/components/TimerOverlay";
import { RegionSelectOverlay } from "@/components/RegionSelectOverlay";
import { useScreenCapture, Screenshot } from "@/hooks/useScreenCapture";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Sparkles, PenTool, Image as ImageIcon, Pin, Crop, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [showGallery, setShowGallery] = useState(false);
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir="rtl">
      {/* User menu */}
      <div className="fixed top-4 left-4 z-30 flex items-center gap-2">
        <div className="bg-background border-2 border-accent/30 rounded-xl px-3 py-1.5 flex items-center gap-2 gold-shadow">
          <User className="h-4 w-4 text-accent" />
          <span className="text-xs text-foreground font-medium">{user?.email}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="התנתק"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Floating Sidebar */}
      <FloatingSidebar
        onCapture={captureScreen}
        onRegionCapture={handleRegionCapture}
        onAnnotateMode={() => setShowAnnotate(true)}
        onGalleryOpen={() => setShowGallery(true)}
        onTimerCapture={handleTimerCapture}
        isCapturing={isCapturing}
        screenshotCount={screenshots.length}
      />

      {/* Empty workspace */}

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
        {showGallery && (
          <GalleryPanel
            screenshots={screenshots}
            onClose={() => setShowGallery(false)}
            onDelete={deleteScreenshot}
            onDownload={downloadScreenshot}
            onPin={handlePin}
            onMoveToFolder={moveToFolder}
            onReorder={reorderScreenshots}
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
