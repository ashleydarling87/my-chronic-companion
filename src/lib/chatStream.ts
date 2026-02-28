export type ChatMsg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/buddyChat`;

export async function streamChat({
  messages,
  preferences,
  mode,
  onDelta,
  onDone,
}: {
  messages: ChatMsg[];
  preferences?: Record<string, unknown>;
  mode?: "intake" | "chat";
  onDelta: (chunk: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, preferences, mode }),
  });

  if (!resp.ok || !resp.body) {
    const errBody = await resp.text().catch(() => "");
    let message = "Failed to connect to Buddy";
    try {
      const parsed = JSON.parse(errBody);
      message = parsed.error || message;
    } catch {}
    throw new Error(message);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        /* ignore */
      }
    }
  }

  onDone();
}

/**
 * Parse the AI response for entry data and chip suggestions.
 * Returns { displayText, chips, entryData }
 */
export function parseAIResponse(fullText: string): {
  displayText: string;
  chips: string[];
  entryData: Record<string, unknown> | null;
} {
  let displayText = fullText;
  let entryData: Record<string, unknown> | null = null;

  // Extract entry JSON
  const entryMatch = fullText.match(/\[ENTRY_SAVE\]\s*([\s\S]*?)\s*\[\/ENTRY_SAVE\]/);
  if (entryMatch) {
    try {
      entryData = JSON.parse(entryMatch[1]);
    } catch {
      console.warn("Failed to parse entry data from AI response");
    }
    displayText = displayText.replace(/\[ENTRY_SAVE\][\s\S]*?\[\/ENTRY_SAVE\]/, "").trim();
  }

  // Extract chips
  const chips: string[] = [];
  const chipsMatch = displayText.match(/CHIPS:\s*(.+)/);
  if (chipsMatch) {
    chips.push(...chipsMatch[1].split("|").map((c) => c.trim()).filter(Boolean));
    displayText = displayText.replace(/CHIPS:\s*.+/, "").trim();
  }

  return { displayText, chips, entryData };
}
