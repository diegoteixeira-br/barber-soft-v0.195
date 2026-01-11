import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Secret for validating requests from n8n - loaded from environment variable
const CALLBACK_SECRET = Deno.env.get("N8N_CALLBACK_SECRET");

interface UpdateBody {
  campaign_id: string;
  status: string;
  sent_count?: number;
  failed_count?: number;
  secret: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body: UpdateBody = await req.json();
    const { campaign_id, status, sent_count, failed_count, secret } = body;

    console.log(`Update campaign status: ${campaign_id} -> ${status}`);

    // Validate secret
    if (!CALLBACK_SECRET || secret !== CALLBACK_SECRET) {
      console.error("Invalid or missing callback secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!campaign_id || !status) {
      console.error("Invalid body:", body);
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build update object
    const updateData: Record<string, unknown> = {
      status,
      completed_at: new Date().toISOString(),
    };

    // Only update counts if provided (n8n may provide final counts)
    if (typeof sent_count === "number") {
      updateData.sent_count = sent_count;
    }
    if (typeof failed_count === "number") {
      updateData.failed_count = failed_count;
    }

    const { error: updateError } = await supabase
      .from("marketing_campaigns")
      .update(updateData)
      .eq("id", campaign_id);

    if (updateError) {
      console.error("Error updating campaign:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Failed to update campaign" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Campaign ${campaign_id} updated to ${status}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
