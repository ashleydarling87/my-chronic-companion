import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Loader2, Send } from "lucide-react";
import { streamChat, parseIntakeResponse, type ChatMsg } from "@/lib/chatStream";

const AGE_RANGES = ["17–24", "25–30", "31–36", "37–42", "43–50", "51–60", "60+"];

const PAIN_PREFS = [
  { value: "numeric", label: "0–10 Scale", desc: "Classic slider from 0 to 10", emoji: "🔢" },
  { value: "verbal", label: "Word Scale", desc: "None, mild, moderate, severe", emoji: "💬" },
  { value: "faces", label: "Faces", desc: "Emoji faces to express pain", emoji: "😊" },
];

const BUDDY_AVATARS = [
  { id: "bear", emoji: "🐻", name: "Bear" },
  { id: "cat", emoji: "🐱", name: "Cat" },
  { id: "dog", emoji: "🐶", name: "Dog" },
  { id: "owl", emoji: "🦉", name: "Owl" },
  { id: "fox", emoji: "🦊", name: "Fox" },
  { id: "rabbit", emoji: "🐰", name: "Rabbit" },
];

const getBuddyEmoji = (id: string) => BUDDY_AVATARS.find((a) => a.id === id)?.emoji || "🐻";

interface IntakeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  chips?: string[];
  timestamp: Date;
}

