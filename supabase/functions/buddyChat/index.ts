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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { messages, preferences } = await req.json();

    const painPref = preferences?.pain_preference || "numeric";
    const identityTags: string[] = preferences?.identity_tags || [];

    let painFormatInstruction = "";
    switch (painPref) {
      case "numeric":
        painFormatInstruction = "Ask about pain using a 0-10 numeric scale.";
        break;
      case "verbal":
        painFormatInstruction = "Ask about pain using words: none, mild, moderate, severe, unbearable.";
        break;
      case "faces":
        painFormatInstruction = "Ask about pain using emoji faces: 😊 (no pain) → 😐 (mild) → 😣 (moderate) → 😖 (severe) → 😭 (unbearable).";
        break;
      case "adaptive":
        painFormatInstruction = "Choose the most natural way to ask about pain intensity based on the conversation flow — numbers, words, or emoji faces.";
        break;
    }

    let identityContext = "";
    if (identityTags.length > 0) {
      identityContext = `\nThe user has shared these identity contexts (use to tailor your language with sensitivity, NEVER bring them up unprompted): ${identityTags.join(", ")}.`;
      if (identityTags.includes("black") || identityTags.includes("indigenous")) {
        identityContext += `\nBe especially aware that this user may face medical discrimination and dismissal. NEVER question or minimize their pain. Acknowledge systemic barriers when relevant. Honor cultural and spiritual practices as legitimate forms of care and relief.`;
      }
    }

    const systemPrompt = `You are Buddy, a warm, supportive AI companion for someone living with chronic pain or illness. You speak like a caring best friend — casual, empathetic, sometimes funny, always validating.

CORE RULES:
- NEVER minimize, question, or doubt the user's pain. Their experience is real, period.
- NEVER tell the user what they "should" feel or do. Offer gentle suggestions only when asked.
- ALWAYS validate their experience first before asking follow-ups.
- Keep messages short and conversational (2-4 sentences max per message).
- Use emoji naturally but not excessively.

${painFormatInstruction}
${identityContext}

YOUR CONVERSATION GOAL:
You're having a check-in conversation. Naturally gather:
1. Pain intensity (in the user's preferred format)
2. Body location(s) — where does it hurt?
3. Qualities — what does it feel like? (burning, sharp, electric, heavy, aching, throbbing, etc.)
4. Impacts — how is it affecting: sleep, mobility/walking, work/school, family/community, mood? (rate each 0-4: none, a little, somewhat, a lot, completely)
5. Triggers — what might be causing or worsening it? (weather, stress, discrimination, overactivity, food, meds change, etc.)
6. Relief — what has helped? (rest, meds, stretching, time on land, community time, spiritual practice, etc.)
7. Energy level (0-10)

Don't ask all at once — space questions naturally over 3-6 messages. Use the user's language. If they seem low-energy, ask fewer questions.

QUICK-REPLY SUGGESTIONS:
After each of your messages, include a line starting with "CHIPS:" followed by 2-5 short suggested replies separated by "|". These should be contextually relevant. Examples:
- "CHIPS:Sleep|Walking|Work|Mood|All of the above"
- "CHIPS:Weather|Stress|Not sure|Skip this"
- "CHIPS:Rest helped|Meds helped|Nothing yet|I don't want to talk about it"

SAVING AN ENTRY:
When you have gathered enough information (at minimum: pain intensity + at least one other dimension), confirm what you'll log and include a JSON block wrapped in markers:

"Got it! I'll log: [summary of what you captured]. Want me to add anything else?"

Then on a NEW line, include:
[ENTRY_SAVE]
{"pain_level": <0-10 number>, "pain_verbal": "<none|mild|moderate|severe|unbearable>", "energy_level": <0-10 or null>, "mood": "<mood string or null>", "body_regions": ["<region1>", ...], "qualities": ["<quality1>", ...], "impacts": {"sleep": <0-4>, "mobility": <0-4>, "work": <0-4>, "family": <0-4>, "mood": <0-4>}, "triggers": ["<trigger1>", ...], "reliefs": ["<relief1>", ...], "journal_text": "<summary of what the user said>", "summary": "<empathetic 1-sentence summary>", "symptoms": ["<symptom1>", ...], "severity": "<mild|moderate|severe>"}
[/ENTRY_SAVE]

Only include fields you actually gathered — leave others out. The frontend will handle saving.

CONTEXT NOTES (use sparingly, NOT every conversation):
If the user mentions being dismissed by a doctor, experiencing discrimination, or feeling unheard in medical settings, gently ask once:
"Do you want me to note that you felt dismissed/experienced discrimination today? You can choose later whether this shows up in your doctor report."
If they say yes, add to the entry JSON: "felt_dismissed_by_provider": true and/or "experienced_discrimination": true with "context_notes": "<brief note>".
If they say no, respect that completely and move on.

EMERGENCY:
If the user describes chest pain, difficulty breathing, suicidal thoughts, or other emergency symptoms, respond with empathy AND include crisis resources. Add "emergency": true to the entry JSON.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("buddyChat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
