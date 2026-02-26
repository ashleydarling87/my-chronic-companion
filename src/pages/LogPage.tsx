import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Edit2, Check, X, Loader2, ChevronDown, ChevronUp, AlertTriangle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
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

const IMPACT_LABELS: Record<string, string> = {
  sleep: "Sleep",
  mobility: "Walking",
  work: "Work",
  family: "Family",
  mood: "Mood",
};

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

const VerbalBadge = ({ label, verbal }: { label: string; verbal: string }) => {
  const colorMap: Record<string, string> = {
    none: "bg-pain-low/15 text-pain-low",
    mild: "bg-pain-low/15 text-pain-low",
    moderate: "bg-pain-mid/15 text-pain-mid",
    severe: "bg-pain-high/15 text-pain-high",
    unbearable: "bg-pain-high/15 text-pain-high",
  };
  return (
    <span className={`score-pill ${colorMap[verbal] ?? "bg-secondary text-secondary-foreground"}`}>
      {label} {verbal}
    </span>
  );
};

const Chip = ({ text, variant = "default" }: { text: string; variant?: "default" | "primary" | "accent" }) => {
  const styles = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {text}
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

const MOOD_OPTIONS = ["😊 Great", "🙂 Good", "😐 Okay", "😔 Low", "😢 Awful"];

const VERBAL_OPTIONS = ["none", "mild", "moderate", "severe", "unbearable"];
const FACE_OPTIONS = [
  { emoji: "😊", label: "No pain", value: 0 },
  { emoji: "😐", label: "Mild", value: 3 },
  { emoji: "😣", label: "Moderate", value: 5 },
  { emoji: "😖", label: "Severe", value: 7 },
  { emoji: "😭", label: "Unbearable", value: 10 },
];

const PainInput = ({ preference, painLevel, setPainLevel, painVerbal, setPainVerbal }: {
  preference: string;
  painLevel: number;
  setPainLevel: (v: number) => void;
  painVerbal: string;
  setPainVerbal: (v: string) => void;
}) => {
  if (preference === "verbal") {
    return (
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Pain Level</span>
        <div className="flex flex-wrap gap-2">
          {VERBAL_OPTIONS.map((v) => (
            <button key={v} onClick={() => setPainVerbal(v)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all ${painVerbal === v ? "bg-primary text-primary-foreground scale-105" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>{v}</button>
          ))}
        </div>
      </div>
    );
  }
  if (preference === "faces") {
    return (
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Pain Level</span>
        <div className="flex flex-wrap gap-2">
          {FACE_OPTIONS.map((f) => (
            <button key={f.value} onClick={() => { setPainLevel(f.value); setPainVerbal(f.label.toLowerCase()); }} className={`flex flex-col items-center rounded-xl px-3 py-2 text-xs font-semibold transition-all ${painLevel === f.value ? "bg-primary text-primary-foreground scale-105" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
              <span className="text-lg">{f.emoji}</span>
              <span className="text-[10px] mt-0.5">{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  // numeric (default) or adaptive
  return <ScoreSlider label="Pain Level" value={painLevel} onChange={setPainLevel} type="pain" />;
};

const CheckInForm = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const navigate = useNavigate();
  const { prefs } = useUserPreferences();
  const painPref = prefs?.pain_preference || "numeric";
  const [painLevel, setPainLevel] = useState(5);
  const [painVerbal, setPainVerbal] = useState("moderate");
  const [energyLevel, setEnergyLevel] = useState(5);
  const [mood, setMood] = useState("😐 Okay");
  const [sleepHours, setSleepHours] = useState("7");
  const [rawText, setRawText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        raw_text: rawText,
        energy_level: energyLevel,
        mood,
        sleep_hours: parseFloat(sleepHours) || 0,
      };
      if (painPref === "verbal") {
        body.pain_verbal = painVerbal;
      } else {
        body.pain_level = painLevel;
      }
      const { data, error } = await supabase.functions.invoke("processDailyEntry", {
        body,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Check-in saved!");
      onSaved();
      navigate("/summary", { state: { entry: data } });
    } catch (e: any) {
      toast.error(e.message || "Failed to save check-in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Daily Check-In</h2>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"><X size={16} /></button>
      </div>
      <PainInput preference={painPref} painLevel={painLevel} setPainLevel={setPainLevel} painVerbal={painVerbal} setPainVerbal={setPainVerbal} />
      <ScoreSlider label="Energy Level" value={energyLevel} onChange={setEnergyLevel} type="energy" />
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Mood</span>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button key={m} onClick={() => setMood(m)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${mood === m ? "bg-primary text-primary-foreground scale-105" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>{m}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Sleep (hours)</span>
        <input type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">How are you feeling? (optional)</span>
        <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Tell me everything…" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all disabled:opacity-50">
        {submitting ? <><Loader2 size={16} className="animate-spin" />Analyzing...</> : "Submit Check-In"}
      </button>
    </div>
  );
};

const EntryDetailView = ({ entry, onClose }: { entry: DbEntry; onClose: () => void }) => {
  const [flags, setFlags] = useState(entry.share_with_doctor_flags);

  const handleToggleFlag = async (key: "includeContextNotes" | "includeDiscriminationNotes") => {
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);
    await supabase.from("entries").update({ share_with_doctor_flags: updated }).eq("id", entry.id);
    toast.success("Sharing preference updated");
  };

  const impactEntries = Object.entries(entry.impacts || {}).filter(([, v]) => v > 0);

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{format(new Date(entry.created_at), "EEEE, MMM d")}</span>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"><X size={16} /></button>
      </div>

      {/* Scores */}
      <div className="flex flex-wrap gap-2">
        {entry.pain_level != null && <ScoreBadge label="Pain" score={entry.pain_level} type="pain" />}
        {entry.pain_verbal && !entry.pain_level && <VerbalBadge label="Pain" verbal={entry.pain_verbal} />}
        {entry.energy_level != null && <ScoreBadge label="Energy" score={entry.energy_level} type="energy" />}
        {entry.mood && <span className="score-pill bg-secondary text-secondary-foreground">{entry.mood}</span>}
        {entry.sleep_hours != null && <span className="score-pill bg-secondary text-secondary-foreground">💤 {entry.sleep_hours}h</span>}
      </div>

      {/* Body regions */}
      {entry.body_regions?.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Body locations</span>
          <div className="flex flex-wrap gap-1.5">{entry.body_regions.map((r) => <Chip key={r} text={r.replace(/_/g, " ")} variant="primary" />)}</div>
        </div>
      )}

      {/* Qualities */}
      {entry.qualities?.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Pain qualities</span>
          <div className="flex flex-wrap gap-1.5">{entry.qualities.map((q) => <Chip key={q} text={q} />)}</div>
        </div>
      )}

      {/* Symptoms */}
      {entry.symptoms?.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Symptoms</span>
          <div className="flex flex-wrap gap-1.5">{entry.symptoms.map((s) => <Chip key={s} text={s} />)}</div>
        </div>
      )}

      {/* Impacts */}
      {impactEntries.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Impact on daily life</span>
          {impactEntries.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs w-20">{IMPACT_LABELS[key] || key}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(Number(val) / 4) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{val}/4</span>
            </div>
          ))}
        </div>
      )}

      {/* Triggers */}
      {entry.triggers?.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Triggers</span>
          <div className="flex flex-wrap gap-1.5">{entry.triggers.map((t) => <Chip key={t} text={t} variant="primary" />)}</div>
        </div>
      )}

      {/* Reliefs */}
      {entry.reliefs?.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">What helped</span>
          <div className="flex flex-wrap gap-1.5">{entry.reliefs.map((r) => <Chip key={r} text={r} variant="accent" />)}</div>
        </div>
      )}

      {/* Summary */}
      {entry.summary && (
        <div className="rounded-xl bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">🐻 {entry.summary}</p>
        </div>
      )}

      {/* Journal */}
      {entry.journal_text && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Your words</span>
          <p className="text-sm text-foreground leading-relaxed">{entry.journal_text}</p>
        </div>
      )}

      {/* Context notes */}
      {(entry.felt_dismissed_by_provider || entry.experienced_discrimination) && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Context notes (private)</span>
          {entry.felt_dismissed_by_provider && <p className="text-xs">• Felt dismissed by a provider</p>}
          {entry.experienced_discrimination && <p className="text-xs">• Experienced discrimination</p>}
          {entry.context_notes && <p className="text-xs text-muted-foreground">{entry.context_notes}</p>}
        </div>
      )}

      {/* Sharing toggles */}
      <div className="space-y-2 border-t pt-3">
        <span className="text-xs font-semibold text-muted-foreground">Doctor report sharing</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={flags.includeContextNotes} onChange={() => handleToggleFlag("includeContextNotes")} className="h-3.5 w-3.5 rounded accent-primary" />
          <span className="text-xs">Include context notes</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={flags.includeDiscriminationNotes} onChange={() => handleToggleFlag("includeDiscriminationNotes")} className="h-3.5 w-3.5 rounded accent-primary" />
          <span className="text-xs">Include discrimination notes</span>
        </label>
      </div>
    </div>
  );
};

const EntryCard = ({ entry, onExpand }: { entry: DbEntry; onExpand: () => void }) => {
  const hasContext = entry.felt_dismissed_by_provider || entry.experienced_discrimination;
  const symptoms = (entry.symptoms || []).slice(0, 3);
  const impacts = Object.entries(entry.impacts || {}).filter(([, v]) => v > 0).slice(0, 2);
  const triggers = (entry.triggers || []).slice(0, 2);

  return (
    <button onClick={onExpand} className="w-full rounded-2xl border bg-card p-4 text-left transition-all hover:shadow-sm active:scale-[0.99] animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold">{format(new Date(entry.created_at), "EEE, MMM d")}</span>
        <div className="flex items-center gap-1.5">
          {hasContext && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Eye size={10} /> Context note
            </span>
          )}
          <ChevronDown size={14} className="text-muted-foreground" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {entry.pain_level != null && <ScoreBadge label="Pain" score={entry.pain_level} type="pain" />}
        {entry.pain_verbal && !entry.pain_level && <VerbalBadge label="Pain" verbal={entry.pain_verbal} />}
        {entry.energy_level != null && <ScoreBadge label="Energy" score={entry.energy_level} type="energy" />}
      </div>

      {symptoms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {symptoms.map((s) => <Chip key={s} text={s} />)}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {impacts.map(([k]) => <Chip key={k} text={IMPACT_LABELS[k] || k} variant="accent" />)}
        {triggers.map((t) => <Chip key={t} text={t} variant="primary" />)}
      </div>
    </button>
  );
};

const LogPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState<DbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load entries:", error);
      toast.error("Couldn't load your entries");
    } else {
      setEntries(
        (data || []).map((d: any) => ({
          ...d,
          symptoms: d.symptoms ?? [],
          triggers: d.triggers ?? [],
          body_regions: d.body_regions ?? [],
          qualities: d.qualities ?? [],
          impacts: d.impacts ?? {},
          reliefs: d.reliefs ?? [],
          share_with_doctor_flags: d.share_with_doctor_flags ?? { includeContextNotes: true, includeDiscriminationNotes: false },
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const expandedEntry = entries.find((e) => e.id === expandedId);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Symptom Log" subtitle="Your daily entries" />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg space-y-3">
          {showForm ? (
            <CheckInForm onClose={() => setShowForm(false)} onSaved={fetchEntries} />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Plus size={18} /> Add New Entry
            </button>
          )}

          {expandedEntry ? (
            <EntryDetailView entry={expandedEntry} onClose={() => setExpandedId(null)} />
          ) : (
            <>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border bg-card p-4 animate-pulse">
                      <div className="h-4 w-32 rounded bg-muted mb-3" />
                      <div className="flex gap-2">
                        <div className="h-6 w-20 rounded-full bg-muted" />
                        <div className="h-6 w-24 rounded-full bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="rounded-2xl bg-primary/10 p-6 text-center">
                  <p className="text-xl mb-2">🐻</p>
                  <p className="text-sm font-semibold">No entries yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chat with Buddy or add an entry above to start tracking.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-muted-foreground pt-1">Recent Entries</h3>
                  {entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onExpand={() => setExpandedId(entry.id)} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default LogPage;
