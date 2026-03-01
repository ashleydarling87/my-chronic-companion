// Re-export types and the shared hook from context
export type { CommunicationStyle, NotificationPreferences, UserPreferences } from "./useUserPreferences.types";
export { useUserPreferencesContext as useUserPreferences } from "@/contexts/UserPreferencesContext";
