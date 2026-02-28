import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { UserPreferences, useUserPreferences } from "@/hooks/useUserPreferences";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PAIN_OPTIONS: { value: UserPreferences["pain_preference"]; label: string; description: string }[] = [
  { value: "numeric", label: "Numbers (0–10)", description: "Rate pain on a scale" },
  { value: "verbal", label: "Words", description: "None → Unbearable" },
  { value: "faces", label: "Faces / icons", description: "Visual expressions" },
  { value: "adaptive", label: "Let Buddy choose", description: "Adapts each time" },
];

const VERBAL_LABELS = ["none", "mild", "moderate", "severe", "unbearable"];
const FACE_ITEMS = [
  { emoji: "😊", label: "No pain" },
  { emoji: "😐", label: "Mild" },
  { emoji: "😣", label: "Moderate" },
  { emoji: "😖", label: "Severe" },
  { emoji: "😭", label: "Unbearable" },
];

const PainScalePreview = ({ type }: { type: UserPreferences["pain_preference"] }) => {
  if (type === "numeric") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Rate your pain on a number scale from 0 to 10.</p>
        <div className="flex items-center justify-between gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${i === 5 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{i}</div>
          ))}
        </div>
      </div>
    );
  }
  if (type === "verbal") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Describe your pain using words instead of numbers.</p>
        <div className="flex flex-wrap gap-2">
          {VERBAL_LABELS.map((v, i) => (
            <span key={v} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${i === 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{v}</span>
          ))}
        </div>
      </div>
    );
  }
  if (type === "faces") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Use face icons to express how much pain you feel.</p>
        <div className="flex flex-wrap gap-2">
          {FACE_ITEMS.map((f, i) => (
            <div key={f.label} className={`flex flex-col items-center rounded-xl px-3 py-2 text-xs font-semibold ${i === 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <span className="text-lg">{f.emoji}</span>
              <span className="text-[10px] mt-0.5">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // adaptive
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Buddy will pick the best way to ask about your pain each time — numbers, words, or faces — based on the conversation.</p>
      <div className="flex gap-3 text-2xl justify-center">
        <span>🔢</span><span>💬</span><span>😊</span>
      </div>
    </div>
  );
};

const IDENTITY_OPTIONS = [
  { value: "black", label: "I identify as Black" },
  { value: "indigenous", label: "I identify as Indigenous" },
  { value: "disabled", label: "I'm disabled" },
  { value: "chronic_illness", label: "I'm living with chronic illness" },
];

export default function PainPreferencesCard() {
  const { prefs, loading, savePrefs } = useUserPreferences();

  const [painPref, setPainPref] = useState<UserPreferences["pain_preference"]>("numeric");
  const [misNote, setMisNote] = useState("");
  const [identityTags, setIdentityTags] = useState<string[]>([]);
  const [includeDiscrimination, setIncludeDiscrimination] = useState(false);
  const [includeEmotional, setIncludeEmotional] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewPref, setPreviewPref] = useState<UserPreferences["pain_preference"]>("numeric");

  useEffect(() => {
    if (prefs) {
      setPainPref(prefs.pain_preference);
      setMisNote(prefs.pain_misunderstanding_note);
      setIdentityTags(prefs.identity_tags);
      setIncludeDiscrimination(prefs.report_sharing_defaults.includeDiscrimination);
      setIncludeEmotional(prefs.report_sharing_defaults.includeEmotionalImpact);
    }
  }, [prefs]);

  const openPreview = (value: UserPreferences["pain_preference"]) => {
    setPreviewPref(value);
    setSheetOpen(true);
  };

  const confirmSelection = () => {
    setPainPref(previewPref);
    setDirty(true);
    setSheetOpen(false);
  };

  const handleSave = () => {
    savePrefs({
      pain_preference: painPref,
      pain_misunderstanding_note: misNote,
      identity_tags: identityTags,
      report_sharing_defaults: {
        includeDiscrimination,
        includeEmotionalImpact: includeEmotional,
      },
    });
    setDirty(false);
  };

  const toggleIdentity = (tag: string) => {
    setIdentityTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setDirty(true);
  };

  if (loading) {
    return (
      <section className="rounded-2xl border bg-card p-4 animate-pulse">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="mt-4 h-20 rounded bg-muted" />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-5 animate-slide-up">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
        Pain & Communication Preferences
      </h2>

      {/* Pain format */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Preferred way to talk about pain
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAIN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => openPreview(opt.value)}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                painPref === opt.value
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "bg-background hover:bg-secondary/50"
              }`}
            >
              <span className="font-semibold">{opt.label}</span>
              <span className="block text-[11px] text-muted-foreground">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Misunderstanding note */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">
          What do people usually misunderstand about your pain?
        </label>
        <textarea
          value={misNote}
          onChange={(e) => { setMisNote(e.target.value); setDirty(true); }}
          placeholder="e.g., They think I'm exaggerating, or that because I'm young it can't be that bad…"
          rows={3}
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Identity tags (opt-in) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Optional identity & context
        </label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This is only used to tailor Buddy's language and your reports. You can change this anytime.
        </p>
        <div className="flex flex-wrap gap-2">
          {IDENTITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleIdentity(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                identityTags.includes(opt.value)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "bg-background text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sharing defaults */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground">
          Sharing defaults for doctor reports
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeDiscrimination}
            onChange={(e) => { setIncludeDiscrimination(e.target.checked); setDirty(true); }}
            className="mt-0.5 h-4 w-4 rounded border-primary accent-primary"
          />
          <span className="text-sm leading-snug">
            Include notes about discrimination or being dismissed in my reports
            <span className="block text-[11px] text-muted-foreground">You can still turn this off per report.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeEmotional}
            onChange={(e) => { setIncludeEmotional(e.target.checked); setDirty(true); }}
            className="mt-0.5 h-4 w-4 rounded border-primary accent-primary"
          />
          <span className="text-sm leading-snug">
            Include emotional and spiritual impact in my reports
          </span>
        </label>
      </div>

      {/* Save button */}
      {dirty && (
        <button
          onClick={handleSave}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
        >
          Save Preferences
        </button>
      )}

      <div className="rounded-xl bg-primary/10 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          🤎 <strong>Your experience matters.</strong> These preferences help Buddy understand how you communicate about pain
          and ensure your reports reflect your story — on your terms.
        </p>
      </div>
    </section>
  );
}
