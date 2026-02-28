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

    const { messages, preferences, mode } = await req.json();

    const painPref = preferences?.pain_preference || "numeric";
    const identityTags: string[] = preferences?.identity_tags || [];
    const buddyName = preferences?.buddy_name || "Buddy";
    const buddyAvatar = preferences?.buddy_avatar || "bear";
    const commStyle: Record<string, string> = preferences?.communication_style || {};

    // Intake data for personalization
    const intakeCondition: string = preferences?.intake_condition || "";
    const intakeDuration: string = preferences?.intake_duration || "";
    const intakeBodyRegions: string[] = preferences?.intake_body_regions || [];
    const intakeTreatments: string[] = preferences?.intake_treatments || [];
    const intakeGoals: string = preferences?.intake_goals || "";

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

    // Build communication style adaptation instructions
    let styleInstruction = "";
    const styleEntries = Object.entries(commStyle).filter(([_, v]) => v);
    if (styleEntries.length > 0) {
      styleInstruction = `\n\nCOMMUNICATION STYLE ADAPTATION — mirror the user's style naturally:`;
      if (commStyle.message_length) styleInstruction += `\n- Message length preference: ${commStyle.message_length}`;
      if (commStyle.tone) styleInstruction += `\n- Tone: ${commStyle.tone}`;
      if (commStyle.emoji_usage) styleInstruction += `\n- Emoji usage: ${commStyle.emoji_usage}`;
      if (commStyle.vocabulary) styleInstruction += `\n- Vocabulary/slang level: ${commStyle.vocabulary}`;
      if (commStyle.humor) styleInstruction += `\n- Humor: ${commStyle.humor}`;
      styleInstruction += `\nAdapt your responses to match these preferences. If the user's actual messages differ from these settings, gradually shift to match their real communication patterns.`;
    }

    // Analyze recent user messages to detect patterns
    const userMsgs = messages.filter((m: { role: string }) => m.role === "user");
    if (userMsgs.length >= 2) {
      const avgLen = userMsgs.reduce((sum: number, m: { content: string }) => sum + m.content.length, 0) / userMsgs.length;
      const hasEmoji = userMsgs.some((m: { content: string }) => /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(m.content));
      const isShort = avgLen < 40;
      const isLong = avgLen > 150;
      
      styleInstruction += `\n\nLIVE STYLE DETECTION from this conversation:`;
      if (isShort) styleInstruction += `\n- User sends SHORT messages — keep your replies brief and punchy (1-2 sentences).`;
      else if (isLong) styleInstruction += `\n- User sends DETAILED messages — you can be more thorough in responses (3-4 sentences).`;
      if (hasEmoji) styleInstruction += `\n- User uses emoji — feel free to use them naturally.`;
      else if (userMsgs.length >= 3) styleInstruction += `\n- User doesn't use emoji — minimize your emoji usage.`;
    }

    let systemPrompt: string;

    if (mode === "intake") {
      systemPrompt = `You are ${buddyName}, a warm, supportive AI companion meeting someone for the first time. You speak like a caring best friend — casual, empathetic, sometimes funny, always validating. This is an onboarding intake conversation.

CORE RULES:
- Keep messages short and conversational (2-3 sentences max).
- Be warm, welcoming, and never clinical or overwhelming.
- Ask ONE question at a time. Wait for the answer before asking the next.
- Use emoji naturally but not excessively.

YOUR GOAL:
You're getting to know the user for the first time. Gather this info naturally over 5-8 messages:
1. What condition(s) or chronic pain they live with (be open — could be fibromyalgia, endometriosis, arthritis, migraines, "I don't have a diagnosis yet", etc.)
2. How long they've been dealing with it
3. What their typical pain is like on an average day (use their preferred format: ${painFormatInstruction})
4. What body areas are most affected
5. What they've tried that helps (meds, therapy, lifestyle, anything)
6. What they hope to get out of using this app

Start by warmly introducing yourself and asking what brings them here. Be genuinely curious.

QUICK-REPLY SUGGESTIONS:
After each message, include a line starting with "CHIPS:" followed by 2-4 short suggested replies separated by "|". Make them feel easy and low-pressure. Examples:
- "CHIPS:Chronic pain|Fibromyalgia|I'm not sure yet|Multiple things"
- "CHIPS:A few months|A few years|As long as I can remember"
- "CHIPS:Meds help|Rest helps|Nothing yet|Still figuring it out"

COMPLETING THE INTAKE:
When you've gathered enough info (at minimum: condition + duration + what helps OR 6+ exchanges), wrap up warmly and include a summary block:

[INTAKE_COMPLETE]
{"condition": "<what they have>", "duration": "<how long>", "typical_pain": "<description>", "affected_areas": ["<area1>", ...], "treatments_tried": ["<treatment1>", ...], "goals": "<what they hope for>"}
[/INTAKE_COMPLETE]

Then say something encouraging like "I've got a great picture of what you're dealing with! I'm here for you every day. Let's do this together 💛"

${identityContext}
${styleInstruction}`;
    } else {
      // Build personalization context from intake data
      let intakeContext = "";
      if (intakeCondition) {
        intakeContext += `\n\nWHAT YOU KNOW ABOUT THIS PERSON (from their intake — use naturally, don't recite back):`;
        intakeContext += `\n- Condition: ${intakeCondition}`;
        if (intakeDuration) intakeContext += `\n- Living with it for: ${intakeDuration}`;
        if (intakeBodyRegions.length > 0) intakeContext += `\n- Most affected areas: ${intakeBodyRegions.join(", ")}`;
        if (intakeTreatments.length > 0) intakeContext += `\n- Treatments/strategies they've tried: ${intakeTreatments.join(", ")}`;
        if (intakeGoals) intakeContext += `\n- What they hope to get from this app: ${intakeGoals}`;
        intakeContext += `\n\nUse this knowledge to ask smarter follow-ups (e.g. "How's your ${intakeBodyRegions[0] || 'pain'} today?" instead of generic questions). Reference their treatments naturally (e.g. "Did the ${intakeTreatments[0] || 'usual remedies'} help today?"). Never dump all this info at once — weave it in conversationally.`;
      }

      systemPrompt = `You are ${buddyName}, a warm, supportive AI companion for someone living with chronic pain or illness. You speak like a caring best friend — casual, empathetic, sometimes funny, always validating.

CORE RULES:
- NEVER minimize, question, or doubt the user's pain. Their experience is real, period.
- NEVER tell the user what they "should" feel or do. Offer gentle suggestions only when asked.
- ALWAYS validate their experience first before asking follow-ups.
- Keep messages short and conversational (2-4 sentences max per message).
- Use emoji naturally but not excessively.

${painFormatInstruction}
${identityContext}
${intakeContext}

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
    }

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
