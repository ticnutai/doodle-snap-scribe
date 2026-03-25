import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, screenshotId, tags, title } = await req.json();

    switch (action) {
      case "auto-tag": {
        // Auto-generate tags based on timestamp
        const now = new Date();
        const autoTags = [
          now.toLocaleDateString("he-IL"),
          now.getHours() < 12 ? "בוקר" : now.getHours() < 18 ? "צהריים" : "ערב",
        ];

        const { error } = await supabase
          .from("screenshots")
          .update({ tags: autoTags, updated_at: new Date().toISOString() })
          .eq("id", screenshotId)
          .eq("user_id", user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ tags: autoTags }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update-tags": {
        const { error } = await supabase
          .from("screenshots")
          .update({ tags, updated_at: new Date().toISOString() })
          .eq("id", screenshotId)
          .eq("user_id", user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "rename": {
        const { error } = await supabase
          .from("screenshots")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", screenshotId)
          .eq("user_id", user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "stats": {
        const { data, error } = await supabase
          .from("screenshots")
          .select("id, file_size, created_at")
          .eq("user_id", user.id);

        if (error) throw error;

        const totalSize = data?.reduce((sum, s) => sum + (s.file_size || 0), 0) || 0;
        const count = data?.length || 0;

        return new Response(
          JSON.stringify({ count, totalSize, formattedSize: formatBytes(totalSize) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
