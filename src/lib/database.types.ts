export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
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
                        foreignKeyName: "barber_status_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
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
                        foreignKeyName: "bookings_assigned_barber_id_fkey"
                        columns: ["assigned_barber_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_service_id_fkey"
                        columns: ["service_id"]
                        isOneToOne: false
                        referencedRelation: "services"
                        referencedColumns: ["id"]
                    }
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
            service_sessions: {
                Row: {
                    barber_id: string | null
                    created_at: string | null
                    customer_type: Database["public"]["Enums"]["customer_type_enum"] | null
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
                    customer_type?: Database["public"]["Enums"]["customer_type_enum"] | null
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
                    customer_type?: Database["public"]["Enums"]["customer_type_enum"] | null
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
                        foreignKeyName: "service_sessions_barber_id_fkey"
                        columns: ["barber_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
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
                    }
                ]
            }
            users: {
                Row: {
                    created_at: string | null
                    department: string | null
                    full_name: string | null
                    id: string
                    password_hash: string | null
                    role: string | null
                    username: string | null
                }
                Insert: {
                    created_at?: string | null
                    department?: string | null
                    full_name?: string | null
                    id?: string
                    password_hash?: string | null
                    role?: string | null
                    username?: string | null
                }
                Update: {
                    created_at?: string | null
                    department?: string | null
                    full_name?: string | null
                    id?: string
                    password_hash?: string | null
                    role?: string | null
                    username?: string | null
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
