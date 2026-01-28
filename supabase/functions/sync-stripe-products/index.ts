import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento dos Price IDs existentes no Stripe
const STRIPE_PRICES = {
  inicial: {
    monthly: "price_1SuD9cPFVcRfSdEa1OzhUHXb",
    annual: "price_1SuDAAPFVcRfSdEalIMHeTTG"
  },
  profissional: {
    monthly: "price_1SuDBHPFVcRfSdEav7E0VdLu",
    annual: "price_1SuDBrPFVcRfSdEaVEj4XviB"
  },
  franquias: {
    monthly: "price_1SuDCKPFVcRfSdEaAVkfM9dA",
    annual: "price_1SuDDBPFVcRfSdEazhidc1RM"
  }
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-STRIPE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Verificar se é super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Verificar se é super admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .single();

    if (!roleData) {
      throw new Error("Access denied: Only super admins can sync Stripe products");
    }
    logStep("Super admin verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Buscar configurações atuais do banco
    const { data: settings, error: settingsError } = await supabaseClient
      .from("saas_settings")
      .select("*")
      .single();

    if (settingsError) throw new Error(`Settings error: ${settingsError.message}`);
    logStep("Settings loaded", settings);

    // Buscar features do banco
    const { data: features, error: featuresError } = await supabaseClient
      .from("plan_features")
      .select("*")
      .order("display_order");

    if (featuresError) throw new Error(`Features error: ${featuresError.message}`);
    logStep("Features loaded", { count: features?.length });

    // Preparar metadata das features para cada plano
    const buildFeatureMetadata = (planKey: 'inicial' | 'profissional' | 'franquias') => {
      const metadata: Record<string, string> = {};
      features?.forEach((feature: any) => {
        const value = feature[`${planKey}_value`];
        if (value !== null && value !== undefined) {
          metadata[`feature_${feature.feature_key}`] = String(value);
        }
      });
      return metadata;
    };

    const results = {
      prices_updated: [] as string[],
      products_updated: [] as string[],
      errors: [] as string[]
    };

    // Atualizar cada preço no Stripe
    const priceUpdates = [
      {
        priceId: STRIPE_PRICES.inicial.monthly,
        plan: "Inicial",
        billing: "Mensal",
        amount: Math.round(Number(settings.inicial_plan_price) * 100),
        planKey: "inicial" as const
      },
      {
        priceId: STRIPE_PRICES.inicial.annual,
        plan: "Inicial",
        billing: "Anual",
        amount: Math.round(Number(settings.inicial_plan_annual_price) * 100 * 12), // Preço anual total
        planKey: "inicial" as const
      },
      {
        priceId: STRIPE_PRICES.profissional.monthly,
        plan: "Profissional",
        billing: "Mensal",
        amount: Math.round(Number(settings.profissional_plan_price) * 100),
        planKey: "profissional" as const
      },
      {
        priceId: STRIPE_PRICES.profissional.annual,
        plan: "Profissional",
        billing: "Anual",
        amount: Math.round(Number(settings.profissional_plan_annual_price) * 100 * 12),
        planKey: "profissional" as const
      },
      {
        priceId: STRIPE_PRICES.franquias.monthly,
        plan: "Franquias",
        billing: "Mensal",
        amount: Math.round(Number(settings.franquias_plan_price) * 100),
        planKey: "franquias" as const
      },
      {
        priceId: STRIPE_PRICES.franquias.annual,
        plan: "Franquias",
        billing: "Anual",
        amount: Math.round(Number(settings.franquias_plan_annual_price) * 100 * 12),
        planKey: "franquias" as const
      }
    ];

    // Obter os preços atuais para verificar os produtos
    const priceProductMap = new Map<string, string>();
    
    for (const update of priceUpdates) {
      try {
        // Buscar o preço atual para obter o product_id
        const currentPrice = await stripe.prices.retrieve(update.priceId);
        const productId = currentPrice.product as string;
        priceProductMap.set(update.planKey, productId);
        
        // Stripe não permite atualizar o amount de um preço existente
        // Então vamos apenas atualizar os metadados do produto
        logStep(`Price ${update.priceId} exists`, { 
          currentAmount: currentPrice.unit_amount,
          targetAmount: update.amount,
          productId
        });

        // Se o preço é diferente, informar o usuário
        if (currentPrice.unit_amount !== update.amount) {
          results.errors.push(
            `⚠️ Preço ${update.plan} ${update.billing}: Stripe tem R$${(currentPrice.unit_amount || 0) / 100}, configurado R$${update.amount / 100}. ` +
            `Para alterar preços, crie novos Price IDs no Stripe.`
          );
        } else {
          results.prices_updated.push(`${update.plan} ${update.billing}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.errors.push(`Erro ao verificar preço ${update.plan} ${update.billing}: ${errorMessage}`);
        logStep("Error verifying price", { priceId: update.priceId, error: errorMessage });
      }
    }

    // Atualizar metadados dos produtos com as features
    const updatedProducts = new Set<string>();
    for (const [planKey, productId] of priceProductMap.entries()) {
      if (updatedProducts.has(productId)) continue;
      
      try {
        const featureMetadata = buildFeatureMetadata(planKey as 'inicial' | 'profissional' | 'franquias');
        
        await stripe.products.update(productId, {
          metadata: {
            plan_key: planKey,
            trial_days: String(settings.default_trial_days || 7),
            ...featureMetadata
          }
        });
        
        updatedProducts.add(productId);
        results.products_updated.push(`Plano ${planKey.charAt(0).toUpperCase() + planKey.slice(1)}`);
        logStep(`Product updated with features`, { productId, planKey, featuresCount: Object.keys(featureMetadata).length });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.errors.push(`Erro ao atualizar produto ${planKey}: ${errorMessage}`);
        logStep("Error updating product", { productId, error: errorMessage });
      }
    }

    logStep("Sync completed", results);

    return new Response(JSON.stringify({
      success: true,
      message: "Sincronização concluída",
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});