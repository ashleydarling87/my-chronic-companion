export interface CommunicationStyle {
  message_length?: string;
  tone?: string;
  emoji_usage?: string;
  vocabulary?: string;
  humor?: string;
}

export interface NotificationPreferences {
  dailyReminder: boolean;
  weeklyReport: boolean;
  encouragement: boolean;
  crisisUpdates: boolean;
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
  usage_mode: string;
  care_recipient_name: string | null;
  care_recipient_age_range: string | null;
  notification_preferences: NotificationPreferences;
}
