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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(SUPABASE_URL, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }

    const { raw_text, pain_level, pain_verbal, energy_level, mood, sleep_hours } = await req.json();

    const systemPrompt = `You are a compassionate health-tracking AI assistant for people with chronic illness. 
Analyze the user's daily check-in and return structured JSON using the tool provided.
Be empathetic but precise. Flag emergency = true ONLY if the user describes symptoms requiring immediate medical attention (e.g., chest pain, difficulty breathing, suicidal ideation).`;

    const userPrompt = `Daily check-in:
- Raw journal text: "${raw_text || "No journal entry"}"
- Pain level: ${pain_level}/10
- Energy level: ${energy_level}/10
- Mood: ${mood}
- Sleep hours: ${sleep_hours}

Analyze this entry and extract structured health data.`;

    const openaiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "process_daily_entry",
              description: "Process and structure a daily health check-in entry.",
              parameters: {
                type: "object",
                properties: {
                  symptoms: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of symptoms mentioned or inferred",
                  },
                  severity: {
                    type: "string",
                    enum: ["mild", "moderate", "severe"],
                    description: "Overall severity of today's symptoms",
                  },
                  triggers: {
                    type: "array",
                    items: { type: "string" },
                    description: "Potential triggers identified",
                  },
                  summary: {
                    type: "string",
                    description: "A brief empathetic summary of how the user is doing today",
                  },
                  follow_up_question: {
                    type: "string",
                    description: "A thoughtful follow-up question for the user",
                  },
                  emergency: {
                    type: "boolean",
                    description: "True only if immediate medical attention may be needed",
                  },
                },
                required: ["symptoms", "severity", "triggers", "summary", "follow_up_question", "emergency"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "process_daily_entry" } },
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", openaiResponse.status, errText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const toolCall = openaiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call returned from OpenAI");
    }

    const aiResult = JSON.parse(toolCall.function.arguments);

    const { data, error } = await supabase
      .from("entries")
      .insert({
        raw_text,
        pain_level,
        energy_level,
        mood,
        sleep_hours,
        symptoms: aiResult.symptoms,
        severity: aiResult.severity,
        triggers: aiResult.triggers,
        summary: aiResult.summary,
        follow_up_question: aiResult.follow_up_question,
        emergency: aiResult.emergency,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("processDailyEntry error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
