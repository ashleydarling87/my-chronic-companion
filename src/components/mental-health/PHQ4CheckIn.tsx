import { useState } from "react";
import { X, Loader2, Brain } from "lucide-react";
import { toast } from "sonner";
import { getSeverity, getSeverityColor } from "@/hooks/useMentalHealthScores";

const PHQ4_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
];

const ANSWER_OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half", value: 2 },
  { label: "Nearly every day", value: 3 },
];

interface Props {
  onClose: () => void;
  onSaved: () => void;
  saveScore: (answers: number[]) => Promise<{ totalScore: number; anxietyScore: number; depressionScore: number; severity: string }>;
}

const PHQ4CheckIn = ({ onClose, onSaved, saveScore }: Props) => {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ totalScore: number; anxietyScore: number; depressionScore: number; severity: string } | null>(null);

  const allAnswered = answers.every((a) => a !== null);

  const handleAnswer = (qIndex: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const res = await saveScore(answers as number[]);
      setResult(res);
      toast.success("Mental health check-in saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const severityColor = getSeverityColor(result.severity);
    return (
      <div className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-primary" />
            <h2 className="text-sm font-bold">Your PHQ-4 Result</h2>
          </div>
          <button onClick={() => { onSaved(); onClose(); }} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"><X size={16} /></button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-3xl font-bold">{result.totalScore}/12</p>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${severityColor}`}>
            {result.severity}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <p className="text-lg font-bold">{result.anxietyScore}/6</p>
            <p className="text-xs text-muted-foreground">Anxiety</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <p className="text-lg font-bold">{result.depressionScore}/6</p>
            <p className="text-xs text-muted-foreground">Depression</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          This is a screening tool, not a diagnosis. If you're struggling, please reach out to a mental health professional. 💛
        </p>

        <button onClick={() => { onSaved(); onClose(); }} className="flex w-full items-center justify-center rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          <h2 className="text-sm font-bold">Mental Health Check-In</h2>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"><X size={16} /></button>
      </div>

      <p className="text-xs text-muted-foreground">Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following?</p>

      {PHQ4_QUESTIONS.map((q, i) => (
        <div key={i} className="space-y-1.5">
          <p className="text-sm font-semibold">
            {i < 2 ? "🧠" : "💙"} {q}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ANSWER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(i, opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  answers[i] === opt.value
                    ? "bg-primary text-primary-foreground scale-105"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all disabled:opacity-50"
      >
        {submitting ? <><Loader2 size={16} className="animate-spin" />Saving...</> : "Submit Check-In"}
      </button>
    </div>
  );
};

export default PHQ4CheckIn;
