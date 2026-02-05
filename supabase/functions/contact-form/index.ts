import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, phone, email, subject, message, recaptchaToken } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Todos os campos obrigatórios devem ser preenchidos" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate reCAPTCHA token
    if (!recaptchaToken) {
      console.error("Missing reCAPTCHA token");
      return new Response(
        JSON.stringify({ error: "Token de verificação não encontrado" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reCAPTCHA Enterprise token
    const secretKey = Deno.env.get("RECAPTCHA_SECRET_KEY");
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Verifying reCAPTCHA token...");

    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", recaptchaToken);

    const recaptchaResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const recaptchaResult = await recaptchaResponse.json();
    
    console.log("reCAPTCHA verification result:", JSON.stringify(recaptchaResult));

    // Check if verification was successful
    if (!recaptchaResult.success) {
      console.error("reCAPTCHA verification failed:", recaptchaResult["error-codes"]);
      return new Response(
        JSON.stringify({ error: "Verificação de segurança falhou. Tente novamente." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check score (reCAPTCHA v3/Enterprise returns a score from 0.0 to 1.0)
    const score = recaptchaResult.score || 0;
    console.log(`reCAPTCHA score: ${score}`);

    if (score < 0.5) {
      console.warn(`Low reCAPTCHA score (${score}) - possible bot activity`);
      return new Response(
        JSON.stringify({ error: "Verificação de segurança falhou. Se você é humano, tente novamente." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful submission (you can add email sending or database storage here)
    console.log("Contact form submission verified successfully:", {
      name,
      phone,
      email,
      subject,
      messageLength: message.length,
      score,
      timestamp: new Date().toISOString(),
    });

    // TODO: Add email sending logic here (e.g., using Resend API)
    // For now, just log and return success

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem enviada com sucesso! Retornaremos em breve." 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor. Tente novamente mais tarde." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
