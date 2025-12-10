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
                    username: string | null
                    email: string | null
                    full_name: string | null
                    role: 'admin' | 'staff'
                    managed_area: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    email?: string | null
                    full_name?: string | null
                    role?: 'admin' | 'staff'
                    managed_area?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    email?: string | null
                    full_name?: string | null
                    role?: 'admin' | 'staff'
                    managed_area?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            facilities: {
                Row: {
                    id: string
                    name: string
                    owner_name: string | null
                    address: string | null
                    type: string
                    province_code: string
                    status: 'active' | 'inactive' | 'suspended'
                    is_certified: boolean | null
                    certificate_number: string | null
                    certificate_expiry: string | null
                    certificate_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    owner_name?: string | null
                    address?: string | null
                    type: string
                    province_code: string
                    status?: 'active' | 'inactive' | 'suspended'
                    is_certified?: boolean | null
                    certificate_number?: string | null
                    certificate_expiry?: string | null
                    certificate_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    owner_name?: string | null
                    address?: string | null
                    type?: string
                    province_code?: string
                    status?: 'active' | 'inactive' | 'suspended'
                    is_certified?: boolean | null
                    certificate_number?: string | null
                    certificate_expiry?: string | null
                    certificate_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            facility_types: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            inspections: {
                Row: {
                    id: string
                    facility_id: string
                    inspection_date: string | null
                    year: number
                    team_type: 'chuyen_nganh' | 'lien_nganh'
                    result: 'dat' | 'cho_khac_phuc' | 'da_khac_phuc' | 'khong_dat'
                    remediation_deadline: string | null
                    has_penalty: boolean
                    penalty_amount: number | null
                    penalty_agency: string | null
                    sanction_type: string | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    facility_id: string
                    inspection_date?: string | null
                    year: number
                    team_type: 'chuyen_nganh' | 'lien_nganh'
                    result?: 'dat' | 'cho_khac_phuc' | 'da_khac_phuc' | 'khong_dat'
                    remediation_deadline?: string | null
                    has_penalty?: boolean
                    penalty_amount?: number | null
                    penalty_agency?: string | null
                    sanction_type?: string | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    facility_id?: string
                    inspection_date?: string | null
                    year?: number
                    team_type?: 'chuyen_nganh' | 'lien_nganh'
                    result?: 'dat' | 'cho_khac_phuc' | 'da_khac_phuc' | 'khong_dat'
                    remediation_deadline?: string | null
                    has_penalty?: boolean
                    penalty_amount?: number | null
                    penalty_agency?: string | null
                    sanction_type?: string | null
                    notes?: string | null
                    created_at?: string
                }
            }
            dashboard_facilities_by_type: {
                Row: {
                    type: string
                    total: number
                }
            }
            site_config: {
                Row: {
                    id: string
                    logo_url: string | null
                    logo_height: number | null
                    login_background_url: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id?: string
                    logo_url?: string | null
                    logo_height?: number | null
                    login_background_url?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Update: {
                    id?: string
                    logo_url?: string | null
                    logo_height?: number | null
                    login_background_url?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
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
