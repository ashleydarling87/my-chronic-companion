import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Activity, Zap, Brain, Moon } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

interface EntryData {
  id: string;
  created_at: string;
  raw_text: string | null;
  pain_level: number | null;
  energy_level: number | null;
  mood: string | null;
  sleep_hours: number | null;
  symptoms: string[];
  severity: string | null;
  triggers: string[];
  summary: string | null;
  follow_up_question: string | null;
  emergency: boolean;
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors: Record<string, string> = {
    mild: "bg-energy-high/15 text-energy-high",
    moderate: "bg-pain-mid/15 text-pain-mid",
    severe: "bg-pain-high/15 text-pain-high",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold capitalize ${colors[severity] || "bg-secondary text-secondary-foreground"}`}>
      {severity}
    </span>
  );
};

const SummaryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const entry = (location.state as { entry?: EntryData })?.entry;

  if (!entry) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header title="Summary" subtitle="AI Analysis" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">No entry data found.</p>
            <button onClick={() => navigate("/log")} className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
              Go to Log
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate("/log")} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold">AI Summary</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(entry.created_at).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Emergency Alert */}
          {entry.emergency && (
            <div className="flex items-start gap-3 rounded-2xl border-2 border-destructive bg-destructive/10 p-4 animate-slide-up">
              <AlertTriangle className="mt-0.5 shrink-0 text-destructive" size={20} />
              <div>
                <p className="text-sm font-bold text-destructive">Emergency Detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on your entry, you may need immediate help. Please reach out to a healthcare provider or call emergency services.
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <div className="flex items-center gap-2.5 rounded-2xl border bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pain-high/10">
                <Activity size={16} className="text-pain-high" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pain</p>
                <p className="text-lg font-bold">{entry.pain_level}/10</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-energy-high/10">
                <Zap size={16} className="text-energy-high" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Energy</p>
                <p className="text-lg font-bold">{entry.energy_level}/10</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Brain size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mood</p>
                <p className="text-sm font-bold">{entry.mood}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                <Moon size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sleep</p>
                <p className="text-lg font-bold">{entry.sleep_hours}h</p>
              </div>
            </div>
          </div>

          {/* Severity */}
          {entry.severity && (
            <section className="rounded-2xl border bg-card p-4 space-y-2 animate-slide-up">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Severity</h2>
              <SeverityBadge severity={entry.severity} />
            </section>
          )}

          {/* AI Summary */}
          {entry.summary && (
            <section className="rounded-2xl border bg-card p-4 space-y-2 animate-slide-up">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Summary</h2>
              <p className="text-sm leading-relaxed">{entry.summary}</p>
            </section>
          )}

          {/* Symptoms */}
          {entry.symptoms?.length > 0 && (
            <section className="rounded-2xl border bg-card p-4 space-y-2 animate-slide-up">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Symptoms Detected</h2>
              <div className="flex flex-wrap gap-2">
                {entry.symptoms.map((s: string) => (
                  <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Triggers */}
          {entry.triggers?.length > 0 && (
            <section className="rounded-2xl border bg-card p-4 space-y-2 animate-slide-up">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Potential Triggers</h2>
              <div className="flex flex-wrap gap-2">
                {entry.triggers.map((t: string) => (
                  <span key={t} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Follow-up */}
          {entry.follow_up_question && (
            <section className="rounded-2xl bg-primary/10 p-4 space-y-2 animate-slide-up">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wider">🐻 Buddy asks...</h2>
              <p className="text-sm font-medium leading-relaxed">{entry.follow_up_question}</p>
            </section>
          )}

          <button
            onClick={() => navigate("/log")}
            className="w-full rounded-2xl bg-secondary py-3 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Back to Log
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SummaryPage;
