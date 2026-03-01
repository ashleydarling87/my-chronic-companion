import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { UserPreferences, NotificationPreferences } from "@/hooks/useUserPreferences.types";

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  dailyReminder: true,
  weeklyReport: true,
  encouragement: false,
  crisisUpdates: true,
};

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
  usage_mode: "self",
  care_recipient_name: null,
  care_recipient_age_range: null,
  notification_preferences: DEFAULT_NOTIFICATION_PREFS,
};

interface UserPreferencesContextValue {
  prefs: UserPreferences | null;
  loading: boolean;
  savePrefs: (updated: Partial<Omit<UserPreferences, "id">>) => Promise<void>;
  refreshPrefs: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

function parseRow(data: any): UserPreferences {
  return {
    id: data.id,
    pain_preference: data.pain_preference as UserPreferences["pain_preference"],
    pain_misunderstanding_note: (data.pain_misunderstanding_note as string) ?? "",
    identity_tags: (data.identity_tags as string[]) ?? [],
    report_sharing_defaults: (data.report_sharing_defaults as UserPreferences["report_sharing_defaults"]) ?? DEFAULT_PREFS.report_sharing_defaults,
    buddy_name: data.buddy_name ?? "Buddy",
    buddy_avatar: data.buddy_avatar ?? "bear",
    age_range: data.age_range ?? "",
    onboarding_complete: data.onboarding_complete ?? false,
    intake_condition: data.intake_condition ?? null,
    intake_duration: data.intake_duration ?? null,
    intake_body_regions: data.intake_body_regions ?? [],
    intake_treatments: data.intake_treatments ?? [],
    intake_goals: data.intake_goals ?? null,
    profile_picture_url: data.profile_picture_url ?? null,
    communication_style: data.communication_style ?? {},
    display_name: data.display_name ?? null,
    my_symptoms: data.my_symptoms ?? [],
    usage_mode: data.usage_mode ?? "self",
    care_recipient_name: data.care_recipient_name ?? null,
    care_recipient_age_range: data.care_recipient_age_range ?? null,
    notification_preferences: data.notification_preferences ?? DEFAULT_NOTIFICATION_PREFS,
  };
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPrefs(null);
      setLoading(false);
      return;
    }
    (async () => {
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
      if (data) setPrefs(parseRow(data));
      setLoading(false);
    })();
  }, [user]);

  const savePrefs = useCallback(async (updated: Partial<Omit<UserPreferences, "id">>) => {
    if (!user) return;

    if (prefs?.id) {
      const patch: Record<string, unknown> = {};
      for (const key of Object.keys(updated) as (keyof typeof updated)[]) {
        patch[key] = updated[key];
      }

      const { error } = await supabase
        .from("user_preferences")
        .update(patch)
        .eq("id", prefs.id);

      if (error) { toast.error("Failed to save preferences"); return; }
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

      if (error) { toast.error("Failed to save preferences"); return; }
      setPrefs(parseRow(data));
      toast.success("Preferences saved");
    }
  }, [prefs, user]);

  return (
    <UserPreferencesContext.Provider value={{ prefs, loading, savePrefs }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferencesContext() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error("useUserPreferencesContext must be used within UserPreferencesProvider");
  return ctx;
}
