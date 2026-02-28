import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Heart, Zap, FileText, Copy, Check, ChevronDown, ChevronUp, Trash2, Loader2 } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface DiscriminationDetails {
  painNotReal: boolean;
  attributedToAnxiety: boolean;
  notTakenSeriously: boolean;
  identityBias: boolean;
  freeText: string;
}

interface EmotionalDetails {
  hopelessness: boolean;
  senseOfPurpose: boolean;
  isolation: boolean;
  faithAffected: boolean;
  freeText: string;
}

const DEFAULT_DISCRIMINATION: DiscriminationDetails = {
  painNotReal: false,
  attributedToAnxiety: false,
  notTakenSeriously: false,
  identityBias: false,
  freeText: "",
};

const DEFAULT_EMOTIONAL: EmotionalDetails = {
  hopelessness: false,
  senseOfPurpose: false,
  isolation: false,
  faithAffected: false,
  freeText: "",
};

interface DbEntry {
  id: string;
  created_at: string;
  pain_level: number | null;
  energy_level: number | null;
  mood: string | null;
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
}

interface SavedReport {
  id: string;
  dateRange: string;
  content: string;
  createdAt: Date;
}

const IMPACT_LABELS: Record<string, string> = {
  sleep: "Sleep",
  mobility: "Walking / moving around",
  work: "Work / school",
  family: "Family / community",
  mood: "Mood",
};

