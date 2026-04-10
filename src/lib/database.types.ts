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
      barber_tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          assigned_to: string
          assigned_by: string | null
          assigned_date: string
          deadline: string | null
          status: string
          is_self_registered: boolean
          image_url: string | null
          report_note: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          priority: string
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assigned_to: string
          assigned_by?: string | null
          assigned_date?: string
          deadline?: string | null
          status?: string
          is_self_registered?: boolean
          image_url?: string | null
          report_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          priority?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assigned_to?: string
          assigned_by?: string | null
          assigned_date?: string
          deadline?: string | null
          status?: string
          is_self_registered?: boolean
          image_url?: string | null
          report_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          priority?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          category: string
          unit: string
          quantity: number
          min_quantity: number
          cost_price: number | null
          sell_price: number | null
          image_url: string | null
          notes: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category?: string
          unit?: string
          quantity?: number
          min_quantity?: number
          cost_price?: number | null
          sell_price?: number | null
          image_url?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          unit?: string
          quantity?: number
          min_quantity?: number
          cost_price?: number | null
          sell_price?: number | null
          image_url?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          id: string
          item_id: string
          action: string
          quantity_change: number
          quantity_after: number
          reason: string | null
          performed_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          item_id: string
          action: string
          quantity_change: number
          quantity_after: number
          reason?: string | null
          performed_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          action?: string
          quantity_change?: number
          quantity_after?: number
          reason?: string | null
          performed_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_status: {
        Row: {
          check_in_time: string | null
          current_session_id: string | null
          last_completed_at: string | null
          state: Database["public"]["Enums"]["barber_state_enum"] | null
          station_label: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          current_session_id?: string | null
          last_completed_at?: string | null
          state?: Database["public"]["Enums"]["barber_state_enum"] | null
          station_label?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          current_session_id?: string | null
          last_completed_at?: string | null
          state?: Database["public"]["Enums"]["barber_state_enum"] | null
          station_label?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_barber_status_users"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          assigned_barber_id: string | null
          booking_time: string
          created_at: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          service_id: string | null
          status: string | null
        }
        Insert: {
          assigned_barber_id?: string | null
          booking_time: string
          created_at?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          service_id?: string | null
          status?: string | null
        }
        Update: {
          assigned_barber_id?: string | null
          booking_time?: string
          created_at?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          service_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_task_logs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_date: string | null
          completed_at: string | null
          id: string
          image_url: string | null
          notes: string | null
          performed_by: string | null
          rejection_reason: string | null
          status: string | null
          task_def_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_date?: string | null
          completed_at?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          performed_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          task_def_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_date?: string | null
          completed_at?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          performed_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          task_def_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_task_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_task_logs_task_def_id_fkey"
            columns: ["task_def_id"]
            isOneToOne: false
            referencedRelation: "task_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_push_subscriptions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_sessions: {
        Row: {
          barber_id: string | null
          created_at: string | null
          customer_type:
            | Database["public"]["Enums"]["customer_type_enum"]
            | null
          end_time: string | null
          expected_end_time: string | null
          guest_name: string | null
          id: string
          start_time: string | null
          status: Database["public"]["Enums"]["session_status_enum"] | null
          total_amount: number | null
        }
        Insert: {
          barber_id?: string | null
          created_at?: string | null
          customer_type?:
            | Database["public"]["Enums"]["customer_type_enum"]
            | null
          end_time?: string | null
          expected_end_time?: string | null
          guest_name?: string | null
          id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["session_status_enum"] | null
          total_amount?: number | null
        }
        Update: {
          barber_id?: string | null
          created_at?: string | null
          customer_type?:
            | Database["public"]["Enums"]["customer_type_enum"]
            | null
          end_time?: string | null
          expected_end_time?: string | null
          guest_name?: string | null
          id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["session_status_enum"] | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_sessions_barber"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      session_items: {
        Row: {
          created_at: string | null
          id: string
          price_at_session: number
          service_id: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_at_session: number
          service_id?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price_at_session?: number
          service_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_definitions: {
        Row: {
          area: string
          description: string | null
          estimated_duration: string | null
          frequency: string | null
          id: string
          is_photo_required: boolean | null
          required_role: string
          scheduled_time: string | null
          shift: string | null
          title: string
        }
        Insert: {
          area: string
          description?: string | null
          estimated_duration?: string | null
          frequency?: string | null
          id?: string
          is_photo_required?: boolean | null
          required_role: string
          scheduled_time?: string | null
          shift?: string | null
          title: string
        }
        Update: {
          area?: string
          description?: string | null
          estimated_duration?: string | null
          frequency?: string | null
          id?: string
          is_photo_required?: boolean | null
          required_role?: string
          scheduled_time?: string | null
          shift?: string | null
          title?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          full_name: string
          id: string
          password_hash: string
          role: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          full_name: string
          id?: string
          password_hash: string
          role?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          full_name?: string
          id?: string
          password_hash?: string
          role?: string | null
          username?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          created_at: string
          date: string
          id: string
          shift: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          shift: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          shift?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      barber_state_enum:
        | "offline"
        | "available"
        | "consulting"
        | "busy"
        | "cooldown"
      customer_type_enum: "walk_in" | "booking"
      session_status_enum:
        | "waiting"
        | "consulting"
        | "in_progress"
        | "completed"
        | "cancelled"
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
      barber_state_enum: [
        "offline",
        "available",
        "consulting",
        "busy",
        "cooldown",
      ],
      customer_type_enum: ["walk_in", "booking"],
      session_status_enum: [
        "waiting",
        "consulting",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
