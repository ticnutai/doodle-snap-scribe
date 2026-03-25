import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Trash2,
  Search,
  Pin,
  ZoomIn,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Screenshot } from "@/hooks/useScreenCapture";
import { cn } from "@/lib/utils";

interface GalleryPanelProps {
  screenshots: Screenshot[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (screenshot: Screenshot) => void;
  onPin: (screenshot: Screenshot) => void;
}

export function GalleryPanel({
  screenshots,
  onClose,
  onDelete,
  onDownload,
  onPin,
}: GalleryPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = screenshots.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const selected = screenshots.find((s) => s.id === selectedId);

  const copyToClipboard = async (screenshot: Screenshot) => {
    try {
      const res = await fetch(screenshot.dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border-2 border-accent rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col gold-shadow overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-accent/30 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              גלריה חכמה
            </h2>
            <p className="text-sm text-muted-foreground">
              {screenshots.length} צילומים
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-foreground hover:bg-accent/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-accent/10">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש צילומים..."
              className="pr-10 border-accent/30 text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Grid or selected view */}
        <div className="flex-1 overflow-auto p-4">
          {selectedId && selected ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedId(null)}
                className="text-foreground"
              >
                ← חזרה לגלריה
              </Button>
              <div className="border-2 border-accent rounded-xl overflow-hidden">
                <img
                  src={selected.dataUrl}
                  alt={selected.title}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(selected)}
                  className="border-accent text-foreground gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  הורד
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(selected)}
                  className="border-accent text-foreground gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  העתק
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPin(selected)}
                  className="border-accent text-foreground gap-1"
                >
                  <Pin className="h-3.5 w-3.5" />
                  נעץ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onDelete(selected.id);
                    setSelectedId(null);
                  }}
                  className="border-destructive text-destructive gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  מחק
                </Button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
              <ZoomIn className="h-12 w-12 mb-3 text-accent/50" />
              <p className="font-display text-lg">אין צילומים עדיין</p>
              <p className="text-sm">צלם מסך כדי להתחיל</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((screenshot) => (
                <motion.div
                  key={screenshot.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative border-2 border-accent/30 rounded-xl overflow-hidden cursor-pointer hover:border-accent transition-colors"
                  onClick={() => setSelectedId(screenshot.id)}
                >
                  <img
                    src={screenshot.dataUrl}
                    alt={screenshot.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {screenshot.title}
                      </p>
                      <p className="text-white/70 text-xs">
                        {screenshot.timestamp.toLocaleTimeString("he-IL")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
