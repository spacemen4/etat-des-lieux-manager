
import { createClient } from '@supabase/supabase-js'

// Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[Supabase] ===== CONFIGURATION DEBUG =====');
console.log('[Supabase] URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT_SET');
console.log('[Supabase] Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT_SET');

if (!supabaseUrl) {
  console.error('[Supabase] CRITICAL ERROR: VITE_SUPABASE_URL is not set');
  throw new Error("VITE_SUPABASE_URL is not set. Please check your .env file.")
}

if (!supabaseAnonKey) {
  console.error('[Supabase] CRITICAL ERROR: VITE_SUPABASE_ANON_KEY is not set');
  throw new Error("VITE_SUPABASE_ANON_KEY is not set. Please check your .env file.")
}

console.log('[Supabase] Creating client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
console.log('[Supabase] Client created successfully');

/**
 * JWT expiration handling system
 * 
 * This system automatically detects JWT expiration errors and redirects users
 * to the login page instead of showing technical error messages.
 * 
 * Usage:
 * 1. Import useSupabaseErrorHandler in your components
 * 2. Call handleError(error) in catch blocks
 * 
 * Example:
 * ```
 * const { handleError } = useSupabaseErrorHandler();
 * try {
 *   const { data, error } = await supabase.from('table').select('*');
 *   if (error) throw error;
 * } catch (error) {
 *   if (!handleError(error)) {
 *     // Handle other non-JWT errors
 *     console.error(error);
 *   }
 * }
 * ```
 */
let jwtExpirationHandler: (() => void) | null = null

export const setJwtExpirationHandler = (handler: () => void) => {
  jwtExpirationHandler = handler
}

// Check if error is JWT expiration
export const isJwtExpiredError = (error: any): boolean => {
  if (!error) return false
  
  const message = error.message?.toLowerCase() || ''
  const code = error.code?.toLowerCase() || ''
  
  return (
    message.includes('jwt expired') ||
    message.includes('token expired') ||
    message.includes('jwt malformed') ||
    message.includes('invalid jwt') ||
    code === 'invalid_jwt' ||
    code === 'jwt_expired'
  )
}

// Handle JWT expiration
export const handleJwtExpiration = (error: any) => {
  if (isJwtExpiredError(error) && jwtExpirationHandler) {
    console.log('JWT expired, redirecting to login...')
    jwtExpirationHandler()
    return true
  }
  return false
}
