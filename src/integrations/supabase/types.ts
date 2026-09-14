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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cockpit_analyses: {
        Row: {
          anomaly_message: string | null
          category: string | null
          category_label: string | null
          chart_data: Json | null
          chart_type: string | null
          created_at: string
          has_anomaly: boolean | null
          id: string
          last_refreshed: string | null
          query: string | null
          saved_at: string | null
          summary: string | null
          target_count: number | null
          title: string
        }
        Insert: {
          anomaly_message?: string | null
          category?: string | null
          category_label?: string | null
          chart_data?: Json | null
          chart_type?: string | null
          created_at?: string
          has_anomaly?: boolean | null
          id?: string
          last_refreshed?: string | null
          query?: string | null
          saved_at?: string | null
          summary?: string | null
          target_count?: number | null
          title: string
        }
        Update: {
          anomaly_message?: string | null
          category?: string | null
          category_label?: string | null
          chart_data?: Json | null
          chart_type?: string | null
          created_at?: string
          has_anomaly?: boolean | null
          id?: string
          last_refreshed?: string | null
          query?: string | null
          saved_at?: string | null
          summary?: string | null
          target_count?: number | null
          title?: string
        }
        Relationships: []
      }
      data_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          id: string
          processed_at: string | null
          raw_content: string | null
          status: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string
          id?: string
          processed_at?: string | null
          raw_content?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          processed_at?: string | null
          raw_content?: string | null
          status?: string
        }
        Relationships: []
      }
      document_contents: {
        Row: {
          created_at: string
          file_name: string
          file_size: string | null
          file_type: string | null
          id: string
          parsed_text: string | null
          source_id: string
          status: string
          storage_path: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: string | null
          file_type?: string | null
          id?: string
          parsed_text?: string | null
          source_id: string
          status?: string
          storage_path: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: string | null
          file_type?: string | null
          id?: string
          parsed_text?: string | null
          source_id?: string
          status?: string
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      hcp_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          created_at: string
          hcp_id: string
          id: string
          title: string
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          created_at?: string
          hcp_id: string
          id?: string
          title: string
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          created_at?: string
          hcp_id?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      hcp_conferences: {
        Row: {
          conference_date: string | null
          created_at: string
          hcp_id: string
          id: string
          location: string | null
          name: string
          role: string | null
          topic: string | null
        }
        Insert: {
          conference_date?: string | null
          created_at?: string
          hcp_id: string
          id?: string
          location?: string | null
          name: string
          role?: string | null
          topic?: string | null
        }
        Update: {
          conference_date?: string | null
          created_at?: string
          hcp_id?: string
          id?: string
          location?: string | null
          name?: string
          role?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      hcp_grants: {
        Row: {
          amount: string | null
          created_at: string
          funding_body: string | null
          hcp_id: string
          id: string
          period: string | null
          role: string | null
          status: string | null
          title: string
        }
        Insert: {
          amount?: string | null
          created_at?: string
          funding_body?: string | null
          hcp_id: string
          id?: string
          period?: string | null
          role?: string | null
          status?: string | null
          title: string
        }
        Update: {
          amount?: string | null
          created_at?: string
          funding_body?: string | null
          hcp_id?: string
          id?: string
          period?: string | null
          role?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      hcp_guidelines: {
        Row: {
          created_at: string
          hcp_id: string
          id: string
          organization: string | null
          role: string | null
          status: string | null
          title: string
          year: string | null
        }
        Insert: {
          created_at?: string
          hcp_id: string
          id?: string
          organization?: string | null
          role?: string | null
          status?: string | null
          title: string
          year?: string | null
        }
        Update: {
          created_at?: string
          hcp_id?: string
          id?: string
          organization?: string | null
          role?: string | null
          status?: string | null
          title?: string
          year?: string | null
        }
        Relationships: []
      }
      hcp_news: {
        Row: {
          created_at: string
          hcp_id: string
          id: string
          published_date: string | null
          source: string | null
          summary: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          hcp_id: string
          id?: string
          published_date?: string | null
          source?: string | null
          summary?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          hcp_id?: string
          id?: string
          published_date?: string | null
          source?: string | null
          summary?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      hcp_profiles: {
        Row: {
          admin_title: string | null
          city: string | null
          created_at: string
          education: string | null
          expertise: string | null
          gender: string | null
          hcp_id: string
          hospital_category: string | null
          id: string
          institution: string | null
          is_subscribed: boolean
          name: string
          official_website: string | null
          other_institutions: string | null
          professional_title: string | null
          province: string | null
          raw_department: string | null
          resume: string | null
          standard_department: string | null
          supervisor_title: string | null
          updated_at: string
        }
        Insert: {
          admin_title?: string | null
          city?: string | null
          created_at?: string
          education?: string | null
          expertise?: string | null
          gender?: string | null
          hcp_id: string
          hospital_category?: string | null
          id?: string
          institution?: string | null
          is_subscribed?: boolean
          name: string
          official_website?: string | null
          other_institutions?: string | null
          professional_title?: string | null
          province?: string | null
          raw_department?: string | null
          resume?: string | null
          standard_department?: string | null
          supervisor_title?: string | null
          updated_at?: string
        }
        Update: {
          admin_title?: string | null
          city?: string | null
          created_at?: string
          education?: string | null
          expertise?: string | null
          gender?: string | null
          hcp_id?: string
          hospital_category?: string | null
          id?: string
          institution?: string | null
          is_subscribed?: boolean
          name?: string
          official_website?: string | null
          other_institutions?: string | null
          professional_title?: string | null
          province?: string | null
          raw_department?: string | null
          resume?: string | null
          standard_department?: string | null
          supervisor_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hcp_publications: {
        Row: {
          authors: string[] | null
          citations: number | null
          created_at: string
          doi: string | null
          hcp_id: string
          id: string
          impact_factor: number | null
          journal: string
          published_date: string | null
          title: string
        }
        Insert: {
          authors?: string[] | null
          citations?: number | null
          created_at?: string
          doi?: string | null
          hcp_id: string
          id?: string
          impact_factor?: number | null
          journal: string
          published_date?: string | null
          title: string
        }
        Update: {
          authors?: string[] | null
          citations?: number | null
          created_at?: string
          doi?: string | null
          hcp_id?: string
          id?: string
          impact_factor?: number | null
          journal?: string
          published_date?: string | null
          title?: string
        }
        Relationships: []
      }
      hcp_relations: {
        Row: {
          created_at: string
          hcp_id: string
          id: string
          related_department: string | null
          related_hcp_id: string
          related_institution: string | null
          related_name: string
          relation_type: string
          strength: number | null
        }
        Insert: {
          created_at?: string
          hcp_id: string
          id?: string
          related_department?: string | null
          related_hcp_id: string
          related_institution?: string | null
          related_name: string
          relation_type: string
          strength?: number | null
        }
        Update: {
          created_at?: string
          hcp_id?: string
          id?: string
          related_department?: string | null
          related_hcp_id?: string
          related_institution?: string | null
          related_name?: string
          relation_type?: string
          strength?: number | null
        }
        Relationships: []
      }
      hcp_research_areas: {
        Row: {
          area_type: string
          company: string | null
          created_at: string
          hcp_id: string
          id: string
          level: string | null
          name: string
        }
        Insert: {
          area_type: string
          company?: string | null
          created_at?: string
          hcp_id: string
          id?: string
          level?: string | null
          name: string
        }
        Update: {
          area_type?: string
          company?: string | null
          created_at?: string
          hcp_id?: string
          id?: string
          level?: string | null
          name?: string
        }
        Relationships: []
      }
      hcp_tags: {
        Row: {
          confidence: number | null
          created_at: string
          hcp_id: string
          id: string
          source: string
          tag_category: string
          tag_key: string
          tag_value: string
          upload_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          hcp_id: string
          id?: string
          source?: string
          tag_category: string
          tag_key: string
          tag_value: string
          upload_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          hcp_id?: string
          id?: string
          source?: string
          tag_category?: string
          tag_key?: string
          tag_value?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hcp_tags_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "data_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      hcp_trials: {
        Row: {
          created_at: string
          end_date: string | null
          hcp_id: string
          id: string
          phase: string | null
          registration_id: string | null
          role: string | null
          start_date: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          hcp_id: string
          id?: string
          phase?: string | null
          registration_id?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          hcp_id?: string
          id?: string
          phase?: string | null
          registration_id?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      nba_actions: {
        Row: {
          action: string
          channel: string | null
          created_at: string
          deadline: string | null
          hcp_id: string | null
          hcp_name: string
          id: string
          priority: string | null
          score: number | null
          status: string | null
        }
        Insert: {
          action: string
          channel?: string | null
          created_at?: string
          deadline?: string | null
          hcp_id?: string | null
          hcp_name: string
          id?: string
          priority?: string | null
          score?: number | null
          status?: string | null
        }
        Update: {
          action?: string
          channel?: string | null
          created_at?: string
          deadline?: string | null
          hcp_id?: string | null
          hcp_name?: string
          id?: string
          priority?: string | null
          score?: number | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          affinity: number | null
          created_at: string
          hcp_id: string
          hcp_name: string
          hospital: string | null
          id: string
          priority: string | null
          publications_count: number | null
          signal_type: string
          summary: string | null
          tags: string[] | null
          trials_count: number | null
        }
        Insert: {
          affinity?: number | null
          created_at?: string
          hcp_id: string
          hcp_name: string
          hospital?: string | null
          id?: string
          priority?: string | null
          publications_count?: number | null
          signal_type: string
          summary?: string | null
          tags?: string[] | null
          trials_count?: number | null
        }
        Update: {
          affinity?: number | null
          created_at?: string
          hcp_id?: string
          hcp_name?: string
          hospital?: string | null
          id?: string
          priority?: string | null
          publications_count?: number | null
          signal_type?: string
          summary?: string | null
          tags?: string[] | null
          trials_count?: number | null
        }
        Relationships: []
      }
      user_hcp_subscriptions: {
        Row: {
          created_at: string
          hcp_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hcp_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hcp_id?: string
          id?: string
          user_id?: string
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
