import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { condition, symptoms, focus } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const conditionCtx = condition ? `The user manages ${condition}.` : "The user has chronic pain.";
    const symptomsCtx = symptoms?.length
      ? `Their tracked symptoms include: ${symptoms.join(", ")}.`
      : "";
    const focusCtx = focus && focus !== "All"
      ? `Focus specifically on: ${focus}.`
      : "Provide a variety of techniques.";

    const systemPrompt = `You are a compassionate mindfulness guide specializing in chronic pain and health conditions. Generate 5 personalized mindfulness exercises.

${conditionCtx} ${symptomsCtx} ${focusCtx}

Return exercises using the tool provided. Each exercise must have:
- title: Short, inviting name
- description: 2-3 sentences explaining the technique and its benefits for this user's specific condition
- duration: Estimated time in minutes (1-20)
- category: One of: Breathing, Body Scan, Meditation, Visualization, Grounding, Movement
- steps: Array of 3-6 short step strings (imperative, gentle tone)
- benefit: One sentence about how this specifically helps with their condition/symptoms

Tailor exercises to the user's condition. For pain conditions, focus on pain-aware techniques. For mental health conditions, focus on calming and grounding. Be warm, never dismissive of pain.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate 5 mindfulness exercises${focus && focus !== "All" ? ` focused on ${focus}` : ""} for someone with ${condition || "chronic pain"}.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_exercises",
              description: "Return mindfulness exercise recommendations",
              parameters: {
                type: "object",
                properties: {
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        duration: { type: "number" },
                        category: { type: "string" },
                        steps: { type: "array", items: { type: "string" } },
                        benefit: { type: "string" },
                      },
                      required: ["title", "description", "duration", "category", "steps", "benefit"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["exercises"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_exercises" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ exercises: parsed.exercises }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("mindfulness-exercises error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
