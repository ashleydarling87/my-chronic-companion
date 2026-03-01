import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRUSTED_SOURCES = [
  { domain: "mayoclinic.org", name: "Mayo Clinic", searchUrl: "https://www.mayoclinic.org/search/search-results?q=" },
  { domain: "nih.gov", name: "NIH", searchUrl: "https://search.nih.gov/search?query=" },
  { domain: "clevelandclinic.org", name: "Cleveland Clinic", searchUrl: "https://my.clevelandclinic.org/search-results#q=" },
  { domain: "healthline.com", name: "Healthline", searchUrl: "https://www.healthline.com/search?q1=" },
  { domain: "webmd.com", name: "WebMD", searchUrl: "https://www.webmd.com/search/search_results/default.aspx?query=" },
  { domain: "nami.org", name: "NAMI", searchUrl: "https://www.nami.org/Search-Results?searchTerm=" },
  { domain: "psychologytoday.com", name: "Psychology Today", searchUrl: "https://www.psychologytoday.com/us/search?search=" },
  { domain: "headspace.com", name: "Headspace", searchUrl: "https://www.headspace.com/search?query=" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { condition, symptoms, topic } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const conditionContext = condition ? `The user has ${condition}.` : "The user has chronic pain.";
    const symptomsContext = symptoms?.length
      ? `They track these symptoms: ${symptoms.join(", ")}.`
      : "";
    const topicFilter = topic && topic !== "All"
      ? `Focus specifically on the topic: ${topic}.`
      : "Cover a variety of relevant topics.";

    const sourcesJson = JSON.stringify(TRUSTED_SOURCES.map(s => ({ name: s.name, domain: s.domain })));

    const systemPrompt = `You are a health resource curator. Generate exactly 6 article recommendations for someone managing chronic pain or health conditions. Each recommendation should be educational, empowering, and from reputable health sources.

${conditionContext} ${symptomsContext} ${topicFilter}

You MUST return a JSON array using the tool provided. Each article must have:
- title: A specific, helpful article title (as if it exists on that source)
- summary: 2-3 sentence description of what the reader will learn
- source: The name of the source (one of: ${TRUSTED_SOURCES.map(s => s.name).join(", ")})
- topic: One of: Pain Management, Sleep, Mental Health, Mindfulness, Nutrition, Exercise, Advocacy

Make titles specific and actionable. Use titles that closely match real, well-known articles on these sites so the search results will find the actual article. Vary the sources across recommendations. Focus on practical, evidence-based content.`;

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
          { role: "user", content: `Generate 6 article recommendations${topic && topic !== "All" ? ` about ${topic}` : ""} for someone with ${condition || "chronic pain"}.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_articles",
              description: "Return article recommendations",
              parameters: {
                type: "object",
                properties: {
                  articles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        source: { type: "string" },
                        topic: { type: "string" },
                      },
                      required: ["title", "summary", "source", "topic"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["articles"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_articles" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const articles = parsed.articles.map((article: any) => {
      const sourceInfo = TRUSTED_SOURCES.find(s => s.name === article.source) || TRUSTED_SOURCES[0];
      const searchQuery = encodeURIComponent(article.title);
      return {
        ...article,
        url: `${sourceInfo.searchUrl}${searchQuery}`,
        domain: sourceInfo.domain,
      };
    });

    return new Response(JSON.stringify({ articles }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("search-articles error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
