import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Loader2, Send } from "lucide-react";
import { streamChat, parseIntakeResponse, type ChatMsg } from "@/lib/chatStream";
import { BUDDY_AVATARS, getBuddyEmoji, SUGGESTED_SYMPTOMS } from "@/lib/data";

const AGE_RANGES = ["17–24", "25–30", "31–36", "37–42", "43–50", "51–60", "60+"];

const BELONG_OPTIONS = [
  { label: "Chronic pain", emoji: "🩹" },
  { label: "Fibromyalgia", emoji: "🦋" },
  { label: "Autoimmune condition", emoji: "🔬" },
  { label: "Migraines / headaches", emoji: "🤕" },
  { label: "Post-surgical recovery", emoji: "🏥" },
  { label: "Undiagnosed symptoms", emoji: "❓" },
  { label: "Other / not sure yet", emoji: "🌱" },
];

const CONDITION_SYMPTOMS: Record<string, string[]> = {
  "Chronic pain": ["Fatigue", "Joint pain", "Muscle aches", "Stiffness", "Back pain", "Insomnia", "Numbness / tingling"],
  "Fibromyalgia": ["Fatigue", "Brain fog", "Muscle aches", "Insomnia", "Sensitivity to light", "Sensitivity to sound", "Anxiety", "Stiffness"],
  "Autoimmune condition": ["Fatigue", "Joint pain", "Swelling", "Brain fog", "Nausea", "Muscle aches", "Hot flashes"],
  "Migraines / headaches": ["Headache", "Sensitivity to light", "Sensitivity to sound", "Nausea", "Dizziness", "Brain fog", "Fatigue"],
  "Post-surgical recovery": ["Fatigue", "Stiffness", "Muscle aches", "Insomnia", "Swelling", "Numbness / tingling", "Anxiety"],
  "Undiagnosed symptoms": ["Fatigue", "Brain fog", "Dizziness", "Nausea", "Headache", "Anxiety", "Muscle aches"],
  "Other / not sure yet": [],
};

const USAGE_MODES = [
  { value: "self", label: "For myself", desc: "I'm tracking my own symptoms", emoji: "🙋" },
  { value: "caretaker", label: "As a caretaker", desc: "I'm helping someone else track theirs", emoji: "🤝" },
];

