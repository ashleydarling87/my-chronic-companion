import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

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

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [ageRange, setAgeRange] = useState("");
  const [painPref, setPainPref] = useState("numeric");
  const [buddyAvatar, setBuddyAvatar] = useState("bear");
  const [buddyName, setBuddyName] = useState("Buddy");
  const [saving, setSaving] = useState(false);

  const totalSteps = 3;

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

    // Check if preferences already exist
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("user_preferences")
        .update(row)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("user_preferences")
        .insert(row);
      if (error) throw error;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Final step — save and go to chat
      setSaving(true);
      try {
        await saveProgress(true);
        toast.success(`${buddyName} is ready to chat! 💛`);
        navigate("/");
      } catch (e: any) {
        toast.error(e.message || "Failed to save");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
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

              {/* Avatar selection */}
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

              {/* Name input */}
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

              {/* Preview */}
              <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/15 p-4">
                <span className="text-3xl">{BUDDY_AVATARS.find((a) => a.id === buddyAvatar)?.emoji}</span>
                <div>
                  <p className="text-sm font-bold">{buddyName || "Buddy"}</p>
                  <p className="text-xs text-muted-foreground">Ready to help you track & understand your pain</p>
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
            ) : step === totalSteps - 1 ? (
              <>Start Chatting <ChevronRight size={16} /></>
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
