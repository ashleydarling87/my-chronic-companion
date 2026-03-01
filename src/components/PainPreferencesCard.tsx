import { useState } from "react";
import { X } from "lucide-react";
import type { UserPreferences } from "@/hooks/useUserPreferences";
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
  { value: "white", label: "I'm White" },
  { value: "black", label: "I'm Black or African American" },
  { value: "hispanic_latino", label: "I'm Hispanic or Latino/a" },
  { value: "asian", label: "I'm Asian" },
  { value: "native_american", label: "I'm American Indian or Alaska Native" },
  { value: "pacific_islander", label: "I'm Native Hawaiian or Pacific Islander" },
  { value: "middle_eastern", label: "I'm Middle Eastern or North African" },
  { value: "multiracial", label: "I'm Multiracial" },
  { value: "lgbtq", label: "I'm LGBTQ+" },
  { value: "trans_ftm", label: "I'm Trans FTM" },
  { value: "trans_mtf", label: "I'm Trans MTF" },
  { value: "man", label: "I'm a Man" },
  { value: "woman", label: "I'm a Woman" },
  { value: "gender_fluid", label: "I'm Gender Fluid" },
  { value: "neurodivergent", label: "I'm Neurodivergent" },
];

interface Props {
  painPref: UserPreferences["pain_preference"];
  onPainPrefChange: (v: UserPreferences["pain_preference"]) => void;
  misNote: string;
  onMisNoteChange: (v: string) => void;
  identityTags: string[];
  onIdentityTagsChange: (v: string[]) => void;
}

export default function PainPreferencesCard({ painPref, onPainPrefChange, misNote, onMisNoteChange, identityTags, onIdentityTagsChange }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewPref, setPreviewPref] = useState<UserPreferences["pain_preference"]>("numeric");

  const openPreview = (value: UserPreferences["pain_preference"]) => {
    setPreviewPref(value);
    setSheetOpen(true);
  };

  const confirmSelection = () => {
    onPainPrefChange(previewPref);
    setSheetOpen(false);
  };

  const toggleIdentity = (tag: string) => {
    onIdentityTagsChange(
      identityTags.includes(tag) ? identityTags.filter((t) => t !== tag) : [...identityTags, tag]
    );
  };

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-5 animate-slide-up">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
        Pain & Communication Preferences
      </h2>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Preferred way to talk about pain</label>
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

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">What do people usually misunderstand about your health?</label>
        <textarea
          value={misNote}
          onChange={(e) => onMisNoteChange(e.target.value)}
          placeholder="e.g., They think I'm exaggerating, or that because I'm young it can't be that bad…"
          rows={3}
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Optional identity & context</label>
        <div className="rounded-xl bg-destructive/10 p-3 flex gap-2 items-start">
          <span className="text-base mt-0.5">❤️</span>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>This is completely optional.</strong> Your identity information is never shared outside this app. We ask because different folks often receive different care in healthcare, and we want to empower everyone to be their own #1 advocate. This simply helps us tailor your experience.
          </p>
        </div>
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

      <div className="rounded-xl bg-primary/10 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          🤎 <strong>Your experience matters.</strong> These preferences help Buddy understand how you communicate about pain
          and ensure your reports reflect your story — on your terms.
        </p>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-6 pt-0">
          <SheetHeader className="relative pt-5 pb-2">
            <button
              onClick={() => setSheetOpen(false)}
              className="absolute right-0 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <SheetTitle className="text-base">
              {PAIN_OPTIONS.find((o) => o.value === previewPref)?.label}
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <PainScalePreview type={previewPref} />
          </div>
          <button
            onClick={confirmSelection}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
          >
            Select
          </button>
        </SheetContent>
      </Sheet>
    </section>
  );
}
