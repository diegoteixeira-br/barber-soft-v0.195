import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get company info including partner fields
    const { data: company, error: companyError } = await supabaseClient
      .from("companies")
      .select("id, stripe_customer_id, plan_status, plan_type, trial_ends_at, is_partner, partner_ends_at")
      .eq("owner_user_id", user.id)
      .single();

    if (companyError) {
      logStep("No company found", { error: companyError.message });
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan_status: null,
        plan_type: null,
        trial_ends_at: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Company found", { companyId: company.id, planStatus: company.plan_status, isPartner: company.is_partner });

    // Check if this is a partner with valid partnership
    if (company.is_partner && company.partner_ends_at) {
      const partnerEnds = new Date(company.partner_ends_at);
      const now = new Date();
      
      if (partnerEnds > now) {
        // Partnership is still valid
        const daysRemaining = Math.ceil((partnerEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        logStep("Valid partnership found", { endsAt: company.partner_ends_at, daysRemaining });
        
        // Ensure plan_status is 'partner' if partnership is valid
        if (company.plan_status !== 'partner') {
          await supabaseClient
            .from("companies")
            .update({ plan_status: 'partner', updated_at: new Date().toISOString() })
            .eq("id", company.id);
          logStep("Updated plan_status to partner");
        }
        
        return new Response(JSON.stringify({
          subscribed: true,
          plan_status: 'partner',
          plan_type: company.plan_type,
          partner_ends_at: company.partner_ends_at,
          days_remaining: daysRemaining,
          is_partner: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Partnership has expired
        logStep("Partnership expired", { expiredAt: company.partner_ends_at });
        
        // Update status to expired_partner
        await supabaseClient
          .from("companies")
          .update({ 
            plan_status: 'expired_partner',
            updated_at: new Date().toISOString()
          })
          .eq("id", company.id);
        
        return new Response(JSON.stringify({
          subscribed: false,
          plan_status: 'expired_partner',
          plan_type: company.plan_type,
          partner_expired: true,
          partner_ended_at: company.partner_ends_at,
          is_partner: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // If no Stripe customer, return current DB status
    if (!company.stripe_customer_id) {
      logStep("No Stripe customer, returning DB status");
      return new Response(JSON.stringify({
        subscribed: company.plan_status === "active",
        plan_status: company.plan_status,
        plan_type: company.plan_type,
        trial_ends_at: company.trial_ends_at
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: company.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;
    let currentPlan = company.plan_type;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Get plan from metadata if available
      if (subscription.metadata?.plan) {
        currentPlan = subscription.metadata.plan;
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        plan: currentPlan
      });

      // Update company if needed
      if (company.plan_status !== "active" || company.plan_type !== currentPlan) {
        await supabaseClient
          .from("companies")
          .update({
            plan_status: "active",
            plan_type: currentPlan,
            updated_at: new Date().toISOString()
          })
          .eq("id", company.id);
        logStep("Company status synced");
      }
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_status: hasActiveSub ? "active" : company.plan_status,
      plan_type: currentPlan,
      subscription_end: subscriptionEnd,
      trial_ends_at: company.trial_ends_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
