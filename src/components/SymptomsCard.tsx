import { useState, useEffect } from "react";
import { X, Plus, Search } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SUGGESTED_SYMPTOMS = [
  "Fatigue",
  "Brain fog",
  "Joint pain",
  "Muscle aches",
  "Headache",
  "Nausea",
  "Dizziness",
  "Insomnia",
  "Stiffness",
  "Numbness / tingling",
  "Back pain",
  "Cramping",
  "Bloating",
  "Anxiety",
  "Shortness of breath",
  "Sensitivity to light",
  "Sensitivity to sound",
  "Swelling",
  "Chest tightness",
  "Hot flashes",
];

const SymptomsCard = () => {
  const { user } = useAuth();
  const { prefs } = useUserPreferences();
  const [search, setSearch] = useState("");
  const [mySymptoms, setMySymptoms] = useState<string[]>([]);

  useEffect(() => {
    setMySymptoms((prefs as any)?.my_symptoms ?? []);
  }, [prefs]);

  const save = async (updated: string[]) => {
    if (!prefs?.id || !user) return;
    const { error } = await supabase
      .from("user_preferences")
      .update({ my_symptoms: updated } as any)
      .eq("id", prefs.id);
    if (error) {
      toast.error("Failed to save symptoms");
      return;
    }
    // Optimistic: force a re-render by reloading — the hook will pick it up
    window.dispatchEvent(new Event("prefs-updated"));
  };

  const addSymptom = (symptom: string) => {
    const trimmed = symptom.trim();
    if (!trimmed) return;
    if (mySymptoms.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...mySymptoms, trimmed];
    save(updated);
    setSearch("");
  };

  const removeSymptom = (symptom: string) => {
    save(mySymptoms.filter((s) => s !== symptom));
  };

  const filteredSuggestions = SUGGESTED_SYMPTOMS.filter(
    (s) =>
      !mySymptoms.some((m) => m.toLowerCase() === s.toLowerCase()) &&
      (search ? s.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const showAddCustom =
    search.trim() &&
    !SUGGESTED_SYMPTOMS.some((s) => s.toLowerCase() === search.trim().toLowerCase()) &&
    !mySymptoms.some((s) => s.toLowerCase() === search.trim().toLowerCase());

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
        My Symptoms
      </h2>

      {/* Current symptoms */}
      {mySymptoms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mySymptoms.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {s}
              <button
                onClick={() => removeSymptom(s)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {mySymptoms.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Tap symptoms below to build your personal list. These will be used during check-ins.
        </p>
      )}

      {/* Search / add */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) {
              addSymptom(search);
            }
          }}
          placeholder="Search or add a symptom..."
          className="w-full rounded-xl border bg-background pl-9 pr-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Custom add button */}
      {showAddCustom && (
        <button
          onClick={() => addSymptom(search)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/15"
        >
          <Plus size={12} /> Add "{search.trim()}"
        </button>
      )}

      {/* Suggested chips */}
      {filteredSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Suggestions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => addSymptom(s)}
                className="rounded-full border border-muted bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/10 hover:border-primary/30"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SymptomsCard;
