import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Secret for validating requests from n8n - loaded from environment variable
const CALLBACK_SECRET = Deno.env.get("N8N_CALLBACK_SECRET");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get parameters from URL or body
    let campaign_id: string | null = null;
    let secret: string | null = null;

    // Try to get from URL query params first (for GET requests from n8n)
    const url = new URL(req.url);
    campaign_id = url.searchParams.get("campaign_id");
    secret = url.searchParams.get("secret");

    // If not in URL, try body (for POST requests)
    if (!campaign_id && req.method === "POST") {
      const body = await req.json();
      campaign_id = body.campaign_id;
      secret = body.secret;
    }

    console.log(`Check campaign status request for: ${campaign_id}`);

    // Validate secret
    if (!CALLBACK_SECRET || secret !== CALLBACK_SECRET) {
      console.error("Invalid or missing callback secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: "campaign_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch campaign status
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("status")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError?.message);
      return new Response(
        JSON.stringify({ error: "Campaign not found", status: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Campaign ${campaign_id} status: ${campaign.status}`);

    // Return status - n8n will use this to decide whether to continue
    return new Response(
      JSON.stringify({ 
        status: campaign.status,
        should_continue: campaign.status === "processing",
      }),
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
