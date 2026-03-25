import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface DrawingTemplate {
  id: string;
  name: string;
  thumbnailUrl: string;
  canvasUrl: string;
  width: number;
  height: number;
  createdAt: Date;
}

export function useDrawingTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["drawing-templates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("drawing_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const results: DrawingTemplate[] = await Promise.all(
        (data || []).map(async (row) => {
          const { data: canvasUrl } = await supabase.storage
            .from("templates")
            .createSignedUrl(row.canvas_path, 3600);
          const { data: thumbUrl } = row.thumbnail_path
            ? await supabase.storage.from("templates").createSignedUrl(row.thumbnail_path, 3600)
            : { data: null };

          return {
            id: row.id,
            name: row.name,
            thumbnailUrl: thumbUrl?.signedUrl || canvasUrl?.signedUrl || "",
            canvasUrl: canvasUrl?.signedUrl || "",
            width: row.width,
            height: row.height,
            createdAt: new Date(row.created_at),
          };
        })
      );
      return results;
    },
    enabled: !!user,
  });

  const saveTemplate = useCallback(
    async (name: string, canvas: HTMLCanvasElement) => {
      if (!user) return;

      // Full canvas data
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      // Thumbnail (smaller)
      const thumbCanvas = document.createElement("canvas");
      const scale = 200 / Math.max(canvas.width, canvas.height);
      thumbCanvas.width = canvas.width * scale;
      thumbCanvas.height = canvas.height * scale;
      const tCtx = thumbCanvas.getContext("2d")!;
      tCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      const thumbBlob = await new Promise<Blob>((resolve) =>
        thumbCanvas.toBlob((b) => resolve(b!), "image/png")
      );

      const ts = Date.now();
      const canvasPath = `${user.id}/canvas_${ts}.png`;
      const thumbPath = `${user.id}/thumb_${ts}.png`;

      const [canvasUpload, thumbUpload] = await Promise.all([
        supabase.storage.from("templates").upload(canvasPath, blob, { contentType: "image/png" }),
        supabase.storage.from("templates").upload(thumbPath, thumbBlob, { contentType: "image/png" }),
      ]);

      if (canvasUpload.error || thumbUpload.error) {
        toast.error("שגיאה בשמירת התבנית");
        return;
      }

      const { error } = await supabase.from("drawing_templates").insert({
        user_id: user.id,
        name,
        canvas_path: canvasPath,
        thumbnail_path: thumbPath,
        width: canvas.width,
        height: canvas.height,
      });

      if (error) {
        toast.error("שגיאה בשמירת התבנית");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["drawing-templates"] });
      toast.success(`תבנית "${name}" נשמרה`);
    },
    [user, queryClient]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      const template = templates.find((t) => t.id === id);
      if (!template || !user) return;

      // Delete from DB (storage files will remain but that's ok)
      await supabase.from("drawing_templates").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["drawing-templates"] });
      toast.success("תבנית נמחקה");
    },
    [templates, user, queryClient]
  );

  const loadTemplate = useCallback(
    async (template: DrawingTemplate, canvas: HTMLCanvasElement) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        toast.success(`תבנית "${template.name}" נטענה`);
      };
      img.onerror = () => toast.error("שגיאה בטעינת התבנית");
      img.src = template.canvasUrl;
    },
    []
  );

  return { templates, isLoading, saveTemplate, deleteTemplate, loadTemplate };
}