const PAIN_PREFS = [
  { value: "numeric", label: "0–10 Scale", desc: "Classic slider from 0 to 10", emoji: "🔢" },
  { value: "verbal", label: "Word Scale", desc: "None, mild, moderate, severe", emoji: "💬" },
  { value: "faces", label: "Faces", desc: "Emoji faces to express pain", emoji: "😊" },
];

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
  onComplete: (intakeData: Record<string, unknown> | null) => void;
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
            setTimeout(() => onComplete(intakeData), 2000);
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
  const [belongSelection, setBelongSelection] = useState<string[]>([]);
  const [usageMode, setUsageMode] = useState("self");
  const [ageRange, setAgeRange] = useState("");
  const [painPref, setPainPref] = useState("numeric");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [buddyAvatar, setBuddyAvatar] = useState("bear");
  const [buddyName, setBuddyName] = useState("Buddy");
  const [saving, setSaving] = useState(false);

  const totalSteps = 7; // belong → usage mode → age → pain pref → symptoms → buddy setup → intake chat

  const canAdvance = () => {
    if (step === 0) return belongSelection.length > 0;
    if (step === 1) return !!usageMode;
    if (step === 2) return !!ageRange;
    if (step === 3) return !!painPref;
    if (step === 4) return true; // symptoms optional
    if (step === 5) return buddyName.trim().length > 0;
    return true;
  };

  const saveProgress = async (complete = false, intakeData?: Record<string, unknown> | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const row: Record<string, unknown> = {
      user_id: user.id,
      age_range: ageRange || null,
      pain_preference: painPref,
      buddy_avatar: buddyAvatar,
      buddy_name: buddyName.trim() || "Buddy",
      onboarding_complete: complete,
      usage_mode: usageMode,
      my_symptoms: selectedSymptoms,
    };

    if (intakeData) {
      row.intake_condition = intakeData.condition || intakeData.primary_condition || null;
      row.intake_duration = intakeData.duration || intakeData.pain_duration || null;
      row.intake_body_regions = intakeData.body_regions || intakeData.areas || [];
      row.intake_treatments = intakeData.treatments || intakeData.treatments_tried || [];
      row.intake_goals = intakeData.goals || intakeData.goal || null;
      row.intake_raw = intakeData;
    }

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
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      // Save buddy setup then enter intake chat
      setSaving(true);
      try {
        await saveProgress(false);
        setStep(6);
      } catch (e: any) {
        toast.error(e.message || "Failed to save");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleIntakeComplete = async (intakeData: Record<string, unknown> | null) => {
    setSaving(true);
    try {
      await saveProgress(true, intakeData);
      toast.success(`${buddyName} is ready! Let's go 💛`);
      sessionStorage.setItem("just_onboarded", "true");
      navigate("/");
    } catch (e: any) {
      toast.error(e.message || "Failed to complete onboarding");
    } finally {
      setSaving(false);
    }
  };

  // Intake chat step — full screen
  if (step === 6) {
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
          {/* Step 0: Do I belong here? */}
          {step === 0 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">💛</span>
                <h2 className="text-xl font-extrabold">You're in the right place</h2>
                <p className="text-sm text-muted-foreground">This app helps people living with ongoing health challenges. What resonates with you?</p>
              </div>
              <div className="space-y-2">
                {BELONG_OPTIONS.map((opt) => {
                  const selected = belongSelection.includes(opt.label);
                  return (
                    <button
                      key={opt.label}
                      onClick={() =>
                        setBelongSelection((prev) =>
                          selected ? prev.filter((s) => s !== opt.label) : [...prev, opt.label]
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground scale-[1.02]"
                          : "bg-card border text-foreground hover:bg-primary/10"
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="text-sm font-bold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center">Select all that apply</p>
            </div>
          )}

          {/* Step 1: Self or caretaker */}
          {step === 1 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">🤗</span>
                <h2 className="text-xl font-extrabold">Who is this for?</h2>
                <p className="text-sm text-muted-foreground">Are you tracking for yourself or helping someone else?</p>
              </div>
              <div className="space-y-2">
                {USAGE_MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setUsageMode(m.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                      usageMode === m.value
                        ? "bg-primary text-primary-foreground scale-[1.02]"
                        : "bg-card border text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <div>
                      <span className="text-sm font-bold">{m.label}</span>
                      <p className={`text-xs ${usageMode === m.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Age Range */}
          {step === 2 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">👋</span>
                <h2 className="text-xl font-extrabold">Welcome! Let's get started</h2>
                <p className="text-sm text-muted-foreground">What's your age range?</p>
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

          {/* Step 3: Pain Preference */}
          {step === 3 && (
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

          {/* Step 4: Symptoms */}
          {step === 4 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">🩺</span>
                <h2 className="text-xl font-extrabold">What symptoms do you deal with?</h2>
                <p className="text-sm text-muted-foreground">Choose any you're currently struggling with. You can always add more later in your profile settings.</p>
              </div>

              {/* Selected */}
              {selectedSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSymptoms.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      {s}
                      <button onClick={() => setSelectedSymptoms((prev) => prev.filter((x) => x !== s))} className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search */}
              <input
                value={symptomSearch}
                onChange={(e) => setSymptomSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && symptomSearch.trim() && !selectedSymptoms.some((s) => s.toLowerCase() === symptomSearch.trim().toLowerCase())) {
                    setSelectedSymptoms((prev) => [...prev, symptomSearch.trim()]);
                    setSymptomSearch("");
                  }
                }}
                placeholder="Search or type your own..."
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />

              {/* Add custom */}
              {symptomSearch.trim() && !SUGGESTED_SYMPTOMS.some((s) => s.toLowerCase() === symptomSearch.trim().toLowerCase()) && !selectedSymptoms.some((s) => s.toLowerCase() === symptomSearch.trim().toLowerCase()) && (
                <button
                  onClick={() => { setSelectedSymptoms((prev) => [...prev, symptomSearch.trim()]); setSymptomSearch(""); }}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  + Add "{symptomSearch.trim()}"
                </button>
              )}

              {/* Suggestions — prioritized by selected conditions */}
              {(() => {
                const conditionRelevant = new Set(
                  belongSelection.flatMap((c) => CONDITION_SYMPTOMS[c] || [])
                );
                const available = SUGGESTED_SYMPTOMS.filter(
                  (s) =>
                    !selectedSymptoms.some((m) => m.toLowerCase() === s.toLowerCase()) &&
                    (!symptomSearch || s.toLowerCase().includes(symptomSearch.toLowerCase()))
                );
                // Sort: condition-relevant first, then the rest
                const sorted = [
                  ...available.filter((s) => conditionRelevant.has(s)),
                  ...available.filter((s) => !conditionRelevant.has(s)),
                ];
                return (
              <div className="flex flex-wrap gap-1.5">
                {sorted.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSymptoms((prev) => [...prev, s])}
                    className="rounded-full border border-muted bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/10 hover:border-primary/30"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Buddy Setup */}
          {step === 5 && (
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
            ) : step === 5 ? (
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
