import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { TrendingDown, TrendingUp, Zap, Heart } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { mockEntries } from "../lib/data";
import { format } from "date-fns";

const WeeklyPage = () => {
  const chartData = [...mockEntries]
    .reverse()
    .map((e) => ({
      day: format(e.date, "EEE"),
      pain: e.painScore,
      energy: e.energyScore,
    }));

  const avgPain = Math.round(mockEntries.reduce((s, e) => s + e.painScore, 0) / mockEntries.length * 10) / 10;
  const avgEnergy = Math.round(mockEntries.reduce((s, e) => s + e.energyScore, 0) / mockEntries.length * 10) / 10;

  // Gather triggers
  const triggerCounts: Record<string, number> = {};
  mockEntries.forEach((e) => e.triggers.forEach((t) => (triggerCounts[t] = (triggerCounts[t] || 0) + 1)));
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Symptom counts
  const symptomCounts: Record<string, number> = {};
  mockEntries.forEach((e) => e.symptoms.forEach((s) => (symptomCounts[s] = (symptomCounts[s] || 0) + 1)));
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Weekly Summary" subtitle="Feb 19 – Feb 25" />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg space-y-4">
          {/* AI Summary Card */}
          <div className="rounded-2xl bg-primary/10 p-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🐻</span>
              <h2 className="text-sm font-bold text-primary">Buddy's Weekly Take</h2>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              Hey bestie, this week was a bit of a rollercoaster 🎢 Your pain averaged around {avgPain}/10 with your worst day being today. 
              Weather changes and stress were your biggest triggers. The good news? You had a solid day on Thursday with low pain and high energy! 
              Try to recreate what made that day work. You're doing amazing by tracking all of this 💛
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-card p-4 text-center animate-slide-up">
              <Heart size={20} className="mx-auto mb-1 text-pain-high" />
              <p className="text-2xl font-bold">{avgPain}</p>
              <p className="text-xs text-muted-foreground">Avg Pain</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 text-center animate-slide-up">
              <Zap size={20} className="mx-auto mb-1 text-energy-high" />
              <p className="text-2xl font-bold">{avgEnergy}</p>
              <p className="text-xs text-muted-foreground">Avg Energy</p>
            </div>
          </div>

          {/* Pain & Energy Chart */}
          <div className="rounded-2xl border bg-card p-4 animate-slide-up">
            <h3 className="mb-3 text-sm font-bold">Pain & Energy Trends</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="pain" stroke="hsl(var(--pain-high))" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="energy" stroke="hsl(var(--energy-high))" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pain-high" /> Pain</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-energy-high" /> Energy</span>
            </div>
          </div>

          {/* Top Triggers */}
          <div className="rounded-2xl border bg-card p-4 animate-slide-up">
            <h3 className="mb-3 text-sm font-bold">Top Triggers</h3>
            <div className="space-y-2">
              {topTriggers.map(([trigger, count]) => (
                <div key={trigger} className="flex items-center justify-between">
                  <span className="text-sm">{trigger}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-primary/20" style={{ width: `${(count / mockEntries.length) * 100}px` }}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(count / topTriggers[0][1]) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{count}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Symptoms */}
          <div className="rounded-2xl border bg-card p-4 animate-slide-up">
            <h3 className="mb-3 text-sm font-bold">Most Reported Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {topSymptoms.map(([symptom, count]) => (
                <span key={symptom} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {symptom} ({count}x)
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default WeeklyPage;
