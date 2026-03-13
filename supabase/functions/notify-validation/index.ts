import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { evaluation_id, new_status, validation_notes } = await req.json();

    if (!evaluation_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "evaluation_id and new_status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get evaluation with candidate and creator info
    const { data: evaluation, error: evalError } = await supabaseAdmin
      .from("evaluations")
      .select("id, target_grade, evaluator_name, created_by, candidates(full_name, email)")
      .eq("id", evaluation_id)
      .single();

    if (evalError || !evaluation) {
      return new Response(
        JSON.stringify({ error: "Evaluation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get creator email from auth
    let creatorEmail: string | null = null;
    if (evaluation.created_by) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(evaluation.created_by);
      creatorEmail = userData?.user?.email || null;
    }

    const statusLabels: Record<string, string> = {
      validada: "✅ Validada",
      contestada: "❌ Contestada",
      revisao: "🔄 Em Revisão",
    };

    const statusLabel = statusLabels[new_status] || new_status;
    const candidateName = (evaluation.candidates as any)?.full_name || "Candidato";
    const candidateEmail = (evaluation.candidates as any)?.email || null;

    // Collect recipients
    const recipients: string[] = [];
    if (creatorEmail) recipients.push(creatorEmail);
    if (candidateEmail && !recipients.includes(candidateEmail)) recipients.push(candidateEmail);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recipients found, skipping notification" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the notification (in production, integrate with an email provider)
    const notification = {
      to: recipients,
      subject: `Avaliação ${statusLabel} — ${candidateName} (${evaluation.target_grade})`,
      body: [
        `Prezado(a),`,
        ``,
        `A avaliação do candidato ${candidateName} para o grau ${evaluation.target_grade} teve seu status de validação atualizado para: ${statusLabel}.`,
        validation_notes ? `\nObservações da federação:\n${validation_notes}` : "",
        ``,
        `Avaliador responsável: ${evaluation.evaluator_name}`,
        ``,
        `Este é um e-mail automático do sistema SHODAN.`,
      ]
        .filter(Boolean)
        .join("\n"),
    };

    console.log("Notification prepared:", JSON.stringify(notification, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification prepared for ${recipients.length} recipient(s)`,
        recipients,
        subject: notification.subject,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-validation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
