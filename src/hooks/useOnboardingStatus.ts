import { useUserPreferencesContext } from "@/contexts/UserPreferencesContext";

export function useOnboardingStatus() {
  const { prefs, loading } = useUserPreferencesContext();

  return {
    onboardingComplete: prefs?.onboarding_complete === true,
    loading,
  };
}
