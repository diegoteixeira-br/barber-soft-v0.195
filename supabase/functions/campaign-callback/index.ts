import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Secret for validating requests from n8n - loaded from environment variable
const CALLBACK_SECRET = Deno.env.get("N8N_CALLBACK_SECRET");

interface CallbackBody {
  log_id: string;
  campaign_id: string;
  status: "sent" | "failed";
  error_message?: string;
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

    const body: CallbackBody = await req.json();
    const { log_id, campaign_id, status, error_message, secret } = body;

    console.log(`Callback received for log ${log_id}, status: ${status}`);

    // Validate secret
    if (!CALLBACK_SECRET || secret !== CALLBACK_SECRET) {
      console.error("Invalid or missing callback secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!log_id || !campaign_id || !status) {
      console.error("Invalid callback body:", body);
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update individual message log
    const { error: logError } = await supabase
      .from("campaign_message_logs")
      .update({
        status,
        error_message: error_message || null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", log_id);

    if (logError) {
      console.error("Error updating log:", logError.message);
      return new Response(
        JSON.stringify({ error: "Failed to update log" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update campaign counters using RPC
    if (status === "sent") {
      const { error: rpcError } = await supabase.rpc("increment_campaign_sent", { cid: campaign_id });
      if (rpcError) {
        console.error("Error incrementing sent count:", rpcError.message);
      }
    } else {
      const { error: rpcError } = await supabase.rpc("increment_campaign_failed", { cid: campaign_id });
      if (rpcError) {
        console.error("Error incrementing failed count:", rpcError.message);
      }
    }

    console.log(`Log ${log_id} updated to ${status}`);

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
