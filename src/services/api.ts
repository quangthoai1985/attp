import { supabase } from "@/lib/supabase"

// Placeholder for API services
export const api = {
    // Example function
    getProfiles: async () => {
        return await supabase.from('profiles').select('*')
    }
}
