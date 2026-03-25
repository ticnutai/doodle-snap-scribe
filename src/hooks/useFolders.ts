import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Folder = Tables<"folders">;

export function useFolders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ["folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createFolder = useCallback(
    async (name: string, color?: string) => {
      if (!user) return;
      const { error } = await supabase.from("folders").insert({
        user_id: user.id,
        name,
        color: color || "hsl(43, 74%, 49%)",
        sort_order: folders.length,
      });
      if (error) {
        toast.error("שגיאה ביצירת תיקיה");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success(`תיקיה "${name}" נוצרה`);
    },
    [user, folders.length, queryClient]
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      await supabase.from("folders").update({ name }).eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    [queryClient]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      await supabase.from("folders").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["screenshots"] });
      toast.success("תיקיה נמחקה");
    },
    [queryClient]
  );

  const updateFolderColor = useCallback(
    async (id: string, color: string) => {
      await supabase.from("folders").update({ color }).eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    [queryClient]
  );

  return { folders, createFolder, renameFolder, deleteFolder, updateFolderColor };
}
