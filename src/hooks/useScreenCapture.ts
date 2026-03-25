import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type ScreenshotRow = Tables<"screenshots">;

export interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: Date;
  title: string;
  tags: string[];
  filePath: string;
  isPinned: boolean;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
  const byteString = atob(parts[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

export function useScreenCapture() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCapturing, setIsCapturing] = useState(false);

  // Fetch screenshots from DB
  const { data: screenshots = [] } = useQuery({
    queryKey: ["screenshots", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("screenshots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get signed URLs for each screenshot
      const results: Screenshot[] = await Promise.all(
        (data || []).map(async (row) => {
          const { data: urlData } = await supabase.storage
            .from("screenshots")
            .createSignedUrl(row.file_path, 3600);

          return {
            id: row.id,
            dataUrl: urlData?.signedUrl || "",
            timestamp: new Date(row.created_at),
            title: row.title,
            tags: row.tags || [],
            filePath: row.file_path,
            isPinned: row.is_pinned || false,
          };
        })
      );

      return results;
    },
    enabled: !!user,
  });

  // Upload & save screenshot
  const saveMutation = useMutation({
    mutationFn: async ({ dataUrl, title }: { dataUrl: string; title: string }) => {
      if (!user) throw new Error("Not authenticated");

      const blob = dataUrlToBlob(dataUrl);
      const fileName = `${user.id}/${crypto.randomUUID()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(fileName, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("screenshots").insert({
        user_id: user.id,
        title,
        file_path: fileName,
        file_size: blob.size,
      });

      if (dbError) throw dbError;

      // Auto-tag via edge function
      try {
        await supabase.functions.invoke("screenshot-manager", {
          body: { action: "auto-tag", screenshotId: "latest" },
        });
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screenshots"] });
      toast.success("צילום מסך נשמר!");
    },
    onError: (err: any) => {
      toast.error("שגיאה בשמירה: " + err.message);
    },
  });

  const captureScreen = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" } as any,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const dataUrl = canvas.toDataURL("image/png");
      const title = `Screenshot ${(screenshots?.length || 0) + 1}`;

      if (user) {
        saveMutation.mutate({ dataUrl, title });
      }

      return { id: crypto.randomUUID(), dataUrl, timestamp: new Date(), title, tags: [], filePath: "", isPinned: false };
    } catch (err) {
      console.error("Screen capture failed:", err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [screenshots?.length, user, saveMutation]);

  const deleteScreenshot = useCallback(
    async (id: string) => {
      const screenshot = screenshots.find((s) => s.id === id);
      if (!screenshot) return;

      if (screenshot.filePath) {
        await supabase.storage.from("screenshots").remove([screenshot.filePath]);
      }
      await supabase.from("screenshots").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["screenshots"] });
      toast.success("צילום נמחק");
    },
    [screenshots, queryClient]
  );

  const downloadScreenshot = useCallback((screenshot: Screenshot) => {
    const link = document.createElement("a");
    link.href = screenshot.dataUrl;
    link.download = `${screenshot.title}.png`;
    link.click();
  }, []);

  const togglePin = useCallback(
    async (id: string) => {
      const screenshot = screenshots.find((s) => s.id === id);
      if (!screenshot) return;
      await supabase
        .from("screenshots")
        .update({ is_pinned: !screenshot.isPinned })
        .eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["screenshots"] });
    },
    [screenshots, queryClient]
  );

  const saveAnnotation = useCallback(
    async (dataUrl: string) => {
      const title = `Annotation ${(screenshots?.length || 0) + 1}`;
      if (user) {
        saveMutation.mutate({ dataUrl, title });
      }
    },
    [screenshots?.length, user, saveMutation]
  );

  return {
    screenshots,
    isCapturing,
    captureScreen,
    deleteScreenshot,
    downloadScreenshot,
    togglePin,
    saveAnnotation,
  };
}
