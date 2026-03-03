import { useState } from "react";

const IDENTITY_OPTIONS = [
  { value: "white", label: "I'm White" },
  { value: "black", label: "I'm Black or African American" },
  { value: "hispanic_latino", label: "I'm Hispanic or Latino/a" },
  { value: "asian", label: "I'm Asian" },
  { value: "native_american", label: "I'm American Indian or Alaska Native" },
  { value: "pacific_islander", label: "I'm Native Hawaiian or Pacific Islander" },
  { value: "middle_eastern", label: "I'm Middle Eastern or North African" },
  { value: "multiracial", label: "I'm Multiracial" },
  { value: "lgbtq", label: "I'm LGBTQ+" },
  { value: "trans_ftm", label: "I'm Trans FTM" },
  { value: "trans_mtf", label: "I'm Trans MTF" },
  { value: "man", label: "I'm a Man" },
  { value: "woman", label: "I'm a Woman" },
  { value: "gender_fluid", label: "I'm Gender Fluid" },
  { value: "neurodivergent", label: "I'm Neurodivergent" },
];

const INITIAL_VISIBLE = 8;

interface Props {
  identityTags: string[];
  onIdentityTagsChange: (v: string[]) => void;
}

export default function IdentityCard({ identityTags, onIdentityTagsChange }: Props) {
  const [showAll, setShowAll] = useState(false);

  const toggleIdentity = (tag: string) => {
    onIdentityTagsChange(
      identityTags.includes(tag) ? identityTags.filter((t) => t !== tag) : [...identityTags, tag]
    );
  };

  const visibleOptions = showAll ? IDENTITY_OPTIONS : IDENTITY_OPTIONS.slice(0, INITIAL_VISIBLE);

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-destructive/10 p-3 flex gap-2 items-start">
        <span className="text-base mt-0.5">❤️</span>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Completely optional.</strong> Your identity info stays private and helps us tailor your experience — different folks often receive different care.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleIdentity(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              identityTags.includes(opt.value)
                ? "border-primary bg-primary/10 text-foreground"
                : "bg-background text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {!showAll && IDENTITY_OPTIONS.length > INITIAL_VISIBLE && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          More identity options →
        </button>
      )}
    </div>
  );
}
