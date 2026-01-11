import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OptOutRequest {
  instanceName: string;
  sender: string;
  message: string;
  secret: string;
  action?: "opt_out" | "opt_in";
}

// Normalize phone number (remove @s.whatsapp.net, country code, etc.)
function normalizePhone(phone: string): string {
  return phone
    .replace(/@.*$/, "")  // Remove @s.whatsapp.net
    .replace(/\D/g, "")    // Remove non-digits
    .replace(/^55/, "");   // Remove country code
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL")!;
    const expectedSecret = Deno.env.get("N8N_CALLBACK_SECRET");

    const body: OptOutRequest = await req.json();
    const { instanceName, sender, message, secret, action = "opt_out" } = body;

    console.log(`[process-opt-out] Received request for ${sender}, action: ${action}`);

    // Validate secret
    if (!expectedSecret || secret !== expectedSecret) {
      console.error("[process-opt-out] Invalid or missing secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!instanceName || !sender) {
      console.error("[process-opt-out] Missing required fields");
      return new Response(
        JSON.stringify({ error: "instanceName and sender are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize phone number
    const phone = normalizePhone(sender);
    console.log(`[process-opt-out] Normalized phone: ${phone}`);

    // Try to find client by phone (with and without country code)
    let client = null;
    
    // Try without country code first
    const { data: clientData } = await supabase
      .from("clients")
      .select("id, name, phone, unit_id, marketing_opt_out")
      .eq("phone", phone)
      .maybeSingle();
    
    if (clientData) {
      client = clientData;
    } else {
      // Try with country code
      const { data: clientWithCode } = await supabase
        .from("clients")
        .select("id, name, phone, unit_id, marketing_opt_out")
        .eq("phone", "55" + phone)
        .maybeSingle();
      
      if (clientWithCode) {
        client = clientWithCode;
      }
    }

    if (!client) {
      console.log(`[process-opt-out] Client not found for phone ${phone}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Cliente não encontrado no sistema" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-opt-out] Found client: ${client.name} (${client.id})`);

    // Get unit's Evolution API key
    const { data: unit } = await supabase
      .from("units")
      .select("evolution_api_key")
      .eq("id", client.unit_id)
      .single();

    const isOptOut = action === "opt_out";

    // Update client's opt-out status
    const updateData: Record<string, unknown> = {
      marketing_opt_out: isOptOut,
    };

    if (isOptOut) {
      updateData.opted_out_at = new Date().toISOString();
    } else {
      updateData.opted_out_at = null;
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", client.id);

    if (updateError) {
      console.error("[process-opt-out] Error updating client:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar cliente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-opt-out] Client ${client.name} opt-out status updated to: ${isOptOut}`);

    // Send confirmation message via Evolution API
    if (unit?.evolution_api_key && evolutionApiUrl) {
      try {
        const confirmationMessage = isOptOut
          ? `Pronto! ✅ Você foi removido da nossa lista de promoções.\n\nSe mudar de ideia, é só mandar VOLTAR que a gente te coloca de volta. Tmj! 🤙`
          : `Que bom ter você de volta! 🎉\n\nVocê foi adicionado novamente à nossa lista de promoções. Tmj! 💈`;

        const formattedPhone = phone.startsWith("55") ? phone : "55" + phone;

        const evolutionResponse = await fetch(
          `${evolutionApiUrl}/message/sendText/${instanceName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: unit.evolution_api_key,
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: confirmationMessage,
              delay: 2000, // 2 second delay to seem natural
            }),
          }
        );

        if (evolutionResponse.ok) {
          console.log(`[process-opt-out] Confirmation message sent to ${client.name}`);
        } else {
          const errorText = await evolutionResponse.text();
          console.error(`[process-opt-out] Error sending confirmation:`, errorText);
        }
      } catch (sendError) {
        console.error("[process-opt-out] Error sending confirmation message:", sendError);
        // Don't fail the request, the opt-out was still processed
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: isOptOut ? "opted_out" : "opted_in",
        client_id: client.id,
        client_name: client.name,
        message: isOptOut 
          ? `${client.name} foi removido da lista de marketing` 
          : `${client.name} foi adicionado de volta à lista de marketing`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[process-opt-out] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
