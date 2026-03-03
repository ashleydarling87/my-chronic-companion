import { useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { SUGGESTED_SYMPTOMS } from "@/lib/data";

const INITIAL_SUGGESTIONS = 10;

interface Props {
  symptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
}

const SymptomsCard = ({ symptoms, onSymptomsChange }: Props) => {
  const [search, setSearch] = useState("");
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const addSymptom = (symptom: string) => {
    const trimmed = symptom.trim();
    if (!trimmed) return;
    if (symptoms.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    onSymptomsChange([...symptoms, trimmed]);
    setSearch("");
  };

  const removeSymptom = (symptom: string) => {
    onSymptomsChange(symptoms.filter((s) => s !== symptom));
  };

  const filteredSuggestions = SUGGESTED_SYMPTOMS.filter(
    (s) =>
      !symptoms.some((m) => m.toLowerCase() === s.toLowerCase()) &&
      (search ? s.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const visibleSuggestions = showAllSuggestions || search
    ? filteredSuggestions
    : filteredSuggestions.slice(0, INITIAL_SUGGESTIONS);

  const showAddCustom =
    search.trim() &&
    !SUGGESTED_SYMPTOMS.some((s) => s.toLowerCase() === search.trim().toLowerCase()) &&
    !symptoms.some((s) => s.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="space-y-4">
      {symptoms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {symptoms.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-foreground">
              {s}
              <button onClick={() => removeSymptom(s)} className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {symptoms.length === 0 && (
        <p className="text-xs text-muted-foreground">Tap symptoms below to build your personal list. These will be used during check-ins.</p>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) addSymptom(search); }}
          placeholder="Search or add a symptom..."
          className="w-full rounded-xl border bg-background pl-9 pr-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {showAddCustom && (
        <button
          onClick={() => addSymptom(search)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/15"
        >
          <Plus size={12} /> Add "{search.trim()}"
        </button>
      )}

      {visibleSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Suggestions</p>
          <div className="flex flex-wrap gap-1.5">
            {visibleSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => addSymptom(s)}
                className="rounded-full border border-muted bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/10 hover:border-primary/30"
              >
                + {s}
              </button>
            ))}
          </div>
          {!showAllSuggestions && !search && filteredSuggestions.length > INITIAL_SUGGESTIONS && (
            <button
              onClick={() => setShowAllSuggestions(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Show all symptoms →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SymptomsCard;
