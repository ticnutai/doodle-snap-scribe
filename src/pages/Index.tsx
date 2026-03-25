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

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-2xl text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gold-gradient gold-shadow">
            <Camera className="h-10 w-10 text-primary-foreground" />
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Screen<span className="text-accent">Craft</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              מערכת צילום מסך מתקדמת עם כלי ציור, גלריה חכמה ויכולת נעיצה
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
            {[
              { icon: Camera, title: "צילום מהיר", desc: "צלם בלחיצה" },
              { icon: Crop, title: "צלם אזור", desc: "בחר אזור ספציפי" },
              { icon: PenTool, title: "סמן וצלם", desc: "ציור לפני צילום" },
              { icon: ImageIcon, title: "גלריה חכמה", desc: "נהל צילומים" },
              { icon: Pin, title: "נעיצה", desc: "תצוגה צפה" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-4 rounded-xl border-2 border-accent/30 bg-background hover:border-accent transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>העבר את העכבר לקצה השמאלי של המסך כדי לפתוח את הסיידבר</span>
          </div>
        </div>
      </div>

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
