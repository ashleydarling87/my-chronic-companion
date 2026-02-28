import { Brain } from "lucide-react";
import { format } from "date-fns";
import { getSeverityColor, type MentalHealthScore } from "@/hooks/useMentalHealthScores";

interface Props {
  latest: MentalHealthScore | null;
  needsWeeklyPrompt: boolean;
  onStartCheckIn: () => void;
}

const PHQ4ScoreCard = ({ latest, needsWeeklyPrompt, onStartCheckIn }: Props) => {
  if (!latest) {
    return (
      <button
        onClick={onStartCheckIn}
        className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 animate-slide-up"
      >
        <div className="flex items-center gap-2 mb-1">
          <Brain size={18} className="text-primary" />
          <span className="text-sm font-bold text-primary">Mental Health Check-In</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Take a quick 2-minute PHQ-4 screening to track your anxiety and depression levels.
        </p>
      </button>
    );
  }

  const severityColor = getSeverityColor(latest.severity || "normal");

  return (
    <div className="rounded-2xl border bg-card p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          <h3 className="text-sm font-bold">Mental Health</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(latest.created_at), "MMM d")}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold">{latest.total_score}/12</p>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${severityColor}`}>
            {latest.severity}
          </span>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-secondary/50 p-2 text-center">
            <p className="text-sm font-bold">{latest.anxiety_score}/6</p>
            <p className="text-[10px] text-muted-foreground">Anxiety</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-2 text-center">
            <p className="text-sm font-bold">{latest.depression_score}/6</p>
            <p className="text-[10px] text-muted-foreground">Depression</p>
          </div>
        </div>
      </div>

      {needsWeeklyPrompt ? (
        <button
          onClick={onStartCheckIn}
          className="w-full rounded-xl bg-primary/10 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          🔔 It's been a week — take a quick check-in?
        </button>
      ) : (
        <button
          onClick={onStartCheckIn}
          className="w-full rounded-xl bg-secondary py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          Take new check-in
        </button>
      )}
    </div>
  );
};

export default PHQ4ScoreCard;
