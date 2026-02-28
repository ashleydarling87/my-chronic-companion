import { useState, useRef, useEffect } from "react";
import { Send, Mic } from "lucide-react";
import { toast } from "sonner";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/contexts/AuthContext";
import { streamChat, parseAIResponse, type ChatMsg } from "@/lib/chatStream";
import { getBuddyEmoji } from "@/lib/data";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  chips?: string[];
  timestamp: Date;
  saved?: boolean;
}

const TypingIndicator = () => (
  <div className="flex items-center gap-1 chat-bubble-ai w-fit">
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
  </div>
);

const QuickChips = ({ chips, onSelect, disabled }: { chips: string[]; onSelect: (c: string) => void; disabled: boolean }) => (
  <div className="flex flex-wrap gap-1.5 mt-2 animate-slide-up">
    {chips.map((chip) => (
      <button
        key={chip}
        onClick={() => onSelect(chip)}
        disabled={disabled}
        className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/15 hover:border-primary/50 disabled:opacity-40"
      >
        {chip}
      </button>
    ))}
  </div>
);

const ChatBubble = ({ message, onChipSelect, isLatest, isLoading, buddyEmoji }: {
  message: DisplayMessage;
  onChipSelect: (c: string) => void;
  isLatest: boolean;
  isLoading: boolean;
  buddyEmoji: string;
}) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}>
      {!isUser && <span className="mr-2 mt-1 text-xl">{buddyEmoji}</span>}
      <div className="max-w-[78%] space-y-1">
        <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <p className={`mt-1 text-[10px] ${isUser ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            {message.timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        {message.saved && (
          <p className="text-[11px] text-accent font-medium ml-1">
            📝 Saved to your log for {message.timestamp.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
          </p>
        )}
        {!isUser && isLatest && message.chips && message.chips.length > 0 && (
          <QuickChips chips={message.chips} onSelect={onChipSelect} disabled={isLoading} />
        )}
      </div>
    </div>
  );
};

const makeInitialMessage = (): DisplayMessage => ({
  id: "initial",
  role: "assistant",
  content: "Hey bestie! 💛 How are you feeling today? Tell me everything — the good, the bad, the ugh.",
  chips: ["Not great today", "Pretty good actually", "Pain is really bad", "I just want to vent"],
  timestamp: new Date(),
});

/** Returns the "chat day" string (YYYY-MM-DD) where the day flips at 3 AM local time. */
const getChatDay = (): string => {
  const now = new Date();
  // If before 3 AM, it's still "yesterday's" chat day
  if (now.getHours() < 3) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
  }
  return now.toISOString().slice(0, 10);
};

const STORAGE_KEY = "buddy_chat_session";

const loadSession = (): DisplayMessage[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const { day, messages } = JSON.parse(raw);
    if (day !== getChatDay()) return []; // reset at 3am boundary
    return messages.map((m: DisplayMessage) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
};

const saveSession = (msgs: DisplayMessage[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ day: getChatDay(), messages: msgs }));
  } catch { /* quota exceeded — non-critical */ }
};

const ChatPage = () => {
  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    const restored = loadSession();
    return restored.length > 0 ? restored : [makeInitialMessage()];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { prefs } = useUserPreferences();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Persist messages to sessionStorage
  useEffect(() => {
    saveSession(messages);
  }, [messages]);

  const saveEntryToDb = async (entryData: Record<string, unknown>) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const row: Record<string, unknown> = {
      user_id: currentUser?.id,
      pain_level: entryData.pain_level ?? null,
      pain_verbal: entryData.pain_verbal ?? null,
      energy_level: entryData.energy_level ?? null,
      mood: entryData.mood ?? null,
      body_regions: entryData.body_regions ?? [],
      qualities: entryData.qualities ?? [],
      impacts: entryData.impacts ?? {},
      triggers: entryData.triggers ?? [],
      reliefs: entryData.reliefs ?? [],
      journal_text: entryData.journal_text ?? null,
      summary: entryData.summary ?? null,
      symptoms: entryData.symptoms ?? [],
      severity: entryData.severity ?? null,
      raw_text: entryData.journal_text ?? null,
      felt_dismissed_by_provider: entryData.felt_dismissed_by_provider ?? false,
      experienced_discrimination: entryData.experienced_discrimination ?? false,
      context_notes: entryData.context_notes ?? null,
      emergency: entryData.emergency ?? false,
    };

    const { error } = await supabase.from("entries").insert(row);
    if (error) {
      console.error("Failed to save entry:", error);
      toast.error("Couldn't save entry to your log");
      return false;
    }
    return true;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build message history for AI (exclude initial mock message if it's the system greeting)
    const allMessages = [...messages, userMsg];
    const chatHistory: ChatMsg[] = allMessages
      .filter((m) => m.id !== "initial")
      .map((m) => ({ role: m.role, content: m.content }));

    // If this is the first user message, include the greeting as assistant context
    if (allMessages[0].id === "initial") {
      chatHistory.unshift({ role: "assistant", content: allMessages[0].content });
    }

    let assistantText = "";
    const assistantId = (Date.now() + 1).toString();

    const upsertAssistant = (nextChunk: string) => {
      assistantText += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === assistantId) {
          return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m));
        }
        return [...prev, { id: assistantId, role: "assistant", content: assistantText, timestamp: new Date() }];
      });
    };

    try {
      await streamChat({
        messages: chatHistory,
        preferences: prefs ? {
          pain_preference: prefs.pain_preference,
          identity_tags: prefs.identity_tags,
          buddy_name: prefs.buddy_name,
          buddy_avatar: prefs.buddy_avatar,
          intake_condition: prefs.intake_condition,
          intake_duration: prefs.intake_duration,
          intake_body_regions: prefs.intake_body_regions,
          intake_treatments: prefs.intake_treatments,
          intake_goals: prefs.intake_goals,
        } : undefined,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: async () => {
          // Parse the final text for chips and entry data
          const { displayText, chips, entryData } = parseAIResponse(assistantText);

          let saved = false;
          if (entryData) {
            saved = await saveEntryToDb(entryData);
            if (saved) {
              toast.success("Check-in saved to your log! 📝");
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: displayText, chips, saved }
                : m
            )
          );
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error("Chat error:", e);
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleChipSelect = (chip: string) => sendMessage(chip);

  const latestAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title={`${prefs?.buddy_name || "Buddy"} ${getBuddyEmoji(prefs?.buddy_avatar || "bear")}`} subtitle="Always here for you" />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        <div className="mx-auto max-w-lg space-y-3">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onChipSelect={handleChipSelect}
              isLatest={msg.id === latestAssistantId}
              isLoading={isLoading}
            />
          ))}
          {isLoading && !messages.some((m) => m.id === (Date.now() + 1).toString()) && (
            <div className="flex items-center">
              <span className="mr-2 text-xl">{getBuddyEmoji(prefs?.buddy_avatar || "bear")}</span>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="fixed bottom-[60px] left-0 right-0 border-t bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tell me how you're feeling..."
            disabled={isLoading}
            className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatPage;
