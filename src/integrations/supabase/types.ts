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
      candidates: {
        Row: {
          accumulated_points: number | null
          association: string | null
          birth_date: string
          created_at: string
          current_grade: string
          email: string | null
          federation: string
          full_name: string
          id: string
          registration_years: number | null
          target_grade: string
          updated_at: string
          zempo_registration: string | null
        }
        Insert: {
          accumulated_points?: number | null
          association?: string | null
          birth_date: string
          created_at?: string
          current_grade: string
          email?: string | null
          federation: string
          full_name: string
          id?: string
          registration_years?: number | null
          target_grade: string
          updated_at?: string
          zempo_registration?: string | null
        }
        Update: {
          accumulated_points?: number | null
          association?: string | null
          birth_date?: string
          created_at?: string
          current_grade?: string
          email?: string | null
          federation?: string
          full_name?: string
          id?: string
          registration_years?: number | null
          target_grade?: string
          updated_at?: string
          zempo_registration?: string | null
        }
        Relationships: []
      }
      evaluation_panel_scores: {
        Row: {
          created_at: string
          evaluation_id: string
          evaluator_grade: string
          evaluator_name: string
          evaluator_number: number
          id: string
          nota_final: number | null
          nota_pratica_final: number | null
          nota_teorica_final: number | null
          pratica_arbitragem: number | null
          pratica_goshin_jutsu: number | null
          pratica_ju_no_kata: number | null
          pratica_kaeshi_waza: number | null
          pratica_katame_no_kata: number | null
          pratica_katame_waza: number | null
          pratica_kime_no_kata: number | null
          pratica_nage_no_kata: number | null
          pratica_nage_waza: number | null
          pratica_pedagogia: number | null
          pratica_renraku_waza: number | null
          teoria_arbitragem: number | null
          teoria_atualidades: number | null
          teoria_etica: number | null
          teoria_filosofia: number | null
          teoria_historico: number | null
          teoria_kata: number | null
          teoria_tecnicas: number | null
          teoria_vocabulario: number | null
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          evaluator_grade: string
          evaluator_name: string
          evaluator_number: number
          id?: string
          nota_final?: number | null
          nota_pratica_final?: number | null
          nota_teorica_final?: number | null
          pratica_arbitragem?: number | null
          pratica_goshin_jutsu?: number | null
          pratica_ju_no_kata?: number | null
          pratica_kaeshi_waza?: number | null
          pratica_katame_no_kata?: number | null
          pratica_katame_waza?: number | null
          pratica_kime_no_kata?: number | null
          pratica_nage_no_kata?: number | null
          pratica_nage_waza?: number | null
          pratica_pedagogia?: number | null
          pratica_renraku_waza?: number | null
          teoria_arbitragem?: number | null
          teoria_atualidades?: number | null
          teoria_etica?: number | null
          teoria_filosofia?: number | null
          teoria_historico?: number | null
          teoria_kata?: number | null
          teoria_tecnicas?: number | null
          teoria_vocabulario?: number | null
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          evaluator_grade?: string
          evaluator_name?: string
          evaluator_number?: number
          id?: string
          nota_final?: number | null
          nota_pratica_final?: number | null
          nota_teorica_final?: number | null
          pratica_arbitragem?: number | null
          pratica_goshin_jutsu?: number | null
          pratica_ju_no_kata?: number | null
          pratica_kaeshi_waza?: number | null
          pratica_katame_no_kata?: number | null
          pratica_katame_waza?: number | null
          pratica_kime_no_kata?: number | null
          pratica_nage_no_kata?: number | null
          pratica_nage_waza?: number | null
          pratica_pedagogia?: number | null
          pratica_renraku_waza?: number | null
          teoria_arbitragem?: number | null
          teoria_atualidades?: number | null
          teoria_etica?: number | null
          teoria_filosofia?: number | null
          teoria_historico?: number | null
          teoria_kata?: number | null
          teoria_tecnicas?: number | null
          teoria_vocabulario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_panel_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_videos: {
        Row: {
          created_at: string
          description: string | null
          evaluation_id: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          uploaded_by: string
          video_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evaluation_id: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          uploaded_by: string
          video_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evaluation_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          uploaded_by?: string
          video_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_videos_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          candidate_id: string
          created_at: string
          created_by: string | null
          evaluation_date: string
          evaluator_grade: string
          evaluator_name: string
          exam_mode: string
          id: string
          location: string | null
          nota_final: number | null
          nota_pratica_final: number | null
          nota_teorica_final: number | null
          observations: string | null
          pratica_arbitragem: number | null
          pratica_goshin_jutsu: number | null
          pratica_ju_no_kata: number | null
          pratica_kaeshi_waza: number | null
          pratica_katame_no_kata: number | null
          pratica_katame_waza: number | null
          pratica_kime_no_kata: number | null
          pratica_nage_no_kata: number | null
          pratica_nage_waza: number | null
          pratica_pedagogia: number | null
          pratica_renraku_waza: number | null
          status: string | null
          target_grade: string
          teoria_arbitragem: number | null
          teoria_atualidades: number | null
          teoria_etica: number | null
          teoria_filosofia: number | null
          teoria_historico: number | null
          teoria_kata: number | null
          teoria_tecnicas: number | null
          teoria_vocabulario: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          validation_status: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          created_by?: string | null
          evaluation_date?: string
          evaluator_grade: string
          evaluator_name: string
          exam_mode?: string
          id?: string
          location?: string | null
          nota_final?: number | null
          nota_pratica_final?: number | null
          nota_teorica_final?: number | null
          observations?: string | null
          pratica_arbitragem?: number | null
          pratica_goshin_jutsu?: number | null
          pratica_ju_no_kata?: number | null
          pratica_kaeshi_waza?: number | null
          pratica_katame_no_kata?: number | null
          pratica_katame_waza?: number | null
          pratica_kime_no_kata?: number | null
          pratica_nage_no_kata?: number | null
          pratica_nage_waza?: number | null
          pratica_pedagogia?: number | null
          pratica_renraku_waza?: number | null
          status?: string | null
          target_grade: string
          teoria_arbitragem?: number | null
          teoria_atualidades?: number | null
          teoria_etica?: number | null
          teoria_filosofia?: number | null
          teoria_historico?: number | null
          teoria_kata?: number | null
          teoria_tecnicas?: number | null
          teoria_vocabulario?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          evaluation_date?: string
          evaluator_grade?: string
          evaluator_name?: string
          exam_mode?: string
          id?: string
          location?: string | null
          nota_final?: number | null
          nota_pratica_final?: number | null
          nota_teorica_final?: number | null
          observations?: string | null
          pratica_arbitragem?: number | null
          pratica_goshin_jutsu?: number | null
          pratica_ju_no_kata?: number | null
          pratica_kaeshi_waza?: number | null
          pratica_katame_no_kata?: number | null
          pratica_katame_waza?: number | null
          pratica_kime_no_kata?: number | null
          pratica_nage_no_kata?: number | null
          pratica_nage_waza?: number | null
          pratica_pedagogia?: number | null
          pratica_renraku_waza?: number | null
          status?: string | null
          target_grade?: string
          teoria_arbitragem?: number | null
          teoria_atualidades?: number | null
          teoria_etica?: number | null
          teoria_filosofia?: number | null
          teoria_historico?: number | null
          teoria_kata?: number | null
          teoria_tecnicas?: number | null
          teoria_vocabulario?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_programs: {
        Row: {
          created_at: string
          grade: string
          id: string
          minimum_age: number
          minimum_carency_years: number
          minimum_points: number
          practical_requirements: Json | null
          required_katas: Json | null
          theoretical_topics: Json | null
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          minimum_age: number
          minimum_carency_years: number
          minimum_points: number
          practical_requirements?: Json | null
          required_katas?: Json | null
          theoretical_topics?: Json | null
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          minimum_age?: number
          minimum_carency_years?: number
          minimum_points?: number
          practical_requirements?: Json | null
          required_katas?: Json | null
          theoretical_topics?: Json | null
        }
        Relationships: []
      }
      theoretical_questions: {
        Row: {
          category: string
          correct_answer: string | null
          created_at: string
          grade: string
          id: string
          options: Json | null
          points: number | null
          question: string
        }
        Insert: {
          category: string
          correct_answer?: string | null
          created_at?: string
          grade: string
          id?: string
          options?: Json | null
          points?: number | null
          question: string
        }
        Update: {
          category?: string
          correct_answer?: string | null
          created_at?: string
          grade?: string
          id?: string
          options?: Json | null
          points?: number | null
          question?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
