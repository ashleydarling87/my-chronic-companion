import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserPreferences {
  id: string;
  pain_preference: "numeric" | "verbal" | "faces" | "adaptive";
  pain_misunderstanding_note: string;
  identity_tags: string[];
  report_sharing_defaults: {
    includeDiscrimination: boolean;
    includeEmotionalImpact: boolean;
  };
}

const DEFAULT_PREFS: Omit<UserPreferences, "id"> = {
  pain_preference: "numeric",
  pain_misunderstanding_note: "",
  identity_tags: [],
  report_sharing_defaults: {
    includeDiscrimination: false,
    includeEmotionalImpact: false,
  },
};

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching preferences:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setPrefs({
        id: data.id,
        pain_preference: data.pain_preference as UserPreferences["pain_preference"],
        pain_misunderstanding_note: (data.pain_misunderstanding_note as string) ?? "",
        identity_tags: (data.identity_tags as string[]) ?? [],
        report_sharing_defaults: (data.report_sharing_defaults as UserPreferences["report_sharing_defaults"]) ?? DEFAULT_PREFS.report_sharing_defaults,
      });
    }
    setLoading(false);
  };

  const savePrefs = useCallback(async (updated: Partial<Omit<UserPreferences, "id">>) => {
    if (prefs?.id) {
      // Update
      const { error } = await supabase
        .from("user_preferences")
        .update({
          pain_preference: updated.pain_preference ?? prefs.pain_preference,
          pain_misunderstanding_note: updated.pain_misunderstanding_note ?? prefs.pain_misunderstanding_note,
          identity_tags: updated.identity_tags ?? prefs.identity_tags,
          report_sharing_defaults: updated.report_sharing_defaults ?? prefs.report_sharing_defaults,
        })
        .eq("id", prefs.id);

      if (error) {
        toast.error("Failed to save preferences");
        return;
      }

      setPrefs((p) => (p ? { ...p, ...updated } : p));
      toast.success("Preferences saved");
    } else {
      // Insert
      const row = {
        pain_preference: updated.pain_preference ?? DEFAULT_PREFS.pain_preference,
        pain_misunderstanding_note: updated.pain_misunderstanding_note ?? DEFAULT_PREFS.pain_misunderstanding_note,
        identity_tags: updated.identity_tags ?? DEFAULT_PREFS.identity_tags,
        report_sharing_defaults: updated.report_sharing_defaults ?? DEFAULT_PREFS.report_sharing_defaults,
      };

      const { data, error } = await supabase
        .from("user_preferences")
        .insert(row)
        .select()
        .single();

      if (error) {
        toast.error("Failed to save preferences");
        return;
      }

      setPrefs({
        id: data.id,
        pain_preference: data.pain_preference as UserPreferences["pain_preference"],
        pain_misunderstanding_note: (data.pain_misunderstanding_note as string) ?? "",
        identity_tags: (data.identity_tags as string[]) ?? [],
        report_sharing_defaults: (data.report_sharing_defaults as UserPreferences["report_sharing_defaults"]) ?? DEFAULT_PREFS.report_sharing_defaults,
      });
      toast.success("Preferences saved");
    }
  }, [prefs]);

  return { prefs, loading, savePrefs };
}
