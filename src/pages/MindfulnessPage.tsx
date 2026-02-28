import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Pause, RotateCcw, Clock, ChevronDown, ChevronUp, RefreshCw, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "sonner";

const CATEGORIES = ["All", "Breathing", "Body Scan", "Meditation", "Visualization", "Grounding", "Movement"];

const CATEGORY_EMOJI: Record<string, string> = {
  Breathing: "🌬️",
  "Body Scan": "🧘",
  Meditation: "🧠",
  Visualization: "🌅",
  Grounding: "🌿",
  Movement: "🤸",
};

interface Exercise {
  title: string;
  description: string;
  duration: number;
  category: string;
  steps: string[];
  benefit: string;
}

/* ─── Breathing Timer Component ─── */
const BreathingTimer = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [seconds, setSeconds] = useState(0);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PHASES = [
    { name: "inhale" as const, duration: 4, label: "Breathe In", color: "text-[hsl(var(--energy-high))]" },
    { name: "hold" as const, duration: 7, label: "Hold", color: "text-[hsl(var(--energy-mid))]" },
    { name: "exhale" as const, duration: 8, label: "Breathe Out", color: "text-primary" },
    { name: "rest" as const, duration: 2, label: "Rest", color: "text-muted-foreground" },
  ];

  const currentPhase = PHASES.find((p) => p.name === phase)!;
  const progress = seconds / currentPhase.duration;

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        if (next >= currentPhase.duration) {
          const phaseIndex = PHASES.findIndex((p) => p.name === phase);
          const nextIndex = (phaseIndex + 1) % PHASES.length;
          setPhase(PHASES[nextIndex].name);
          if (nextIndex === 0) setCycles((c) => c + 1);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, phase, currentPhase.duration]);

  const reset = useCallback(() => {
    setIsActive(false);
    setPhase("inhale");
    setSeconds(0);
    setCycles(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const circleSize = 180;
  const strokeWidth = 6;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="rounded-2xl border bg-card p-5 mb-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Wind className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-bold">4-7-8 Breathing</h2>
        <Badge variant="outline" className="text-[10px] ml-auto bg-muted/50 text-muted-foreground">
          Guided
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        A calming technique that activates your parasympathetic nervous system, helping reduce pain perception and anxiety.
      </p>

      <div className="flex flex-col items-center">
        {/* Animated circle */}
        <div className="relative mb-4">
          <svg width={circleSize} height={circleSize} className="transform -rotate-90">
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${currentPhase.color} transition-colors`}>
              {currentPhase.label}
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {currentPhase.duration - seconds}
            </span>
            {cycles > 0 && (
              <span className="text-[10px] text-muted-foreground mt-1">
                {cycles} cycle{cycles !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={reset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <div className="h-10 w-10" /> {/* spacer for centering */}
        </div>
      </div>
    </div>
  );
};

/* ─── Exercise Card ─── */
const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border bg-card p-4 transition-all animate-slide-up">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl mt-0.5">{CATEGORY_EMOJI[exercise.category] || "🧘"}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold leading-snug">{exercise.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{exercise.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] bg-[hsl(var(--energy-mid))]/10 text-[hsl(var(--energy-mid))]">
                  {exercise.category}
                </Badge>
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {exercise.duration} min
                </span>
              </div>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 ml-11 space-y-3 animate-slide-up">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Steps</h4>
            <ol className="space-y-1.5">
              {exercise.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl bg-accent/10 p-3">
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">Why this helps: </span>
              {exercise.benefit}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─── */
const MindfulnessPage = () => {
  const navigate = useNavigate();
  const { prefs } = useUserPreferences();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: exercises, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["mindfulness", selectedCategory, prefs?.intake_condition],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("mindfulness-exercises", {
        body: {
          condition: prefs?.intake_condition || "chronic pain",
          symptoms: prefs?.my_symptoms || [],
          focus: selectedCategory,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        throw new Error(data.error);
      }
      return data.exercises as Exercise[];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!prefs,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/resources")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Mindfulness</h1>
            <p className="text-xs text-muted-foreground">Breathe, ground, restore 🧘</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg">
          {/* Buddy intro */}
          <div className="rounded-2xl bg-primary/10 p-4 mb-4 animate-slide-up">
            <p className="text-sm leading-relaxed">
              <span className="text-xl mr-1">🐻</span>
              These exercises are tailored to you. Start with the breathing timer, or explore guided exercises below. Be gentle with yourself. 💛
            </p>
          </div>

          {/* Built-in breathing timer */}
          <BreathingTimer />

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat !== "All" && <span className="mr-1">{CATEGORY_EMOJI[cat]}</span>}
                {cat}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted-foreground">Personalized Exercises</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl border bg-card p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                <span className="text-xl block mb-2">😔</span>
                Couldn't load exercises right now.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Exercises list */}
          {exercises && !isLoading && (
            <div className="space-y-3">
              {exercises.map((exercise, i) => (
                <ExerciseCard key={i} exercise={exercise} />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MindfulnessPage;
