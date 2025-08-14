import { useCallback } from 'react';
import { handleJwtExpiration } from '../lib/supabase';

export const useSupabaseErrorHandler = () => {
  const handleError = useCallback((error: any) => {
    // Check if it's a JWT expiration error and handle it
    if (handleJwtExpiration(error)) {
      return true; // Error was handled (JWT expiration)
    }
    return false; // Error was not handled
  }, []);

  return { handleError };
};