import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MentalHealthScore {
  id: string;
  user_id: string;
  created_at: string;
  scale_type: string;
  total_score: number;
  anxiety_score: number | null;
  depression_score: number | null;
  answers: number[];
  severity: string | null;
}

export function getSeverity(total: number): string {
  if (total <= 2) return "normal";
  if (total <= 5) return "mild";
  if (total <= 8) return "moderate";
  return "severe";
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "normal": return "bg-energy-high/15 text-energy-high";
    case "mild": return "bg-energy-mid/15 text-energy-mid";
    case "moderate": return "bg-pain-mid/15 text-pain-mid";
    case "severe": return "bg-pain-high/15 text-pain-high";
    default: return "bg-secondary text-secondary-foreground";
  }
}

export function useMentalHealthScores() {
  const [scores, setScores] = useState<MentalHealthScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mental_health_scores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setScores(data.map((d: any) => ({
        ...d,
        answers: d.answers ?? [],
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const latest = scores[0] ?? null;

  const needsWeeklyPrompt = !latest || (
    new Date().getTime() - new Date(latest.created_at).getTime() > 7 * 24 * 60 * 60 * 1000
  );

  const saveScore = async (answers: number[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const anxietyScore = answers[0] + answers[1];
    const depressionScore = answers[2] + answers[3];
    const totalScore = anxietyScore + depressionScore;
    const severity = getSeverity(totalScore);

    const { error } = await supabase.from("mental_health_scores").insert({
      user_id: user.id,
      total_score: totalScore,
      anxiety_score: anxietyScore,
      depression_score: depressionScore,
      answers,
      severity,
    } as any);

    if (error) throw error;
    await fetchScores();
    return { totalScore, anxietyScore, depressionScore, severity };
  };

  return { scores, latest, loading, needsWeeklyPrompt, saveScore, refetch: fetchScores };
}
