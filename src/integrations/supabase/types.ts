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
      appointments: {
        Row: {
          barber_id: string | null
          client_name: string
          client_phone: string | null
          company_id: string | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          total_price: number
          unit_id: string
        }
        Insert: {
          barber_id?: string | null
          client_name: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price: number
          unit_id: string
        }
        Update: {
          barber_id?: string | null
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          calendar_color: string | null
          commission_rate: number | null
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          unit_id: string
        }
        Insert: {
          calendar_color?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          unit_id: string
        }
        Update: {
          calendar_color?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          business_name: string | null
          closing_time: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          opening_time: string | null
          updated_at: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          business_name?: string | null
          closing_time?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          opening_time?: string | null
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          business_name?: string | null
          closing_time?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          opening_time?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string | null
          evolution_api_key: string | null
          evolution_instance_name: string | null
          id: string
          name: string
          owner_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          company_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          unit_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          unit_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string
          id: string
          manager_name: string | null
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          manager_name?: string | null
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          manager_name?: string | null
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_company: { Args: { p_company_id: string }; Returns: boolean }
      user_owns_unit: { Args: { unit_id: string }; Returns: boolean }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
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
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
} as const
