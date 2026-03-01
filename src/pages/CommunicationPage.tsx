import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { streamChat, type ChatMsg } from "@/lib/chatStream";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  chips?: string[];
  timestamp: Date;
}

const AUDIENCES = [
  { label: "Doctor / Provider", emoji: "🩺" },
  { label: "Boss / HR", emoji: "💼" },
  { label: "Friend", emoji: "👋" },
  { label: "Family", emoji: "🏠" },
  { label: "Partner", emoji: "💛" },
  { label: "Other", emoji: "✉️" },
];

const PERSONAL_AUDIENCES = ["Friend", "Family", "Partner", "Other"];

const BASE_SITUATIONS = [
  "Explaining my condition",
  "Requesting accommodations",
  "Setting boundaries",
  "Canceling plans",
  "Asking for help",
  "Other",
];

const PERSONAL_SITUATIONS = [
  "Checking in / sharing an update",
  "Explaining my condition",
  "Setting boundaries",
  "Canceling plans",
  "Asking for help",
  "Sharing good news about my health",
  "Other",
];

const getSituations = (audience: string) =>
  PERSONAL_AUDIENCES.includes(audience) ? PERSONAL_SITUATIONS : BASE_SITUATIONS;

const TypingIndicator = () => (
  <div className="flex items-center gap-1 chat-bubble-ai w-fit">
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
  </div>
);

const CopyableBlock = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative my-2 rounded-xl border bg-background p-3">
      <pre className="whitespace-pre-wrap text-sm leading-relaxed">{text}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 rounded-lg bg-secondary p-1.5 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
};

/** Renders message content, extracting ```draft blocks into copyable sections */
const MessageContent = ({ content }: { content: string }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3).replace(/^draft\n?/i, "").trim();
          return <CopyableBlock key={i} text={inner} />;
        }
        return part.trim() ? (
          <p key={i} className="text-[15px] leading-relaxed whitespace-pre-wrap">{part.trim()}</p>
        ) : null;
      })}
    </>
  );
};

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

const CommunicationPage = () => {
  const navigate = useNavigate();
  const { prefs } = useUserPreferences();
  const [audience, setAudience] = useState<string | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const startChat = (aud: string, sit: string) => {
    const intro: DisplayMessage = {
      id: "intro",
      role: "assistant",
      content: `Great — let's craft a message to your **${aud.toLowerCase()}** about **${sit.toLowerCase()}**. 💛\n\nTell me a bit more about the situation. What do you want them to understand? I'll help you find the right words — no guilt, no over-apologizing.`,
      chips: ["I don't know where to start", "I have a rough draft", "I just need the right tone"],
      timestamp: new Date(),
    };
    setMessages([intro]);
  };

  const handleAudienceSelect = (aud: string) => {
    setAudience(aud);
  };

  const handleSituationSelect = (sit: string) => {
    setSituation(sit);
    if (audience) startChat(audience, sit);
  };

  const parseChips = (text: string): { displayText: string; chips: string[] } => {
    const chips: string[] = [];
    let displayText = text;
    const chipsMatch = displayText.match(/CHIPS:\s*(.+)/);
    if (chipsMatch) {
      chips.push(...chipsMatch[1].split("|").map((c) => c.trim()).filter(Boolean));
      displayText = displayText.replace(/CHIPS:\s*.+/, "").trim();
    }
    return { displayText, chips };
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

    const allMessages = [...messages, userMsg];
    const chatHistory: ChatMsg[] = allMessages.map((m) => ({ role: m.role, content: m.content }));

    // Prepend context as the first user message
    const contextMsg = `[CONTEXT] I'm writing to my ${audience}. Situation: ${situation}. Please help me compose a message.`;
    if (chatHistory.length <= 2) {
      chatHistory.unshift({ role: "user", content: contextMsg });
    }

    let assistantText = "";
    const assistantId = (Date.now() + 1).toString();

    const stripChips = (t: string) => t.replace(/CHIPS:\s*.*/g, "").trim();

    const upsertAssistant = (chunk: string) => {
      assistantText += chunk;
      const displayText = stripChips(assistantText);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) {
          return prev.map((m) => (m.id === assistantId ? { ...m, content: displayText } : m));
        }
        return [...prev, { id: assistantId, role: "assistant", content: displayText, timestamp: new Date() }];
      });
    };

    try {
      await streamChat({
        messages: chatHistory,
        preferences: prefs ? {
          pain_preference: prefs.pain_preference,
          identity_tags: prefs.identity_tags,
          buddy_name: prefs.buddy_name,
          intake_condition: prefs.intake_condition,
          intake_duration: prefs.intake_duration,
          intake_body_regions: prefs.intake_body_regions,
          intake_treatments: prefs.intake_treatments,
          my_symptoms: prefs.my_symptoms,
          communication_style: prefs.communication_style,
        } : undefined,
        mode: "communication",
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => {
          const { displayText, chips } = parseChips(assistantText);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: displayText, chips } : m))
          );
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error("Communication chat error:", e);
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleChipSelect = (chip: string) => sendMessage(chip);
  const latestAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button onClick={() => navigate("/resources")} className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold">Communication Helper</h1>
            <p className="text-xs text-muted-foreground">Craft messages you feel good about 💛</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Step 1: Audience picker */}
          {!audience && (
            <div className="space-y-3 animate-slide-up">
              <div className="chat-bubble-ai">
                <p className="text-[15px] leading-relaxed">
                  Who are you writing to? Pick one and I'll help you find the right words. ✨
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => handleAudienceSelect(a.label)}
                    className="flex items-center gap-2 rounded-2xl border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-95"
                  >
                    <span className="text-xl">{a.emoji}</span>
                    <span className="text-sm font-semibold">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Situation picker */}
          {audience && !situation && (
            <div className="space-y-3 animate-slide-up">
              <div className="chat-bubble-ai">
                <p className="text-[15px] leading-relaxed">
                  Writing to your <strong>{audience.toLowerCase()}</strong> — got it. What's the situation?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {getSituations(audience).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSituationSelect(s)}
                    className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-all hover:border-primary/40 hover:shadow-sm active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}>
                {!isUser && <span className="mr-2 mt-1 text-xl">💬</span>}
                <div className="max-w-[78%] space-y-1">
                  <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
                    <MessageContent content={msg.content} />
                  </div>
                  {!isUser && msg.id === latestAssistantId && msg.chips && msg.chips.length > 0 && (
                    <QuickChips chips={msg.chips} onSelect={handleChipSelect} disabled={isLoading} />
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center">
              <span className="mr-2 text-xl">💬</span>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input bar — only show after chat has started */}
      {audience && situation && (
        <div className="fixed left-0 right-0 border-t bg-card/95 px-4 py-3 backdrop-blur-md" style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Describe what you want to say..."
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
      )}

      <BottomNav />
    </div>
  );
};

export default CommunicationPage;
