export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      doctor_reports: {
        Row: {
          average_energy: number | null
          average_pain: number | null
          context_note: string | null
          created_at: string
          flare_count: number | null
          functional_impact_summary: Json | null
          id: string
          patient_voice_quotes: Json | null
          pattern_insights: Json | null
          report_period_end: string
          report_period_start: string
          safety_or_red_flags: string | null
          treatments_tried: Json | null
          worst_pain: number | null
        }
        Insert: {
          average_energy?: number | null
          average_pain?: number | null
          context_note?: string | null
          created_at?: string
          flare_count?: number | null
          functional_impact_summary?: Json | null
          id?: string
          patient_voice_quotes?: Json | null
          pattern_insights?: Json | null
          report_period_end: string
          report_period_start: string
          safety_or_red_flags?: string | null
          treatments_tried?: Json | null
          worst_pain?: number | null
        }
        Update: {
          average_energy?: number | null
          average_pain?: number | null
          context_note?: string | null
          created_at?: string
          flare_count?: number | null
          functional_impact_summary?: Json | null
          id?: string
          patient_voice_quotes?: Json | null
          pattern_insights?: Json | null
          report_period_end?: string
          report_period_start?: string
          safety_or_red_flags?: string | null
          treatments_tried?: Json | null
          worst_pain?: number | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          body_regions: Json | null
          context_notes: string | null
          created_at: string
          emergency: boolean | null
          energy_level: number | null
          experienced_discrimination: boolean | null
          felt_dismissed_by_provider: boolean | null
          follow_up_question: string | null
          id: string
          impacts: Json | null
          journal_text: string | null
          mood: string | null
          pain_face_id: string | null
          pain_level: number | null
          pain_verbal: string | null
          qualities: Json | null
          raw_text: string | null
          reliefs: Json | null
          severity: string | null
          share_with_doctor_flags: Json | null
          sleep_hours: number | null
          summary: string | null
          symptoms: Json | null
          triggers: Json | null
        }
        Insert: {
          body_regions?: Json | null
          context_notes?: string | null
          created_at?: string
          emergency?: boolean | null
          energy_level?: number | null
          experienced_discrimination?: boolean | null
          felt_dismissed_by_provider?: boolean | null
          follow_up_question?: string | null
          id?: string
          impacts?: Json | null
          journal_text?: string | null
          mood?: string | null
          pain_face_id?: string | null
          pain_level?: number | null
          pain_verbal?: string | null
          qualities?: Json | null
          raw_text?: string | null
          reliefs?: Json | null
          severity?: string | null
          share_with_doctor_flags?: Json | null
          sleep_hours?: number | null
          summary?: string | null
          symptoms?: Json | null
          triggers?: Json | null
        }
        Update: {
          body_regions?: Json | null
          context_notes?: string | null
          created_at?: string
          emergency?: boolean | null
          energy_level?: number | null
          experienced_discrimination?: boolean | null
          felt_dismissed_by_provider?: boolean | null
          follow_up_question?: string | null
          id?: string
          impacts?: Json | null
          journal_text?: string | null
          mood?: string | null
          pain_face_id?: string | null
          pain_level?: number | null
          pain_verbal?: string | null
          qualities?: Json | null
          raw_text?: string | null
          reliefs?: Json | null
          severity?: string | null
          share_with_doctor_flags?: Json | null
          sleep_hours?: number | null
          summary?: string | null
          symptoms?: Json | null
          triggers?: Json | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          identity_tags: Json | null
          pain_misunderstanding_note: string | null
          pain_preference: string
          report_sharing_defaults: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          identity_tags?: Json | null
          pain_misunderstanding_note?: string | null
          pain_preference?: string
          report_sharing_defaults?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          identity_tags?: Json | null
          pain_misunderstanding_note?: string | null
          pain_preference?: string
          report_sharing_defaults?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
