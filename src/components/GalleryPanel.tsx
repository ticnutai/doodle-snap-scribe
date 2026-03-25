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
  FolderPlus,
  Folder,
  FolderOpen,
  Pencil,
  FolderInput,
  Palette,
  GripVertical,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Screenshot } from "@/hooks/useScreenCapture";
import { useFolders, type Folder as FolderType } from "@/hooks/useFolders";
import { cn } from "@/lib/utils";

interface GalleryPanelProps {
  screenshots: Screenshot[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (screenshot: Screenshot) => void;
  onPin: (screenshot: Screenshot) => void;
  onMoveToFolder: (screenshotId: string, folderId: string | null) => void;
  onReorder: (reorderedIds: { id: string; sortOrder: number; folderId?: string | null }[]) => void;
}

const FOLDER_COLORS = [
  "hsl(43, 74%, 49%)",
  "hsl(0, 84%, 60%)",
  "hsl(210, 100%, 50%)",
  "hsl(142, 76%, 36%)",
  "hsl(280, 70%, 50%)",
  "hsl(25, 90%, 55%)",
];

export function GalleryPanel({
  screenshots,
  onClose,
  onDelete,
  onDownload,
  onPin,
  onMoveToFolder,
  onReorder,
}: GalleryPanelProps) {
  const { folders, createFolder, renameFolder, deleteFolder, updateFolderColor } = useFolders();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [movingScreenshotId, setMovingScreenshotId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const filtered = screenshots.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeFolder === null) return true;
    if (activeFolder === "uncategorized") return !s.folderId;
    return s.folderId === activeFolder;
  });

  const selected = screenshots.find((s) => s.id === selectedId);

  const copyToClipboard = async (screenshot: Screenshot) => {
    try {
      const res = await fetch(screenshot.dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const handleRenameFolder = (id: string) => {
    if (!editingFolderName.trim()) return;
    renameFolder(id, editingFolderName.trim());
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const getFolderCount = (folderId: string | null) => {
    if (folderId === null) return screenshots.length;
    if (folderId === "uncategorized") return screenshots.filter((s) => !s.folderId).length;
    return screenshots.filter((s) => s.folderId === folderId).length;
  };

  const getActiveFolderName = () => {
    if (activeFolder === null) return "הכל";
    if (activeFolder === "uncategorized") return "ללא תיקיה";
    return folders.find((f) => f.id === activeFolder)?.name || "";
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Dropped on a folder droppable in the sidebar
    if (destination.droppableId.startsWith("folder-drop-")) {
      const targetFolderId = destination.droppableId.replace("folder-drop-", "");
      const folderId = targetFolderId === "uncategorized" ? null : targetFolderId;
      onMoveToFolder(draggableId, folderId);
      return;
    }

    // Reorder within the grid
    if (source.droppableId === "screenshot-grid" && destination.droppableId === "screenshot-grid") {
      if (source.index === destination.index) return;
      const reordered = Array.from(filtered);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      const updates = reordered.map((s, i) => ({ id: s.id, sortOrder: i }));
      onReorder(updates);
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
        className="bg-background border-2 border-accent rounded-2xl w-full max-w-5xl max-h-[85vh] flex gold-shadow overflow-hidden"
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Sidebar - Folders */}
          <div className="w-56 border-l border-accent/30 flex flex-col shrink-0 bg-secondary/30">
            <div className="p-3 border-b border-accent/20">
              <h3 className="font-display text-sm font-bold text-foreground mb-2">תיקיות</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolder(true)}
                className="w-full border-accent/30 text-foreground gap-1 text-xs"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                תיקיה חדשה
              </Button>
            </div>

            {/* New folder input */}
            <AnimatePresence>
              {showNewFolder && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-accent/10"
                >
                  <div className="p-2 flex gap-1">
                    <Input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                      placeholder="שם תיקיה..."
                      className="h-7 text-xs border-accent/30 text-right"
                      dir="rtl"
                    />
                    <Button size="sm" onClick={handleCreateFolder} className="gold-gradient text-primary-foreground border-0 h-7 px-2 text-xs">
                      ✓
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)} className="h-7 px-2 text-xs">
                      ✕
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Folder list - each is a droppable target */}
            <div className="flex-1 overflow-auto p-1.5 space-y-0.5">
              <Droppable droppableId="folder-drop-uncategorized" isDropDisabled={false}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "rounded-lg transition-colors",
                      snapshot.isDraggingOver && "bg-accent/20 ring-2 ring-accent/40"
                    )}
                  >
                    <FolderItem
                      name="הכל"
                      count={getFolderCount(null)}
                      isActive={activeFolder === null}
                      onClick={() => setActiveFolder(null)}
                      color="hsl(43, 74%, 49%)"
                      icon="all"
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {folders.length > 0 && <div className="h-px bg-accent/15 my-1.5" />}

              {folders.map((folder) => (
                <Droppable key={folder.id} droppableId={`folder-drop-${folder.id}`} isDropDisabled={false}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "relative group rounded-lg transition-colors",
                        snapshot.isDraggingOver && "bg-accent/20 ring-2 ring-accent/40"
                      )}
                    >
                      {editingFolderId === folder.id ? (
                        <div className="flex gap-1 p-1">
                          <Input
                            autoFocus
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(folder.id)}
                            className="h-7 text-xs border-accent/30 text-right"
                            dir="rtl"
                          />
                          <Button size="sm" onClick={() => handleRenameFolder(folder.id)} className="gold-gradient text-primary-foreground border-0 h-7 px-2 text-xs">
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <FolderItem
                          name={folder.name}
                          count={getFolderCount(folder.id)}
                          isActive={activeFolder === folder.id}
                          onClick={() => setActiveFolder(folder.id)}
                          color={folder.color || "hsl(43, 74%, 49%)"}
                          onEdit={() => {
                            setEditingFolderId(folder.id);
                            setEditingFolderName(folder.name);
                          }}
                          onDelete={() => deleteFolder(folder.id)}
                          onColorClick={() => setShowColorPicker(showColorPicker === folder.id ? null : folder.id)}
                          isDragOver={snapshot.isDraggingOver}
                        />
                      )}

                      {/* Color picker */}
                      <AnimatePresence>
                        {showColorPicker === folder.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex gap-1 px-3 py-1.5">
                              {FOLDER_COLORS.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => {
                                    updateFolderColor(folder.id, c);
                                    setShowColorPicker(null);
                                  }}
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                                    folder.color === c ? "border-foreground scale-110" : "border-transparent"
                                  )}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="p-4 border-b border-accent/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {getActiveFolderName()}
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({filtered.length} צילומים)
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-foreground hover:bg-accent/10">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-accent/10">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חפש צילומים..."
                  className="pr-10 border-accent/30 text-right h-9"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {selectedId && selected ? (
                <ScreenshotDetail
                  selected={selected}
                  folders={folders}
                  movingScreenshotId={movingScreenshotId}
                  onBack={() => setSelectedId(null)}
                  onDownload={onDownload}
                  onCopy={copyToClipboard}
                  onPin={onPin}
                  onMove={() => setMovingScreenshotId(selected.id)}
                  onDelete={() => { onDelete(selected.id); setSelectedId(null); }}
                  onMoveToFolder={(folderId) => { onMoveToFolder(selected.id, folderId); setMovingScreenshotId(null); }}
                  onCloseMove={() => setMovingScreenshotId(null)}
                />
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                  <ZoomIn className="h-12 w-12 mb-3 text-accent/50" />
                  <p className="font-display text-lg">
                    {activeFolder ? "אין צילומים בתיקיה זו" : "אין צילומים עדיין"}
                  </p>
                  <p className="text-sm">צלם מסך כדי להתחיל</p>
                </div>
              ) : (
                <Droppable droppableId="screenshot-grid" direction="horizontal">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid grid-cols-2 md:grid-cols-3 gap-3"
                    >
                      {filtered.map((screenshot, index) => {
                        const folder = folders.find((f) => f.id === screenshot.folderId);
                        return (
                          <Draggable key={screenshot.id} draggableId={screenshot.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={cn(
                                  "group relative border-2 border-accent/30 rounded-xl overflow-hidden cursor-pointer hover:border-accent transition-colors",
                                  dragSnapshot.isDragging && "ring-2 ring-accent shadow-lg opacity-90 z-50"
                                )}
                                onClick={() => !dragSnapshot.isDragging && setSelectedId(screenshot.id)}
                              >
                                {/* Drag handle */}
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="absolute top-2 left-2 z-10 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <img src={screenshot.dataUrl} alt={screenshot.title} className="w-full aspect-video object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                  <div className="w-full">
                                    <p className="text-white text-sm font-semibold">{screenshot.title}</p>
                                    <div className="flex items-center justify-between">
                                      <p className="text-white/70 text-xs">
                                        {screenshot.timestamp.toLocaleTimeString("he-IL")}
                                      </p>
                                      {folder && (
                                        <span
                                          className="text-xs px-1.5 py-0.5 rounded-md text-white/90"
                                          style={{ backgroundColor: (folder.color || "hsl(43,74%,49%)") + "80" }}
                                        >
                                          {folder.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          </div>
        </DragDropContext>
      </motion.div>
    </motion.div>
  );
}

/* ── Detail view ── */
function ScreenshotDetail({
  selected,
  folders,
  movingScreenshotId,
  onBack,
  onDownload,
  onCopy,
  onPin,
  onMove,
  onDelete,
  onMoveToFolder,
  onCloseMove,
}: {
  selected: Screenshot;
  folders: FolderType[];
  movingScreenshotId: string | null;
  onBack: () => void;
  onDownload: (s: Screenshot) => void;
  onCopy: (s: Screenshot) => void;
  onPin: (s: Screenshot) => void;
  onMove: () => void;
  onDelete: () => void;
  onMoveToFolder: (folderId: string | null) => void;
  onCloseMove: () => void;
}) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-foreground">
        ← חזרה לגלריה
      </Button>
      <div className="border-2 border-accent rounded-xl overflow-hidden">
        <img src={selected.dataUrl} alt={selected.title} className="w-full" />
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        <Button variant="outline" size="sm" onClick={() => onDownload(selected)} className="border-accent text-foreground gap-1">
          <Download className="h-3.5 w-3.5" /> הורד
        </Button>
        <Button variant="outline" size="sm" onClick={() => onCopy(selected)} className="border-accent text-foreground gap-1">
          <Copy className="h-3.5 w-3.5" /> העתק
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPin(selected)} className="border-accent text-foreground gap-1">
          <Pin className="h-3.5 w-3.5" /> נעץ
        </Button>
        <Button variant="outline" size="sm" onClick={onMove} className="border-accent text-foreground gap-1">
          <FolderInput className="h-3.5 w-3.5" /> העבר לתיקיה
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="border-destructive text-destructive gap-1">
          <Trash2 className="h-3.5 w-3.5" /> מחק
        </Button>
      </div>

      <AnimatePresence>
        {movingScreenshotId === selected.id && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-2 border-accent/30 rounded-xl p-3 space-y-1.5"
          >
            <p className="text-xs font-semibold text-muted-foreground mb-2">בחר תיקיה:</p>
            <button
              onClick={() => onMoveToFolder(null)}
              className="w-full text-right px-3 py-1.5 rounded-lg text-sm hover:bg-accent/10 transition-colors flex items-center gap-2"
            >
              <Folder className="h-3.5 w-3.5 text-muted-foreground" /> ללא תיקיה
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => onMoveToFolder(f.id)}
                className={cn(
                  "w-full text-right px-3 py-1.5 rounded-lg text-sm hover:bg-accent/10 transition-colors flex items-center gap-2",
                  selected.folderId === f.id && "bg-accent/10 font-semibold"
                )}
              >
                <Folder className="h-3.5 w-3.5" style={{ color: f.color || undefined }} />
                {f.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Folder sidebar item ── */
function FolderItem({
  name,
  count,
  isActive,
  onClick,
  color,
  icon,
  onEdit,
  onDelete,
  onColorClick,
  isDragOver,
}: {
  name: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color: string;
  icon?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onColorClick?: () => void;
  isDragOver?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-right transition-all text-sm group/item",
        isActive
          ? "bg-accent/15 text-foreground font-semibold"
          : "text-muted-foreground hover:bg-accent/5 hover:text-foreground",
        isDragOver && "bg-accent/25 scale-[1.02]"
      )}
    >
      {icon === "all" ? (
        <FolderOpen className="h-4 w-4 shrink-0" style={{ color }} />
      ) : (
        <Folder className="h-4 w-4 shrink-0" style={{ color }} />
      )}
      <span className="flex-1 truncate">{name}</span>
      <span className="text-xs opacity-60">{count}</span>

      {onEdit && (
        <div className="hidden group-hover/item:flex items-center gap-0.5">
          {onColorClick && (
            <span
              onClick={(e) => { e.stopPropagation(); onColorClick(); }}
              className="p-0.5 rounded hover:bg-accent/20 cursor-pointer"
            >
              <Palette className="h-3 w-3" />
            </span>
          )}
          <span
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-0.5 rounded hover:bg-accent/20 cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-0.5 rounded hover:bg-destructive/20 text-destructive cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
          </span>
        </div>
      )}
    </button>
  );
}
