import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  PenTool,
  Image,
  Pin,
  PinOff,
  Timer,
  Monitor,
  Download,
  Trash2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingSidebarProps {
  onCapture: () => void;
  onAnnotateMode: () => void;
  onGalleryOpen: () => void;
  onTimerCapture: (seconds: number) => void;
  isCapturing: boolean;
  screenshotCount: number;
}

export function FloatingSidebar({
  onCapture,
  onAnnotateMode,
  onGalleryOpen,
  onTimerCapture,
  isCapturing,
  screenshotCount,
}: FloatingSidebarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isPinned) {
      setIsVisible(false);
      setShowTimerOptions(false);
    }
  }, [isPinned]);

  return (
    <>
      {/* Hover trigger zone */}
      <div
        className="fixed left-0 top-0 h-full w-2 z-50"
        onMouseEnter={handleMouseEnter}
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-[280px] z-40 flex flex-col"
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
          >
            {/* Sidebar content */}
            <div className="h-full bg-background border-r-2 border-accent gold-shadow flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-accent/30">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    ScreenCraft
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPinned(!isPinned)}
                    className="text-foreground hover:text-accent hover:bg-accent/10"
                  >
                    {isPinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  מערכת צילום מסך מתקדמת
                </p>
              </div>

              {/* Capture Actions */}
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  צילום מסך
                </p>

                <SidebarButton
                  icon={Camera}
                  label="צלם מסך"
                  sublabel="צילום מיידי"
                  onClick={onCapture}
                  disabled={isCapturing}
                />

                <SidebarButton
                  icon={PenTool}
                  label="סמן וצלם"
                  sublabel="ציור לפני צילום"
                  onClick={onAnnotateMode}
                  highlight
                />

                <SidebarButton
                  icon={Timer}
                  label="צילום עם טיימר"
                  sublabel="השהיה לפני צילום"
                  onClick={() => setShowTimerOptions(!showTimerOptions)}
                />

                <AnimatePresence>
                  {showTimerOptions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 py-2 pr-2 pl-10">
                        {[3, 5, 10].map((s) => (
                          <Button
                            key={s}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onTimerCapture(s);
                              setShowTimerOptions(false);
                            }}
                            className="flex-1 border-accent text-foreground hover:bg-accent/10 text-xs"
                          >
                            {s}s
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Gallery */}
              <div className="p-4 border-t border-accent/30">
                <SidebarButton
                  icon={Image}
                  label="גלריה"
                  sublabel={`${screenshotCount} צילומים`}
                  onClick={onGalleryOpen}
                  badge={screenshotCount > 0 ? screenshotCount : undefined}
                />
              </div>

              {/* Footer */}
              <div className="mt-auto p-4 border-t border-accent/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Monitor className="h-3.5 w-3.5" />
                  <span>העבר עכבר לקצה לפתיחה</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  sublabel,
  onClick,
  disabled,
  highlight,
  badge,
}: {
  icon: any;
  label: string;
  sublabel: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-right",
        "hover:bg-accent/10 group",
        highlight && "bg-accent/5 border border-accent/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          highlight
            ? "gold-gradient text-primary-foreground"
            : "bg-secondary text-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      {badge !== undefined && (
        <span className="gold-gradient text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
