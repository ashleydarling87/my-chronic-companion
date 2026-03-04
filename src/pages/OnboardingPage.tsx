import { useState, useRef, useEffect } from "react";
import { softTap } from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferencesContext } from "@/contexts/UserPreferencesContext";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Loader2, Send } from "lucide-react";
import { streamChat, parseIntakeResponse, type ChatMsg } from "@/lib/chatStream";
import { BUDDY_AVATARS, getBuddyEmoji, SUGGESTED_SYMPTOMS, DIAGNOSIS_SYMPTOM_MAP } from "@/lib/data";
import { Search, Plus } from "lucide-react";

const AGE_RANGES_SELF = ["17–24", "25–30", "31–36", "37–42", "43–50", "51–60", "60+"];
const AGE_RANGES_CARETAKER = ["0–4", "5–9", "10–13", "14–17", "17–24", "25–30", "31–36", "37–42", "43–50", "51–60", "60+"];

const CONDITION_OPTIONS = [
  { label: "Chronic pain", emoji: "🩹" },
  { label: "Fibromyalgia", emoji: "🦋" },
  { label: "Autoimmune condition", emoji: "🔬" },
  { label: "Migraines / headaches", emoji: "🤕" },
  { label: "Post-surgical recovery", emoji: "🏥" },
  { label: "Anxiety / panic disorder", emoji: "😰" },
  { label: "Depression", emoji: "🌧️" },
  { label: "PTSD / trauma", emoji: "💔" },
  { label: "ADHD", emoji: "🧠" },
  { label: "Bipolar disorder", emoji: "🎭" },
  { label: "OCD", emoji: "🔁" },
  { label: "Autism", emoji: "♾️" },
  { label: "POTS", emoji: "💓" },
  { label: "PCOS", emoji: "🩺" },
  { label: "Cancer", emoji: "🎗️" },
];

const UNDIAGNOSED_TAGS = [
  "Waiting for testing",
  "Doctors aren't sure yet",
  "I'm just exploring",
];

const DIAGNOSIS_MODES = [
  { value: "diagnosed" as const, label: "I have diagnoses I want to track", emoji: "📋" },
  { value: "undiagnosed" as const, label: "I don't have a diagnosis yet", emoji: "🔍" },
  { value: "prefer_not_say" as const, label: "I'd rather not say right now", emoji: "🤐" },
];

const CONDITION_SYMPTOMS: Record<string, string[]> = {
  "Chronic pain": ["Fatigue", "Joint pain", "Muscle aches", "Stiffness", "Back pain", "Insomnia", "Numbness / tingling"],
  "Fibromyalgia": ["Fatigue", "Brain fog", "Muscle aches", "Insomnia", "Sensitivity to light", "Sensitivity to sound", "Anxiety", "Stiffness"],
  "Autoimmune condition": ["Fatigue", "Joint pain", "Swelling", "Brain fog", "Nausea", "Muscle aches", "Hot flashes"],
  "Migraines / headaches": ["Headache", "Sensitivity to light", "Sensitivity to sound", "Nausea", "Dizziness", "Brain fog", "Fatigue"],
  "Post-surgical recovery": ["Fatigue", "Stiffness", "Muscle aches", "Insomnia", "Swelling", "Numbness / tingling", "Anxiety"],
  "Anxiety / panic disorder": ["Anxiety", "Panic attacks", "Racing thoughts", "Chest tightness", "Shortness of breath", "Insomnia", "Nausea", "Muscle tension"],
  "Depression": ["Low mood", "Fatigue", "Insomnia", "Loss of appetite", "Difficulty concentrating", "Hopelessness", "Social withdrawal", "Brain fog"],
  "PTSD / trauma": ["Flashbacks", "Nightmares", "Anxiety", "Insomnia", "Hypervigilance", "Emotional numbness", "Fatigue", "Muscle tension"],
  "ADHD": ["Difficulty concentrating", "Brain fog", "Racing thoughts", "Restlessness", "Insomnia", "Fatigue", "Emotional dysregulation", "Forgetfulness"],
  "Bipolar disorder": ["Low mood", "Racing thoughts", "Insomnia", "Fatigue", "Anxiety", "Emotional dysregulation", "Difficulty concentrating", "Social withdrawal"],
  "OCD": ["Intrusive thoughts", "Anxiety", "Compulsive behaviors", "Insomnia", "Fatigue", "Difficulty concentrating", "Muscle tension"],
  "Undiagnosed symptoms": ["Fatigue", "Brain fog", "Dizziness", "Nausea", "Headache", "Anxiety", "Muscle aches"],
  "Other / not sure yet": [],
};

