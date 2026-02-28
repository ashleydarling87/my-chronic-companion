import { useUserPreferences, type CommunicationStyle } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OPTIONS: { key: keyof CommunicationStyle; label: string; choices: { value: string; label: string }[] }[] = [
  {
    key: "message_length",
    label: "Message length",
    choices: [
      { value: "", label: "Auto-detect" },
      { value: "short", label: "Keep it short" },
      { value: "medium", label: "Medium" },
      { value: "detailed", label: "Detailed" },
    ],
  },
  {
    key: "tone",
    label: "Tone",
    choices: [
      { value: "", label: "Auto-detect" },
      { value: "casual", label: "Casual & chill" },
      { value: "warm", label: "Warm & supportive" },
      { value: "direct", label: "Direct & matter-of-fact" },
    ],
  },
  {
    key: "emoji_usage",
    label: "Emoji",
    choices: [
      { value: "", label: "Auto-detect" },
      { value: "lots", label: "Lots of emoji 🎉" },
      { value: "some", label: "Some emoji" },
      { value: "none", label: "No emoji" },
    ],
  },
  {
    key: "vocabulary",
    label: "Vocabulary",
    choices: [
      { value: "", label: "Auto-detect" },
      { value: "simple", label: "Simple & plain" },
      { value: "conversational", label: "Conversational" },
      { value: "expressive", label: "Colorful & expressive" },
    ],
  },
  {
    key: "humor",
    label: "Humor",
    choices: [
      { value: "", label: "Auto-detect" },
      { value: "funny", label: "Make me laugh" },
      { value: "light", label: "Light humor" },
      { value: "serious", label: "Keep it serious" },
    ],
  },
];

const CommunicationStyleCard = () => {
  const { prefs, savePrefs } = useUserPreferences();
  const style = prefs?.communication_style || {};

  const updateStyle = async (key: keyof CommunicationStyle, value: string) => {
    if (!prefs?.id) return;
    const updated = { ...style, [key]: value };
    Object.keys(updated).forEach((k) => {
      if (!updated[k as keyof CommunicationStyle]) delete updated[k as keyof CommunicationStyle];
    });
    await savePrefs({ communication_style: updated } as any);
  };

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Communication Style</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Set your preferences or leave on "Auto-detect" — the AI will learn from how you chat.
        </p>
      </div>
      {OPTIONS.map(({ key, label, choices }) => (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">{label}</label>
          <div className="flex flex-wrap gap-1.5">
            {choices.map((c) => {
              const isActive = (style[key] || "") === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => updateStyle(key, c.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary/15 border-primary text-foreground"
                      : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
};

export default CommunicationStyleCard;
