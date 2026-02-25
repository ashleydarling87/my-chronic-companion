import { useState } from "react";
import { format } from "date-fns";
import { Plus, Edit2, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { mockEntries, type SymptomEntry } from "../lib/data";
import { toast } from "sonner";

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

const ScoreSlider = ({
  label,
  value,
  onChange,
  type,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  type: "pain" | "energy";
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold">{label}</span>
      <ScoreBadge label="" score={value} type={type} />
    </div>
    <input
      type="range"
      min={1}
      max={10}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-primary"
    />
  </div>
);

const MOOD_OPTIONS = ["😊 Great", "🙂 Good", "😐 Okay", "😔 Low", "😢 Awful"];

const CheckInForm = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [painLevel, setPainLevel] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [mood, setMood] = useState("😐 Okay");
  const [sleepHours, setSleepHours] = useState("7");
  const [rawText, setRawText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("processDailyEntry", {
        body: {
          raw_text: rawText,
          pain_level: painLevel,
          energy_level: energyLevel,
          mood,
          sleep_hours: parseFloat(sleepHours) || 0,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Check-in saved!");
      navigate("/summary", { state: { entry: data } });
    } catch (e: any) {
      console.error("Check-in error:", e);
      toast.error(e.message || "Failed to save check-in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Daily Check-In</h2>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
          <X size={16} />
        </button>
      </div>

      <ScoreSlider label="Pain Level" value={painLevel} onChange={setPainLevel} type="pain" />
      <ScoreSlider label="Energy Level" value={energyLevel} onChange={setEnergyLevel} type="energy" />

      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Mood</span>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                mood === m
                  ? "bg-primary text-primary-foreground scale-105"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Sleep (hours)</span>
        <input
          type="number"
          min={0}
          max={24}
          step={0.5}
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value)}
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-semibold">How are you feeling? (optional)</span>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Tell me everything — the good, the bad, the ugh..."
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          rows={3}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Analyzing...
          </>
        ) : (
          "Submit Check-In"
        )}
      </button>
    </div>
  );
};

const EntryCard = ({ entry }: { entry: SymptomEntry }) => {
  const [editing, setEditing] = useState(false);
  const [editEntry, setEditEntry] = useState(entry);

  if (editing) {
    return (
      <div className="rounded-2xl border bg-card p-4 space-y-3 animate-slide-up">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{format(entry.date, "EEE, MMM d")}</span>
          <div className="flex gap-1">
            <button onClick={() => setEditing(false)} className="rounded-full p-1.5 text-accent hover:bg-accent/10">
              <Check size={16} />
            </button>
            <button onClick={() => { setEditEntry(entry); setEditing(false); }} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10">
              <X size={16} />
            </button>
          </div>
        </div>
        <ScoreSlider label="Pain" value={editEntry.painScore} onChange={(v) => setEditEntry({ ...editEntry, painScore: v })} type="pain" />
        <ScoreSlider label="Energy" value={editEntry.energyScore} onChange={(v) => setEditEntry({ ...editEntry, energyScore: v })} type="energy" />
        <textarea
          value={editEntry.notes}
          onChange={(e) => setEditEntry({ ...editEntry, notes: e.target.value })}
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          rows={2}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold">{format(entry.date, "EEE, MMM d")}</span>
        <button onClick={() => setEditing(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
          <Edit2 size={14} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <ScoreBadge label="Pain" score={entry.painScore} type="pain" />
        <ScoreBadge label="Energy" score={entry.energyScore} type="energy" />
      </div>
      {entry.symptoms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {entry.symptoms.map((s) => (
            <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{s}</span>
          ))}
        </div>
      )}
      {entry.triggers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {entry.triggers.map((t) => (
            <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{t}</span>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{entry.notes}</p>
    </div>
  );
};

const LogPage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Symptom Log" subtitle="Your daily entries" />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg space-y-3">
          {showForm ? (
            <CheckInForm onClose={() => setShowForm(false)} />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Plus size={18} />
              Add New Entry
            </button>
          )}

          {/* Today's summary */}
          <div className="rounded-2xl bg-primary/10 p-4">
            <h2 className="text-sm font-bold text-primary mb-1">Today's Check-in</h2>
            <p className="text-xs text-muted-foreground">Logged via chat with Buddy 🐻</p>
            <div className="flex gap-2 mt-2">
              <ScoreBadge label="Pain" score={7} type="pain" />
              <ScoreBadge label="Energy" score={3} type="energy" />
            </div>
          </div>

          {/* Entries */}
          <h3 className="text-sm font-bold text-muted-foreground pt-2">Recent Entries</h3>
          {mockEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default LogPage;
