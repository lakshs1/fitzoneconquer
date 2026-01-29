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
      activities: {
        Row: {
          activity_type: string
          calories: number | null
          created_at: string
          distance: number | null
          duration: number | null
          end_coordinates: Json | null
          ended_at: string | null
          id: string
          loops_completed: number | null
          path: Json | null
          start_coordinates: Json | null
          started_at: string
          user_id: string
          xp_earned: number | null
          zone_created_id: string | null
        }
        Insert: {
          activity_type: string
          calories?: number | null
          created_at?: string
          distance?: number | null
          duration?: number | null
          end_coordinates?: Json | null
          ended_at?: string | null
          id?: string
          loops_completed?: number | null
          path?: Json | null
          start_coordinates?: Json | null
          started_at?: string
          user_id: string
          xp_earned?: number | null
          zone_created_id?: string | null
        }
        Update: {
          activity_type?: string
          calories?: number | null
          created_at?: string
          distance?: number | null
          duration?: number | null
          end_coordinates?: Json | null
          ended_at?: string | null
          id?: string
          loops_completed?: number | null
          path?: Json | null
          start_coordinates?: Json | null
          started_at?: string
          user_id?: string
          xp_earned?: number | null
          zone_created_id?: string | null
        }
        Relationships: []
      }
      ai_coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          email: string | null
          fitness_goals: string[] | null
          fitness_level: string | null
          gender: string | null
          id: string
          menstrual_tracking: boolean | null
          name: string
          onboarded: boolean | null
          sleep_time: string | null
          updated_at: string
          user_id: string
          wake_time: string | null
          work_end: string | null
          work_start: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          fitness_goals?: string[] | null
          fitness_level?: string | null
          gender?: string | null
          id?: string
          menstrual_tracking?: boolean | null
          name: string
          onboarded?: boolean | null
          sleep_time?: string | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
          work_end?: string | null
          work_start?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          fitness_goals?: string[] | null
          fitness_level?: string | null
          gender?: string | null
          id?: string
          menstrual_tracking?: boolean | null
          name?: string
          onboarded?: boolean | null
          sleep_time?: string | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
          work_end?: string | null
          work_start?: string | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          id: string
          last_activity_date: string | null
          level: number | null
          streak: number | null
          total_activities: number | null
          total_calories: number | null
          total_distance: number | null
          updated_at: string
          user_id: string
          xp: number | null
          zones_captured: number | null
          zones_lost: number | null
          zones_owned: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number | null
          streak?: number | null
          total_activities?: number | null
          total_calories?: number | null
          total_distance?: number | null
          updated_at?: string
          user_id: string
          xp?: number | null
          zones_captured?: number | null
          zones_lost?: number | null
          zones_owned?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number | null
          streak?: number | null
          total_activities?: number | null
          total_calories?: number | null
          total_distance?: number | null
          updated_at?: string
          user_id?: string
          xp?: number | null
          zones_captured?: number | null
          zones_lost?: number | null
          zones_owned?: number | null
        }
        Relationships: []
      }
      zone_captures: {
        Row: {
          activity_id: string | null
          challenger_id: string
          created_at: string
          duration_minutes: number
          id: string
          previous_owner_id: string | null
          successful: boolean | null
          zone_id: string
        }
        Insert: {
          activity_id?: string | null
          challenger_id: string
          created_at?: string
          duration_minutes: number
          id?: string
          previous_owner_id?: string | null
          successful?: boolean | null
          zone_id: string
        }
        Update: {
          activity_id?: string | null
          challenger_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          previous_owner_id?: string | null
          successful?: boolean | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_captures_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_captures_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          captured_at: string | null
          center: Json
          coordinates: Json
          created_at: string
          defense_challenge_type: string | null
          defense_target_score: number | null
          id: string
          level: number | null
          name: string
          owner_id: string | null
          owner_name: string | null
          updated_at: string
        }
        Insert: {
          captured_at?: string | null
          center: Json
          coordinates?: Json
          created_at?: string
          defense_challenge_type?: string | null
          defense_target_score?: number | null
          id?: string
          level?: number | null
          name: string
          owner_id?: string | null
          owner_name?: string | null
          updated_at?: string
        }
        Update: {
          captured_at?: string | null
          center?: Json
          coordinates?: Json
          created_at?: string
          defense_challenge_type?: string | null
          defense_target_score?: number | null
          id?: string
          level?: number | null
          name?: string
          owner_id?: string | null
          owner_name?: string | null
          updated_at?: string
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