const WeeklyPage = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<DbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [editableReport, setEditableReport] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [includeDiscrimination, setIncludeDiscrimination] = useState(false);
  const [includeEmotional, setIncludeEmotional] = useState(false);
  const [showDiscriminationSheet, setShowDiscriminationSheet] = useState(false);
  const [showEmotionalSheet, setShowEmotionalSheet] = useState(false);
  const [discriminationDetails, setDiscriminationDetails] = useState<DiscriminationDetails>({ ...DEFAULT_DISCRIMINATION });
  const [emotionalDetails, setEmotionalDetails] = useState<EmotionalDetails>({ ...DEFAULT_EMOTIONAL });
  const { prefs } = useUserPreferences();

  // Sync sharing defaults from preferences
  useEffect(() => {
    if (prefs) {
      setIncludeDiscrimination(prefs.report_sharing_defaults.includeDiscrimination);
      setIncludeEmotional(prefs.report_sharing_defaults.includeEmotionalImpact);
    }
  }, [prefs]);

  // Fetch entries from DB
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Failed to load entries:", error);
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
        }))
      );
    }
    setLoading(false);
  };

  // Filter entries by date range
  const filteredEntries = entries.filter((e) =>
    isWithinInterval(new Date(e.created_at), { start: startOfDay(startDate), end: endOfDay(endDate) })
  );

  const entriesWithPain = filteredEntries.filter((e) => e.pain_level != null);
  const entriesWithEnergy = filteredEntries.filter((e) => e.energy_level != null);

  const avgPain = entriesWithPain.length
    ? Math.round((entriesWithPain.reduce((s, e) => s + (e.pain_level ?? 0), 0) / entriesWithPain.length) * 10) / 10
    : 0;
  const avgEnergy = entriesWithEnergy.length
    ? Math.round((entriesWithEnergy.reduce((s, e) => s + (e.energy_level ?? 0), 0) / entriesWithEnergy.length) * 10) / 10
    : 0;

  const chartData = [...filteredEntries]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((e) => ({
      day: format(new Date(e.created_at), "EEE"),
      pain: e.pain_level ?? 0,
      energy: e.energy_level ?? 0,
    }));

  // Trigger counts
  const triggerCounts: Record<string, number> = {};
  filteredEntries.forEach((e) => (e.triggers || []).forEach((t) => (triggerCounts[t] = (triggerCounts[t] || 0) + 1)));
  const topTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Symptom + body region + quality counts
  const symptomCounts: Record<string, number> = {};
  filteredEntries.forEach((e) => {
    [...(e.symptoms || []), ...(e.qualities || []), ...(e.body_regions || [])].forEach(
      (s) => (symptomCounts[s.replace(/_/g, " ")] = (symptomCounts[s.replace(/_/g, " ")] || 0) + 1)
    );
  });
  const topSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Impact dimension counts (how often each was > 0)
  const impactCounts: Record<string, number> = {};
  filteredEntries.forEach((e) => {
    Object.entries(e.impacts || {}).forEach(([key, val]) => {
      if (Number(val) > 0) impactCounts[key] = (impactCounts[key] || 0) + 1;
    });
  });
  const impactEntries = Object.entries(impactCounts).sort((a, b) => b[1] - a[1]);

  const dateRangeLabel = `${format(startDate, "MMM d")} – ${format(endDate, "MMM d")}`;

  // Build buddy summary with function language
  const buildBuddySummary = () => {
    if (filteredEntries.length === 0) return "No entries for this date range yet. Try adjusting the dates!";
    let summary = `Over this period, your pain averaged ${avgPain}/10 and energy averaged ${avgEnergy}/10.`;
    if (impactEntries.length > 0) {
      const topImpacts = impactEntries.slice(0, 2).map(([k]) => IMPACT_LABELS[k] || k).join(" and ");
      summary += ` It made ${topImpacts.toLowerCase()} tougher on about ${impactEntries[0][1]} of your ${filteredEntries.length} days.`;
    }
    if (topTriggers.length > 0) {
      summary += ` Your biggest triggers were ${topTriggers.slice(0, 2).map(([t]) => t).join(" and ")}.`;
    }
    summary += " Keep tracking — you're doing great! 💛";
    return summary;
  };

  const generateDoctorReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const worstEntry = entriesWithPain.reduce((max, e) => ((e.pain_level ?? 0) > (max.pain_level ?? 0) ? e : max), entriesWithPain[0]);
      const bestEnergyEntry = entriesWithEnergy.reduce((max, e) => ((e.energy_level ?? 0) > (max.energy_level ?? 0) ? e : max), entriesWithEnergy[0]);

      let report = `SYMPTOM REPORT — ${dateRangeLabel}
Prepared for: [Patient Name]

SUMMARY
Over ${filteredEntries.length} days of tracking, the patient reported an average pain level of ${avgPain}/10 and average energy level of ${avgEnergy}/10.

PAIN & ENERGY OVERVIEW
• Average Pain Score: ${avgPain}/10
• Average Energy Score: ${avgEnergy}/10
• Highest Pain Day: ${worstEntry ? `${format(new Date(worstEntry.created_at), "EEEE, MMM d")} (${worstEntry.pain_level}/10)` : "N/A"}
• Best Energy Day: ${bestEnergyEntry ? `${format(new Date(bestEnergyEntry.created_at), "EEEE, MMM d")} (${bestEnergyEntry.energy_level}/10)` : "N/A"}

FUNCTIONAL IMPACT
${impactEntries.length ? impactEntries.map(([k, c]) => `• ${IMPACT_LABELS[k] || k} — affected on ${c} of ${filteredEntries.length} days`).join("\n") : "• No functional impact data recorded"}

IDENTIFIED TRIGGERS
${topTriggers.length ? topTriggers.map(([t, c]) => `• ${t} — reported ${c} time(s)`).join("\n") : "• No triggers reported"}

SYMPTOMS & BODY REGIONS
${topSymptoms.length ? topSymptoms.map(([s, c]) => `• ${s} — reported ${c} time(s)`).join("\n") : "• No symptoms reported"}`;

      if (includeEmotional && impactEntries.some(([k]) => k === "mood" || k === "family")) {
        report += `\n\nEMOTIONAL & SPIRITUAL IMPACT
• Mood was affected on ${impactCounts["mood"] || 0} days
• Family/community was affected on ${impactCounts["family"] || 0} days`;
      }

      if (includeDiscrimination) {
        const dismissedCount = filteredEntries.filter((e) => e.felt_dismissed_by_provider).length;
        const discrimCount = filteredEntries.filter((e) => e.experienced_discrimination).length;
        if (dismissedCount > 0 || discrimCount > 0) {
          report += `\n\nPATIENT CONTEXT (shared with consent)`;
          if (dismissedCount > 0) report += `\n• Reported feeling dismissed by a healthcare provider on ${dismissedCount} occasion(s)`;
          if (discrimCount > 0) report += `\n• Reported experiencing discrimination on ${discrimCount} occasion(s)`;
          const contextNotes = filteredEntries.filter((e) => e.context_notes).map((e) => e.context_notes);
          if (contextNotes.length > 0) report += `\n• Context notes: ${contextNotes.join("; ")}`;
        }
      }

      report += `\n\nDAILY NOTES
${filteredEntries
  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  .map((e) => `${format(new Date(e.created_at), "MMM d")}: Pain ${e.pain_level ?? "?"}/10, Energy ${e.energy_level ?? "?"}/10 — "${e.summary || e.raw_text || "No notes"}"`)
  .join("\n")}

---
Generated by Buddy • ${format(new Date(), "MMM d, yyyy")}`;

      setGeneratedReport(report);
      setEditableReport(report);
      setIsEditing(false);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSaveReport = () => {
    const newReport: SavedReport = { id: Date.now().toString(), dateRange: dateRangeLabel, content: editableReport, createdAt: new Date() };
    setSavedReports((prev) => [newReport, ...prev]);
    setGeneratedReport(null);
    setEditableReport("");
    setIsEditing(false);
    toast.success("Report saved!");
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteReport = (id: string) => setSavedReports((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Reports" subtitle={dateRangeLabel} />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Date Range Picker */}
          <div className="rounded-2xl border bg-card p-4 animate-slide-up">
            <h3 className="mb-3 text-sm font-bold">Date Range</h3>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left text-sm font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} disabled={(d) => d > endDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-sm text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left text-sm font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} disabled={(d) => d < startDate || d > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Buddy Summary */}
          <div className="rounded-2xl bg-primary/10 p-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🐻</span>
              <h2 className="text-sm font-bold text-primary">Buddy's Take</h2>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{buildBuddySummary()}</p>
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

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 animate-slide-up">
              <h3 className="mb-3 text-sm font-bold">Pain & Energy Trends</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="pain" stroke="hsl(var(--pain-high))" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="energy" stroke="hsl(var(--energy-high))" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pain-high" /> Pain</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-energy-high" /> Energy</span>
              </div>
            </div>
          )}

          {/* Most affected areas of life */}
          {impactEntries.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 animate-slide-up">
              <h3 className="mb-3 text-sm font-bold">Most Affected Areas of Life</h3>
              <div className="space-y-2.5">
                {impactEntries.map(([key, count]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm w-36 truncate">{IMPACT_LABELS[key] || key}</span>
                    <div className="flex-1 h-2 rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / filteredEntries.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{count}/{filteredEntries.length} days</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context that matters to me */}
          {prefs?.pain_misunderstanding_note && (
            <div className="rounded-2xl border bg-card p-4 animate-slide-up">
              <h3 className="mb-2 text-sm font-bold">Context That Matters to Me</h3>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "{prefs.pain_misunderstanding_note}"
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">From your profile preferences</p>
            </div>
          )}

          {/* Top Triggers */}
          {topTriggers.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 animate-slide-up">
              <h3 className="mb-3 text-sm font-bold">Top Triggers</h3>
              <div className="space-y-2">
                {topTriggers.map(([trigger, count]) => (
                  <div key={trigger} className="flex items-center justify-between">
                    <span className="text-sm">{trigger}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-primary/20" style={{ width: `${(count / filteredEntries.length) * 100}px` }}>
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(count / topTriggers[0][1]) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Symptoms */}
          {topSymptoms.length > 0 && (
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
          )}

          {/* Doctor Report */}
          {!generatedReport && (
            <div className="rounded-2xl border bg-card p-4 animate-slide-up space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={20} className="text-primary" />
                <h3 className="text-sm font-bold">Doctor Report</h3>
              </div>
              <p className="text-sm text-muted-foreground">Generate a formatted report you can share with your doctor.</p>

              {/* Sharing toggles */}
              <div className="space-y-2 border-t pt-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={includeDiscrimination} onChange={(e) => setIncludeDiscrimination(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-primary" />
                  <span className="text-xs leading-snug">Include notes about discrimination or being dismissed</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={includeEmotional} onChange={(e) => setIncludeEmotional(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-primary" />
                  <span className="text-xs leading-snug">Include emotional and spiritual impact</span>
                </label>
              </div>

              <Button onClick={generateDoctorReport} disabled={filteredEntries.length === 0 || isGenerating} className="w-full rounded-xl">
                {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" />Generating...</> : "Generate Report"}
              </Button>
            </div>
          )}

          {/* Generated Report Preview */}
          {generatedReport && (
            <div className="rounded-2xl border bg-card p-4 animate-slide-up space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  <h3 className="text-sm font-bold">Generated Report</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(editableReport)} className="h-8 gap-1 text-xs">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              {isEditing ? (
                <Textarea value={editableReport} onChange={(e) => setEditableReport(e.target.value)} className="min-h-[300px] text-xs font-mono leading-relaxed" />
              ) : (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground bg-secondary/50 rounded-xl p-3 max-h-[400px] overflow-y-auto">{editableReport}</pre>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="flex-1 rounded-xl text-sm">{isEditing ? "Preview" : "Edit"}</Button>
                <Button onClick={handleSaveReport} className="flex-1 rounded-xl text-sm">Save Report</Button>
              </div>
              <Button variant="ghost" onClick={() => { setGeneratedReport(null); setEditableReport(""); }} className="w-full text-xs text-muted-foreground">Discard</Button>
            </div>
          )}

          {/* Saved Reports */}
          {savedReports.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 animate-slide-up">
              <h3 className="mb-3 text-sm font-bold">Saved Reports</h3>
              <div className="space-y-2">
                {savedReports.map((report) => (
                  <div key={report.id} className="rounded-xl border bg-secondary/30 overflow-hidden">
                    <button onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)} className="flex w-full items-center justify-between p-3 text-left">
                      <div>
                        <p className="text-sm font-semibold">{report.dateRange}</p>
                        <p className="text-xs text-muted-foreground">Saved {format(report.createdAt, "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopy(report.content); }}>
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}>
                          <Trash2 size={14} />
                        </Button>
                        {expandedReport === report.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>
                    {expandedReport === report.id && (
                      <div className="border-t px-3 py-3">
                        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground max-h-[300px] overflow-y-auto">{report.content}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default WeeklyPage;