const USAGE_MODES = [
  { value: "self", label: "For myself", desc: "I'm tracking my own symptoms", emoji: "🙋" },
  { value: "caretaker", label: "As a caretaker", desc: "I'm helping someone else track theirs", emoji: "🤝" },
];

const PAIN_PREFS = [
  { value: "numeric", label: "Numbers (0–10)", desc: "Rate how you're feeling on a scale", emoji: "🔢" },
  { value: "verbal", label: "Words (none → severe)", desc: "None, mild, moderate, severe", emoji: "💬" },
  { value: "faces", label: "Faces (emoji)", desc: "Emoji faces to express how you feel", emoji: "😊" },
];

interface IntakeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  chips?: string[];
  timestamp: Date;
}

const READY_CHIP = "Ready to explore the app ✨";

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
      content: `Hey! I'm ${buddyName} ${emoji} — so glad you're here! I'd love to get to know you a little before we start. What brings you to CozyZebra?`,
      chips: ["Chronic pain", "Mental health", "A mix of things", "I'm not sure yet"],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [pendingIntakeData, setPendingIntakeData] = useState<Record<string, unknown> | null>(null);
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
            // Store intake data and show "Ready" chip instead of auto-navigating
            setPendingIntakeData(intakeData);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, chips: [READY_CHIP] } : m
              )
            );
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
                  <div className="space-y-2 mt-2 animate-slide-up">
                    <div className="flex flex-wrap gap-1.5">
                      {msg.chips.map((chip) => {
                        const isReady = chip === READY_CHIP;
                        const isSelected = selectedChips.includes(chip);
                        return (
                          <button
                            key={chip}
                            onClick={() => {
                              if (isReady) {
                                onComplete(pendingIntakeData);
                                return;
                              }
                              setSelectedChips((prev) =>
                                isSelected ? prev.filter((c) => c !== chip) : [...prev, chip]
                              );
                            }}
                            disabled={isLoading}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 ${
                              isReady
                                ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                                : isSelected
                                ? "bg-primary/20 border-primary/50 text-foreground"
                                : "border-primary/30 bg-primary/5 text-foreground hover:bg-primary/15 hover:border-primary/50"
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>
                    {selectedChips.length > 0 && (
                      <button
                        onClick={() => {
                          const combined = selectedChips.join(", ");
                          setSelectedChips([]);
                          sendMessage(combined);
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold transition-all hover:opacity-90"
                      >
                        <Send size={12} />
                        Send ({selectedChips.length})
                      </button>
                    )}
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

const ONBOARDING_STORAGE_KEY = "onboarding_progress";

const loadOnboardingProgress = () => {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

const saveOnboardingProgress = (data: Record<string, unknown>) => {
  try { sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data)); } catch {}
};

const clearOnboardingProgress = () => {
  sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { refreshPrefs } = useUserPreferencesContext();
  const saved = loadOnboardingProgress();
  const [step, setStep] = useState(saved?.step ?? 0);
  const [belongSelection, setBelongSelection] = useState<string[]>(saved?.belongSelection ?? []);
  const [usageMode, setUsageMode] = useState(saved?.usageMode ?? "self");
  const [diagnosisMode, setDiagnosisMode] = useState<"diagnosed" | "undiagnosed" | "prefer_not_say" | null>(saved?.diagnosisMode ?? null);
  const [undiagnosedTags, setUndiagnosedTags] = useState<string[]>(saved?.undiagnosedTags ?? []);
  const [suspectedConditions, setSuspectedConditions] = useState(saved?.suspectedConditions ?? "");
  const [conditionSearch, setConditionSearch] = useState("");
  const [ageRange, setAgeRange] = useState(saved?.ageRange ?? "");
  const [painPref, setPainPref] = useState(saved?.painPref ?? "numeric");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(saved?.selectedSymptoms ?? []);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [buddyAvatar, setBuddyAvatar] = useState(saved?.buddyAvatar ?? "bear");
  const [buddyName, setBuddyName] = useState(saved?.buddyName ?? "Buddy");
  const [saving, setSaving] = useState(false);

  const totalSteps = 7; // usage mode → belong → age → pain pref → symptoms → buddy setup → intake chat

  const canAdvance = () => {
    if (step === 0) return !!usageMode;
    if (step === 1) return !!diagnosisMode;
    if (step === 2) return !!ageRange;
    if (step === 3) return !!painPref;
    if (step === 4) return true; // symptoms optional
    if (step === 5) return buddyName.trim().length > 0;
    return true;
  };

  const saveProgress = async (complete = false, intakeData?: Record<string, unknown> | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error("Your session expired. Please sign in again.");

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
      row.intake_raw = {
        ...intakeData,
        diagnosis_mode: diagnosisMode,
        undiagnosed_tags: undiagnosedTags,
        suspected_conditions: suspectedConditions || null,
        selected_conditions: belongSelection,
      };
    } else {
      row.intake_raw = {
        diagnosis_mode: diagnosisMode,
        undiagnosed_tags: undiagnosedTags,
        suspected_conditions: suspectedConditions || null,
        selected_conditions: belongSelection,
      };
    }

    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("user_preferences").update(row).eq("id", existing.id);
      if (error) {
        if (error.message?.includes("foreign key") || error.message?.includes("user_not_found")) {
          await supabase.auth.signOut();
          throw new Error("Your account session is invalid. Please sign in again.");
        }
        throw error;
      }
    } else {
      const { error } = await supabase.from("user_preferences").insert(row);
      if (error) {
        if (error.message?.includes("foreign key") || error.message?.includes("user_not_found")) {
          await supabase.auth.signOut();
          throw new Error("Your account session is invalid. Please sign in again.");
        }
        throw error;
      }
    }
  };

  const handleNext = async () => {
    const nextStep = step + 1;
    if (step < 5) {
      setStep(nextStep);
      saveOnboardingProgress({ step: nextStep, belongSelection, usageMode, diagnosisMode, undiagnosedTags, suspectedConditions, ageRange, painPref, selectedSymptoms, buddyAvatar, buddyName });
    } else if (step === 5) {
      // Save buddy setup then enter intake chat
      setSaving(true);
      try {
        await saveProgress(false);
        setStep(6);
        saveOnboardingProgress({ step: 6, belongSelection, usageMode, diagnosisMode, undiagnosedTags, suspectedConditions, ageRange, painPref, selectedSymptoms, buddyAvatar, buddyName });
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
      clearOnboardingProgress();
      toast.success(`${buddyName} is ready! Let's go 💛`);
      sessionStorage.setItem("just_onboarded", "true");
      // Hard navigate to avoid race condition where ProtectedRoute
      // still sees stale onboarding_complete=false before state updates
      window.location.replace("/log");
    } catch (e: any) {
      toast.error(e.message || "Failed to complete onboarding");
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
          {/* Step 0: Self or caretaker */}
          {step === 0 && (
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
                    onClick={() => { softTap(); setUsageMode(m.value); }}
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

          {/* Step 1: Conditions & Diagnoses */}
          {step === 1 && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">📋</span>
                <h2 className="text-xl font-extrabold">Do you have any diagnoses or conditions?</h2>
                <p className="text-sm text-muted-foreground">Add anything that helps you track patterns. You can skip this or change it later.</p>
              </div>

              {/* Three mode cards */}
              <div className="space-y-2">
                {DIAGNOSIS_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => { softTap(); setDiagnosisMode(mode.value); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                      diagnosisMode === mode.value
                        ? "bg-primary text-primary-foreground scale-[1.02]"
                        : "bg-card border text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <span className="text-2xl">{mode.emoji}</span>
                    <span className="text-sm font-bold">{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* Variant panels */}
              {diagnosisMode === "diagnosed" && (
                <div className="space-y-4 animate-slide-up">
                  {/* Selected conditions chips */}
                  {belongSelection.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {belongSelection.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-foreground">
                          {s}
                          <button onClick={() => setBelongSelection((prev) => prev.filter((x) => x !== s))} className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20">✕</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Common conditions</p>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {CONDITION_OPTIONS.filter((opt) => !belongSelection.includes(opt.label)).map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => { softTap(); setBelongSelection((prev) => [...prev, opt.label]); }}
                        className="rounded-full border border-muted bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/10 hover:border-primary/30"
                      >
                        {opt.emoji} {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Search / add field */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={conditionSearch}
                      onChange={(e) => setConditionSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && conditionSearch.trim() && !belongSelection.some((s) => s.toLowerCase() === conditionSearch.trim().toLowerCase())) {
                          setBelongSelection((prev) => [...prev, conditionSearch.trim()]);
                          setConditionSearch("");
                        }
                      }}
                      placeholder="Search or type another diagnosis…"
                      className="w-full rounded-xl border bg-background pl-9 pr-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {conditionSearch.trim() && !CONDITION_OPTIONS.some((o) => o.label.toLowerCase() === conditionSearch.trim().toLowerCase()) && !belongSelection.some((s) => s.toLowerCase() === conditionSearch.trim().toLowerCase()) && (
                    <button
                      onClick={() => { setBelongSelection((prev) => [...prev, conditionSearch.trim()]); setConditionSearch(""); }}
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      <Plus size={12} /> Add "{conditionSearch.trim()}"
                    </button>
                  )}

                  <button
                    onClick={() => { setDiagnosisMode("undiagnosed"); setBelongSelection([]); }}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    I'm not sure / still undiagnosed instead
                  </button>
                </div>
              )}

              {diagnosisMode === "undiagnosed" && (
                <div className="space-y-4 animate-slide-up">
                  <p className="text-sm text-muted-foreground">Totally okay. We'll focus on your symptoms, patterns, and what your days feel like.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {UNDIAGNOSED_TAGS.map((tag) => {
                      const selected = undiagnosedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => setUndiagnosedTags((prev) => selected ? prev.filter((t) => t !== tag) : [...prev, tag])}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                            selected
                              ? "bg-primary/20 border-primary/50 text-foreground"
                              : "border-muted bg-secondary/50 text-foreground hover:bg-primary/10 hover:border-primary/30"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">If you'd like, add any suspected conditions</label>
                    <input
                      value={suspectedConditions}
                      onChange={(e) => setSuspectedConditions(e.target.value)}
                      placeholder="Optional…"
                      className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              {diagnosisMode === "prefer_not_say" && (
                <div className="animate-slide-up">
                  <p className="text-sm text-muted-foreground">That's okay. You can add or edit diagnoses later in settings.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Age Range */}
          {step === 2 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <span className="text-4xl">👋</span>
                <h2 className="text-xl font-extrabold">
                  {usageMode === "caretaker" ? "About the person you're caring for" : "Welcome! Let's get started"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {usageMode === "caretaker" ? "What's their age range?" : "What's your age range?"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(usageMode === "caretaker" ? AGE_RANGES_CARETAKER : AGE_RANGES_SELF).map((r) => (
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
                <h2 className="text-xl font-extrabold">
                  {usageMode === "caretaker" ? "How do they like to rate how they're feeling?" : "How do you like to rate how you're feeling?"}
                </h2>
                <p className="text-sm text-muted-foreground">We'll use this for pain and other symptoms.</p>
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
                <h2 className="text-xl font-extrabold">
                  {usageMode === "caretaker" ? "What symptoms do they deal with?" : "What symptoms do you deal with?"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {usageMode === "caretaker"
                    ? "Choose any they're currently struggling with. You can always add more later in settings."
                    : "Choose any you're currently struggling with. You can always add more later in your profile settings."}
                </p>
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

              {/* Diagnosis-aware suggestions from search */}
              {(() => {
                const searchLower = symptomSearch.toLowerCase();
                // Check if search matches a diagnosis keyword
                const diagnosisMatches = searchLower
                  ? Object.entries(DIAGNOSIS_SYMPTOM_MAP)
                      .filter(([key]) => key.toLowerCase().includes(searchLower))
                      .flatMap(([, symptoms]) => symptoms)
                      .filter((s, i, arr) => arr.indexOf(s) === i)
                      .filter((s) => !selectedSymptoms.some((m) => m.toLowerCase() === s.toLowerCase()))
                  : [];

                if (diagnosisMatches.length > 0) {
                  return (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Related symptoms</p>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnosisMatches.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSymptoms((prev) => [...prev, s])}
                            className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/10 hover:border-primary/50"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

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
                const sorted = [
                  ...available.filter((s) => conditionRelevant.has(s)),
                  ...available.filter((s) => !conditionRelevant.has(s)),
                ];

                // Add catch-all meta-tag
                const CATCH_ALL = "I experience other things that are hard to describe";
                const showCatchAll = !selectedSymptoms.includes(CATCH_ALL) && !symptomSearch;

                return (
                  <div className="space-y-3">
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
                    {showCatchAll && (
                      <button
                        onClick={() => setSelectedSymptoms((prev) => [...prev, CATCH_ALL])}
                        className="rounded-full border border-dashed border-muted-foreground/30 bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/5 hover:border-primary/30 hover:text-foreground"
                      >
                        + {CATCH_ALL}
                      </button>
                    )}
                  </div>
                );
              })()}
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
