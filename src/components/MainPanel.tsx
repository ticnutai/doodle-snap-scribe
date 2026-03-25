import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  PenTool,
  Crop,
  Timer,
  Star,
  Pin,
  Download,
  Trash2,
  Copy,
  Search,
  FolderPlus,
  Image,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Screenshot } from "@/hooks/useScreenCapture";
import { cn } from "@/lib/utils";

interface MainPanelProps {
  screenshots: Screenshot[];
  onCapture: () => void;
  onRegionCapture: () => void;
  onAnnotateMode: () => void;
  onTimerCapture: (seconds: number) => void;
  onDelete: (id: string) => void;
  onDownload: (screenshot: Screenshot) => void;
  onPin: (screenshot: Screenshot) => void;
  onCopy: (screenshot: Screenshot) => void;
  isCapturing: boolean;
  onSignOut: () => void;
}

export function MainPanel({
  screenshots,
  onCapture,
  onRegionCapture,
  onAnnotateMode,
  onTimerCapture,
  onDelete,
  onDownload,
  onPin,
  onCopy,
  isCapturing,
  onSignOut,
}: MainPanelProps) {
  const [search, setSearch] = useState("");
  const [showTimerOptions, setShowTimerOptions] = useState(false);

  const filtered = screenshots.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed right-0 top-0 h-full w-[320px] z-30 flex flex-col bg-background border-l-2 border-accent" dir="rtl">
      {/* Header */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-lg font-bold text-primary-foreground">ScreenCraft</h1>
          <Camera className="h-4 w-4 text-accent" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            title="התנתק"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Subtitle */}
      <div className="bg-primary/90 px-4 pb-2">
        <p className="text-xs text-primary-foreground/60">מערכת צילום מסך מתקדמת</p>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-accent/30">
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש..."
            className="pr-8 h-8 text-xs border-accent/40 bg-secondary/50"
          />
        </div>
      </div>

      {/* Tool buttons */}
      <div className="px-3 py-2 border-b border-accent/30">
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <ToolButton icon={Camera} label="צלם מסך" onClick={onCapture} disabled={isCapturing} />
          <ToolButton icon={Star} label="מועדפים" onClick={() => {}} />
          <ToolButton icon={FolderPlus} label="תיקיה" onClick={() => {}} />
          <ToolButton icon={Pin} label="נעץ" onClick={() => {}} />
          <ToolButton icon={Crop} label="צלם אזור" onClick={onRegionCapture} disabled={isCapturing} highlight />
          <ToolButton icon={PenTool} label="סמן וצלם" onClick={onAnnotateMode} />
        </div>
        <div className="flex items-center gap-1.5 justify-center mt-1.5">
          <ToolButton icon={Timer} label="טיימר" onClick={() => setShowTimerOptions(!showTimerOptions)} />
          <ToolButton icon={Image} label="גלריה" onClick={() => {}} />
          <ToolButton icon={Settings} label="הגדרות" onClick={() => {}} />
        </div>

        <AnimatePresence>
          {showTimerOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 py-2 justify-center">
                {[3, 5, 10].map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onTimerCapture(s);
                      setShowTimerOptions(false);
                    }}
                    className="flex-1 border-accent text-foreground hover:bg-accent/10 text-xs max-w-[60px]"
                  >
                    {s}s
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Screenshot list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Camera className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">אין צילומים עדיין</p>
            <p className="text-xs mt-1">לחץ על כפתור הצילום להתחיל</p>
          </div>
        ) : (
          filtered.map((screenshot) => (
            <ScreenshotCard
              key={screenshot.id}
              screenshot={screenshot}
              onDelete={onDelete}
              onDownload={onDownload}
              onPin={onPin}
              onCopy={onCopy}
            />
          ))
        )}
      </div>

      {/* Status bar */}
      <div className="bg-primary px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-primary-foreground/70">
          <span>פעיל</span>
          <span className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <span className="text-primary-foreground/70">
          סה"כ: {screenshots.length} פריטים
        </span>
      </div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  highlight,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "h-9 w-9 rounded-full border-accent/50 text-foreground hover:bg-accent/10 hover:border-accent",
        highlight && "gold-gradient text-primary-foreground border-accent",
        disabled && "opacity-50"
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function ScreenshotCard({
  screenshot,
  onDelete,
  onDownload,
  onPin,
  onCopy,
}: {
  screenshot: Screenshot;
  onDelete: (id: string) => void;
  onDownload: (screenshot: Screenshot) => void;
  onPin: (screenshot: Screenshot) => void;
  onCopy: (screenshot: Screenshot) => void;
}) {
  return (
    <div className="border border-accent/30 rounded-lg overflow-hidden bg-card hover:border-accent/60 transition-colors">
      {/* Actions row */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-accent/20 bg-secondary/30">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(screenshot.id)} title="מחק">
          <Trash2 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={() => onPin(screenshot)} title="נעץ">
          <Pin className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={() => onDownload(screenshot)} title="הורד">
          <Download className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={() => onCopy(screenshot)} title="העתק">
          <Copy className="h-3 w-3" />
        </Button>
      </div>

      {/* Thumbnail */}
      <div className="p-2">
        <img
          src={screenshot.dataUrl}
          alt={screenshot.title}
          className="w-full h-auto rounded border border-accent/10"
          loading="lazy"
        />
        <p className="text-xs text-muted-foreground mt-1 truncate">{screenshot.title}</p>
      </div>
    </div>
  );
}
