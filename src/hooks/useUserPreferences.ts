import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CommunicationStyle {
  message_length?: string;
  tone?: string;
  emoji_usage?: string;
  vocabulary?: string;
  humor?: string;
}

export interface UserPreferences {
  id: string;
  pain_preference: "numeric" | "verbal" | "faces" | "adaptive";
  pain_misunderstanding_note: string;
  identity_tags: string[];
  report_sharing_defaults: {
    includeDiscrimination: boolean;
    includeEmotionalImpact: boolean;
  };
  buddy_name: string;
  buddy_avatar: string;
  age_range: string;
  onboarding_complete: boolean;
  intake_condition: string | null;
  intake_duration: string | null;
  intake_body_regions: string[];
  intake_treatments: string[];
  intake_goals: string | null;
  profile_picture_url: string | null;
  communication_style: CommunicationStyle;
  display_name: string | null;
  my_symptoms: string[];
}

const DEFAULT_PREFS: Omit<UserPreferences, "id"> = {
  pain_preference: "numeric",
  pain_misunderstanding_note: "",
  identity_tags: [],
  report_sharing_defaults: {
    includeDiscrimination: false,
    includeEmotionalImpact: false,
  },
  buddy_name: "Buddy",
  buddy_avatar: "bear",
  age_range: "",
  onboarding_complete: false,
  intake_condition: null,
  intake_duration: null,
  intake_body_regions: [],
  intake_treatments: [],
  intake_goals: null,
  profile_picture_url: null,
  communication_style: {},
  display_name: null,
  my_symptoms: [],
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPrefs(null);
      setLoading(false);
      return;
    }
    fetchPrefs();
  }, [user]);

  const fetchPrefs = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
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
        buddy_name: (data as any).buddy_name ?? "Buddy",
        buddy_avatar: (data as any).buddy_avatar ?? "bear",
        age_range: (data as any).age_range ?? "",
        onboarding_complete: (data as any).onboarding_complete ?? false,
        intake_condition: (data as any).intake_condition ?? null,
        intake_duration: (data as any).intake_duration ?? null,
        intake_body_regions: (data as any).intake_body_regions ?? [],
        intake_treatments: (data as any).intake_treatments ?? [],
        intake_goals: (data as any).intake_goals ?? null,
        profile_picture_url: (data as any).profile_picture_url ?? null,
        communication_style: (data as any).communication_style ?? {},
        display_name: (data as any).display_name ?? null,
      });
    }
    setLoading(false);
  };

  const savePrefs = useCallback(async (updated: Partial<Omit<UserPreferences, "id">>) => {
    if (!user) return;

    if (prefs?.id) {
      const { error } = await supabase
        .from("user_preferences")
        .update({
          pain_preference: updated.pain_preference ?? prefs.pain_preference,
          pain_misunderstanding_note: updated.pain_misunderstanding_note ?? prefs.pain_misunderstanding_note,
          identity_tags: updated.identity_tags ?? prefs.identity_tags,
          report_sharing_defaults: updated.report_sharing_defaults ?? prefs.report_sharing_defaults,
          communication_style: (updated.communication_style ?? prefs.communication_style) as unknown as Record<string, string>,
          display_name: updated.display_name !== undefined ? updated.display_name : prefs.display_name,
        })
        .eq("id", prefs.id);

      if (error) {
        toast.error("Failed to save preferences");
        return;
      }

      setPrefs((p) => (p ? { ...p, ...updated } : p));
      toast.success("Preferences saved");
    } else {
      const row = {
        user_id: user.id,
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
        buddy_name: (data as any).buddy_name ?? "Buddy",
        buddy_avatar: (data as any).buddy_avatar ?? "bear",
        age_range: (data as any).age_range ?? "",
        onboarding_complete: (data as any).onboarding_complete ?? false,
        intake_condition: (data as any).intake_condition ?? null,
        intake_duration: (data as any).intake_duration ?? null,
        intake_body_regions: (data as any).intake_body_regions ?? [],
        intake_treatments: (data as any).intake_treatments ?? [],
        intake_goals: (data as any).intake_goals ?? null,
        profile_picture_url: (data as any).profile_picture_url ?? null,
        communication_style: (data as any).communication_style ?? {},
        display_name: (data as any).display_name ?? null,
      });
      toast.success("Preferences saved");
    }
  }, [prefs, user]);

  return { prefs, loading, savePrefs };
}
