import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for admin/moderator role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || !["admin", "moderator"].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Permissão insuficiente." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, fileName } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum texto extraído do documento." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate text length
    const MAX_TEXT_LENGTH = 50000;
    const sanitizedText = text.length > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Você é um assistente que extrai dados de candidatos de judô a partir de documentos.
Extraia TODOS os candidatos encontrados no texto e retorne um JSON array.

Cada candidato deve ter os seguintes campos (use null se não encontrar):
- full_name (string, obrigatório): Nome completo
- email (string ou null): Email
- birth_date (string ou null): Data de nascimento no formato YYYY-MM-DD
- federation (string): Federação (ex: FPJUDO, FPJ, CBJ). Se não encontrar, use "Não informada"
- association (string ou null): Associação/clube
- current_grade (string): Graduação atual (ex: "1º KYÛ", "1º DAN"). Se não encontrar, use "1º KYÛ"
- target_grade (string): Graduação pretendida (ex: "1º DAN", "2º DAN"). Se não encontrar, use "1º DAN"
- zempo_registration (string ou null): Registro Zempo/FZPJ
- registration_years (number): Anos de registro. Se não encontrar, use 0
- accumulated_points (number): Pontos acumulados. Se não encontrar, use 0

IMPORTANTE:
- Retorne SOMENTE o JSON array, sem markdown, sem explicações
- Se encontrar datas no formato DD/MM/YYYY, converta para YYYY-MM-DD
- Graduações devem usar o formato: "1º KYÛ", "1º DAN", "2º DAN", etc.
- Se não encontrar nenhum candidato, retorne um array vazio []`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Arquivo: ${String(fileName || "documento").substring(0, 255)}\n\nConteúdo:\n${sanitizedText.substring(0, 15000)}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";

    // Clean markdown fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let candidates;
    try {
      candidates = JSON.parse(content);
    } catch {
      candidates = [];
    }

    if (!Array.isArray(candidates)) {
      candidates = [candidates];
    }

    return new Response(
      JSON.stringify({ candidates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error parsing candidates:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar candidatos." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
