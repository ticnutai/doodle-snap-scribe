import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { AnnotateOverlay } from "@/components/AnnotateOverlay";
import { GalleryPanel } from "@/components/GalleryPanel";
import { PinnedScreenshot } from "@/components/PinnedScreenshot";
import { TimerOverlay } from "@/components/TimerOverlay";
import { useScreenCapture, Screenshot } from "@/hooks/useScreenCapture";
import { Camera, Sparkles, PenTool, Image as ImageIcon, Pin } from "lucide-react";

const Index = () => {
  const {
    screenshots,
    isCapturing,
    captureScreen,
    deleteScreenshot,
    downloadScreenshot,
  } = useScreenCapture();

  const [showAnnotate, setShowAnnotate] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [pinnedScreenshots, setPinnedScreenshots] = useState<Screenshot[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  const handleAnnotateCapture = useCallback(
    (dataUrl: string) => {
      // The annotation itself is saved as a screenshot
      const newScreenshot: Screenshot = {
        id: crypto.randomUUID(),
        dataUrl,
        timestamp: new Date(),
        title: `Annotation ${screenshots.length + 1}`,
        tags: ["annotation"],
      };
      // We add it via a workaround - for now just download
      downloadScreenshot(newScreenshot);
    },
    [screenshots.length, downloadScreenshot]
  );

  const handleTimerCapture = useCallback(
    (seconds: number) => {
      setTimerSeconds(seconds);
    },
    []
  );

  const handleTimerComplete = useCallback(() => {
    setTimerSeconds(null);
    captureScreen();
  }, [captureScreen]);

  const handlePin = useCallback((screenshot: Screenshot) => {
    setPinnedScreenshots((prev) => {
      if (prev.find((s) => s.id === screenshot.id)) return prev;
      return [...prev, screenshot];
    });
  }, []);

  const handleUnpin = useCallback((id: string) => {
    setPinnedScreenshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir="rtl">
      {/* Floating Sidebar */}
      <FloatingSidebar
        onCapture={captureScreen}
        onAnnotateMode={() => setShowAnnotate(true)}
        onGalleryOpen={() => setShowGallery(true)}
        onTimerCapture={handleTimerCapture}
        isCapturing={isCapturing}
        screenshotCount={screenshots.length}
      />

      {/* Main Content - Welcome */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-2xl text-center space-y-8">
          {/* Logo */}
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

          {/* Feature cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {[
              { icon: Camera, title: "צילום מהיר", desc: "צלם בלחיצה" },
              { icon: PenTool, title: "סמן וצלם", desc: "ציור לפני צילום" },
              { icon: ImageIcon, title: "גלריה חכמה", desc: "נהל צילומים" },
              { icon: Pin, title: "נעיצה", desc: "תצוגה צפה" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-4 rounded-xl border-2 border-accent/30 bg-background hover:border-accent transition-colors gold-shadow/30 group"
              >
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Hint */}
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
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {timerSeconds !== null && (
          <TimerOverlay
            seconds={timerSeconds}
            onComplete={handleTimerComplete}
          />
        )}
      </AnimatePresence>

      {/* Pinned Screenshots */}
      <AnimatePresence>
        {pinnedScreenshots.map((s) => (
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
