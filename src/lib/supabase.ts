import { createClient } from '@supabase/supabase-js'

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    role: 'admin' | 'staff'
                    managed_area: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    role?: 'admin' | 'staff'
                    managed_area?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    role?: 'admin' | 'staff'
                    managed_area?: string | null
                    created_at?: string
                    total_facilities: number
                    active_count: number
                }
            }
            dashboard_facilities_by_type: {
                Row: {
                    type: string
                    total: number
                }
            }
        }
        Functions: {
            get_current_user_role: {
                Args: Record<PropertyKey, never>
                Returns: 'admin' | 'staff'
            }
            get_current_user_area: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            user_role: 'admin' | 'staff'
            facility_status: 'active' | 'inactive' | 'suspended'
            inspection_result: 'passed' | 'failed' | 'pending'
        }
    }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Key is missing in environment variables.")
}

export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '')
