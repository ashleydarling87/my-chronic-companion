import { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface DbEntry {
  id: string;
  created_at: string;
  pain_level: number | null;
  pain_verbal: string | null;
  energy_level: number | null;
  mood: string | null;
  sleep_hours: number | null;
  symptoms: string[];
  triggers: string[];
  body_regions: string[];
  qualities: string[];
  impacts: Record<string, number>;
  reliefs: string[];
  summary: string | null;
  severity: string | null;
  raw_text: string | null;
  journal_text: string | null;
  felt_dismissed_by_provider: boolean;
  experienced_discrimination: boolean;
  context_notes: string | null;
  emergency: boolean;
  share_with_doctor_flags: { includeContextNotes: boolean; includeDiscriminationNotes: boolean };
}

const MOOD_OPTIONS = ["😊 Great", "🙂 Good", "😐 Okay", "😔 Low", "😢 Awful"];
const VERBAL_OPTIONS = ["none", "mild", "moderate", "severe", "unbearable"];

const BODY_REGION_OPTIONS = [
  "head", "neck", "upper_back", "lower_back", "shoulders", "arms", "hands",
  "chest", "abdomen", "hips", "legs", "knees", "feet", "full_body",
];

const COMMON_SYMPTOMS = [
  "fatigue", "nausea", "headache", "dizziness", "brain fog", "stiffness",
  "swelling", "numbness", "tingling", "cramping", "weakness", "insomnia",
  "anxiety", "frustration", "lower back pain",
];

const COMMON_TRIGGERS = [
  "stress", "weather", "poor sleep", "overexertion", "sitting too long",
  "standing for too long", "work stress", "cold", "heat", "food", "travel",
  "dehydration", "skipped medication",
];

const ScoreBadge = ({ label, score, type }: { label: string; score: number; type: "pain" | "energy" }) => {
  const getColor = () => {
    if (type === "pain") {
      if (score <= 3) return "bg-pain-low/15 text-pain-low";
      if (score <= 6) return "bg-pain-mid/15 text-pain-mid";
      return "bg-pain-high/15 text-pain-high";
    }
    if (score >= 7) return "bg-energy-high/15 text-energy-high";
    if (score >= 4) return "bg-energy-mid/15 text-energy-mid";
    return "bg-energy-low/15 text-energy-low";
  };
  return (
    <span className={`score-pill ${getColor()}`}>
      {label} {score}/10
    </span>
  );
};

const ScoreSlider = ({ label, value, onChange, type }: { label: string; value: number; onChange: (v: number) => void; type: "pain" | "energy" }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold">{label}</span>
      <ScoreBadge label="" score={value} type={type} />
    </div>
    <input type="range" min={0} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
  </div>
);

/** Editable chip list: toggle from suggestions + add custom items */
const EditableChipList = ({
  label,
  items,
  onChange,
  suggestions,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  suggestions: string[];
}) => {
  const [customInput, setCustomInput] = useState("");

  const toggle = (item: string) => {
    onChange(items.includes(item) ? items.filter((i) => i !== item) : [...items, item]);
  };

  const addCustom = () => {
    const trimmed = customInput.trim().toLowerCase().slice(0, 50);
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setCustomInput("");
  };

  // Show suggestions + any custom items not in suggestions
  const allOptions = [...new Set([...suggestions, ...items])];

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {allOptions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              items.includes(item)
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-secondary text-secondary-foreground hover:bg-primary/10"
            }`}
          >
            {item.replace(/_/g, " ")}
            {items.includes(item) && <span className="ml-1">×</span>}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder={`Add custom ${label.toLowerCase()}…`}
          maxLength={50}
          className="flex-1 rounded-xl border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="rounded-xl bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-primary/10 disabled:opacity-40"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
};

const EntryEditForm = ({ entry, onClose, onSaved }: { entry: DbEntry; onClose: () => void; onSaved: () => void }) => {
  const { prefs } = useUserPreferences();
  const painPref = prefs?.pain_preference || "numeric";

  const [painLevel, setPainLevel] = useState(entry.pain_level ?? 5);
  const [painVerbal, setPainVerbal] = useState(entry.pain_verbal ?? "moderate");
  const [energyLevel, setEnergyLevel] = useState(entry.energy_level ?? 5);
  const [mood, setMood] = useState(entry.mood ?? "😐 Okay");
  const [sleepHours, setSleepHours] = useState(String(entry.sleep_hours ?? "7"));
  const [journalText, setJournalText] = useState(entry.journal_text ?? "");
  const [symptoms, setSymptoms] = useState<string[]>(entry.symptoms ?? []);
  const [triggers, setTriggers] = useState<string[]>(entry.triggers ?? []);
  const [bodyRegions, setBodyRegions] = useState<string[]>(entry.body_regions ?? []);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const updates: Record<string, unknown> = {
        energy_level: energyLevel,
        mood,
        sleep_hours: parseFloat(sleepHours) || 0,
        journal_text: journalText || null,
        symptoms,
        triggers,
        body_regions: bodyRegions,
      };
      if (painPref === "verbal") {
        updates.pain_verbal = painVerbal;
      } else {
        updates.pain_level = painLevel;
      }

      const { error } = await supabase.from("entries").update(updates).eq("id", entry.id);
      if (error) throw error;
      toast.success("Entry updated!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Failed to update entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Edit Entry</h2>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"><X size={16} /></button>
      </div>

      {/* Pain */}
      {painPref === "verbal" ? (
        <div className="space-y-1.5">
          <span className="text-sm font-semibold">Pain Level</span>
          <div className="flex flex-wrap gap-2">
            {VERBAL_OPTIONS.map((v) => (
              <button key={v} onClick={() => setPainVerbal(v)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all ${painVerbal === v ? "bg-primary text-primary-foreground scale-105" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>{v}</button>
            ))}
          </div>
        </div>
      ) : (
        <ScoreSlider label="Pain Level" value={painLevel} onChange={setPainLevel} type="pain" />
      )}

      <ScoreSlider label="Energy Level" value={energyLevel} onChange={setEnergyLevel} type="energy" />

      {/* Mood */}
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Mood</span>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button key={m} onClick={() => setMood(m)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${mood === m ? "bg-primary text-primary-foreground scale-105" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Sleep (hours)</span>
        <input type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Body Regions */}
      <EditableChipList label="Body regions" items={bodyRegions} onChange={setBodyRegions} suggestions={BODY_REGION_OPTIONS} />

      {/* Symptoms */}
      <EditableChipList label="Symptoms" items={symptoms} onChange={setSymptoms} suggestions={COMMON_SYMPTOMS} />

      {/* Triggers */}
      <EditableChipList label="Triggers" items={triggers} onChange={setTriggers} suggestions={COMMON_TRIGGERS} />

      {/* Journal */}
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Your notes</span>
        <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
      </div>

      <button onClick={handleSave} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all disabled:opacity-50">
        {submitting ? <><Loader2 size={16} className="animate-spin" />Saving...</> : "Save Changes"}
      </button>
    </div>
  );
};

export default EntryEditForm;
export type { DbEntry };