const IntakeChat = ({
  buddyName,
  buddyAvatar,
  painPref,
  onComplete,
}: {
  buddyName: string;
  buddyAvatar: string;
  painPref: string;
  onComplete: () => void;
}) => {
  const emoji = getBuddyEmoji(buddyAvatar);
  const [messages, setMessages] = useState<IntakeMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content: `Hey! I'm ${buddyName} ${emoji} — so glad you're here! I'd love to get to know you a little before we start. What brings you to Pain Buddy?`,
      chips: ["Chronic pain", "Fibromyalgia", "I'm not sure yet", "Multiple things"],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: IntakeMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const allMessages = [...messages, userMsg];
    const chatHistory: ChatMsg[] = allMessages
      .filter((m) => m.id !== "initial")
      .map((m) => ({ role: m.role, content: m.content }));

    if (allMessages[0].id === "initial") {
      chatHistory.unshift({ role: "assistant", content: allMessages[0].content });
    }

    let assistantText = "";
    const assistantId = (Date.now() + 1).toString();

    const upsertAssistant = (chunk: string) => {
      assistantText += chunk;
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
        preferences: {
          pain_preference: painPref,
          buddy_name: buddyName,
          buddy_avatar: buddyAvatar,
        },
        mode: "intake",
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => {
          const { displayText, chips, intakeData } = parseIntakeResponse(assistantText);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: displayText, chips } : m))
          );
          setIsLoading(false);

          if (intakeData) {
            // Intake is complete — short delay then proceed
            setTimeout(() => onComplete(), 2000);
          }
        },
      });
    } catch (e) {
      console.error("Intake chat error:", e);
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const latestAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isLatest = msg.id === latestAssistantId;
          return (
            <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}>
              {!isUser && <span className="mr-2 mt-1 text-xl">{emoji}</span>}
              <div className="max-w-[78%] space-y-1">
                <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {!isUser && isLatest && msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 animate-slide-up">
                    {msg.chips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => sendMessage(chip)}
                        disabled={isLoading}
                        className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/15 hover:border-primary/50 disabled:opacity-40"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && !messages.some((m) => m.id === (Date.now() + 1).toString()) && (
          <div className="flex items-center">
            <span className="mr-2 text-xl">{emoji}</span>
            <div className="flex items-center gap-1 chat-bubble-ai w-fit">
              <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Tell me about yourself..."
            disabled={isLoading}
            className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [ageRange, setAgeRange] = useState("");
  const [painPref, setPainPref] = useState("numeric");
  const [buddyAvatar, setBuddyAvatar] = useState("bear");
  const [buddyName, setBuddyName] = useState("Buddy");
  const [saving, setSaving] = useState(false);

  const totalSteps = 4; // age → pain pref → buddy setup → intake chat

  const canAdvance = () => {
    if (step === 0) return !!ageRange;
    if (step === 1) return !!painPref;
    if (step === 2) return buddyName.trim().length > 0;
    return true;
  };

  const saveProgress = async (complete = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const row: Record<string, unknown> = {
      user_id: user.id,
      age_range: ageRange || null,
      pain_preference: painPref,
      buddy_avatar: buddyAvatar,
      buddy_name: buddyName.trim() || "Buddy",
      onboarding_complete: complete,
    };

    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("user_preferences").update(row).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("user_preferences").insert(row);
      if (error) throw error;
    }
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else if (step === 2) {
      // Save buddy setup then enter intake chat
      setSaving(true);
      try {
        await saveProgress(false);
        setStep(3);
      } catch (e: any) {
        toast.error(e.message || "Failed to save");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleIntakeComplete = async () => {
    setSaving(true);
    try {
      await saveProgress(true);
      toast.success(`${buddyName} is ready! Let's go 💛`);
      navigate("/");
    } catch (e: any) {
      toast.error(e.message || "Failed to complete onboarding");
    } finally {
      setSaving(false);
    }
  };

  // Intake chat step — full screen
  if (step === 3) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b bg-card/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getBuddyEmoji(buddyAvatar)}</span>
              <div>
                <h2 className="text-sm font-bold">{buddyName}</h2>
                <p className="text-[10px] text-muted-foreground">Getting to know you</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`} />
              ))}
            </div>
          </div>
        </div>

        <IntakeChat
          buddyName={buddyName}
          buddyAvatar={buddyAvatar}
          painPref={painPref}
          onComplete={handleIntakeComplete}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-secondary"}`}
            />
          ))}
        </div>
      </div>

      <main className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Step 0: Age Range */}
          {step === 0 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">👋</span>
                <h2 className="text-xl font-extrabold">Welcome! Let's get started</h2>
                <p className="text-sm text-muted-foreground">First, what's your age range?</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AGE_RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setAgeRange(r)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      ageRange === r
                        ? "bg-primary text-primary-foreground scale-105"
                        : "bg-card border text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Pain Preference */}
          {step === 1 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">📊</span>
                <h2 className="text-xl font-extrabold">How do you describe pain?</h2>
                <p className="text-sm text-muted-foreground">Choose the scale that feels most natural</p>
              </div>
              <div className="space-y-2">
                {PAIN_PREFS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPainPref(p.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                      painPref === p.value
                        ? "bg-primary text-primary-foreground scale-[1.02]"
                        : "bg-card border text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <div>
                      <span className="text-sm font-bold">{p.label}</span>
                      <p className={`text-xs ${painPref === p.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Buddy Setup */}
          {step === 2 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">✨</span>
                <h2 className="text-xl font-extrabold">Meet your buddy!</h2>
                <p className="text-sm text-muted-foreground">Choose an avatar and give them a name</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {BUDDY_AVATARS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setBuddyAvatar(a.id)}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-4 transition-all ${
                      buddyAvatar === a.id
                        ? "bg-primary/15 border-2 border-primary scale-105"
                        : "bg-card border hover:bg-primary/5"
                    }`}
                  >
                    <span className="text-3xl">{a.emoji}</span>
                    <span className="text-xs font-medium">{a.name}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">What should we call them?</label>
                <input
                  type="text"
                  value={buddyName}
                  onChange={(e) => setBuddyName(e.target.value.slice(0, 20))}
                  placeholder="e.g. Buddy, Luna, Max..."
                  maxLength={20}
                  className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/15 p-4">
                <span className="text-3xl">{getBuddyEmoji(buddyAvatar)}</span>
                <div>
                  <p className="text-sm font-bold">{buddyName || "Buddy"}</p>
                  <p className="text-xs text-muted-foreground">Ready to get to know you!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Navigation */}
      <div className="px-6 pb-8">
        <div className="mx-auto flex max-w-sm gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center justify-center gap-1 rounded-2xl border bg-card px-5 py-3 text-sm font-semibold transition-all hover:bg-secondary"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Setting up...</>
            ) : step === 2 ? (
              <>Chat with {buddyName} <ChevronRight size={16} /></>
            ) : (
              <>Continue <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
