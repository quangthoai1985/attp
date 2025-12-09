import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { Database } from "./supabase"

// Create admin client with service role key for privileged operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Admin client - only use for admin operations (create users, change passwords)
export const supabaseAdmin: SupabaseClient<Database> | null = serviceRoleKey
    ? createClient<Database>(supabaseUrl || '', serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null

// Helper to get admin client with proper typing
function getAdminClient(): SupabaseClient<Database> {
    if (!supabaseAdmin) {
        throw new Error("Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to .env")
    }
    return supabaseAdmin
}

export interface CreateUserData {
    username: string
    email: string
    password: string
    full_name: string
    role: 'admin' | 'staff'
    managed_area?: string
}

export interface UpdatePasswordData {
    userId: string
    newPassword: string
}

/**
 * Create a new user account (Admin only)
 */
export async function createUserAccount(data: CreateUserData, createdById: string) {
    const client = getAdminClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await client.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
            full_name: data.full_name
        }
    })

    if (authError) {
        throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
        throw new Error("User creation failed - no user returned")
    }

    // 2. Create profile
    const profileData = {
        id: authData.user.id,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        managed_area: data.managed_area || null,
        created_by: createdById
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await client
        .from("profiles")
        .insert(profileData as any)

    if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await client.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    return authData.user
}

/**
 * Update user password (Admin only)
 */
export async function updateUserPassword({ userId, newPassword }: UpdatePasswordData) {
    const client = getAdminClient()

    const { error } = await client.auth.admin.updateUserById(userId, {
        password: newPassword
    })

    if (error) {
        throw new Error(`Failed to update password: ${error.message}`)
    }

    return true
}

/**
 * Get all sub-accounts created by a user
 */
export async function getSubAccounts(parentUserId: string) {
    const client = getAdminClient()

    const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("created_by", parentUserId)
        .order("created_at", { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch sub-accounts: ${error.message}`)
    }

    return data
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers() {
    const client = getAdminClient()

    const { data, error } = await client
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return data
}

/**
 * Delete a user account (Admin only)
 */
export async function deleteUserAccount(userId: string) {
    const client = getAdminClient()

    // Delete from auth (this will cascade to profile via trigger or we delete manually)
    const { error: authError } = await client.auth.admin.deleteUser(userId)

    if (authError) {
        throw new Error(`Failed to delete user: ${authError.message}`)
    }

    // Also delete profile explicitly
    await client.from("profiles").delete().eq("id", userId)

    return true
}

/**
 * Lookup email by username
 */
export async function lookupEmailByUsername(username: string): Promise<string | null> {
    if (!supabaseAdmin) {
        // Fallback to regular client for public lookup
        const { createClient } = await import("@supabase/supabase-js")
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const client = createClient(supabaseUrl, supabaseAnonKey)

        const { data } = await client
            .from("profiles")
            .select("id")
            .eq("username", username)
            .single()

        if (!data) return null

        // We need admin to get email, so this won't work without service key
        return null
    }

    const client = getAdminClient()

    const { data: profile } = await client
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single()

    if (!profile) return null

    // Get email from auth
    const { data: authData } = await client.auth.admin.getUserById((profile as { id: string }).id)

    return authData?.user?.email || null
}
