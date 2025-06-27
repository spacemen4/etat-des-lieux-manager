
import { createClient } from '@supabase/supabase-js'

// Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is not set. Please check your .env file.")
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY is not set. Please check your .env file.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
