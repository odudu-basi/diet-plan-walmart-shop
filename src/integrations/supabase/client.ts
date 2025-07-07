
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { Capacitor } from '@capacitor/core'

const supabaseUrl = "https://oxyzuhhzwabkginrsyro.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eXp1aGh6d2Fia2dpbnJzeXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk0MjcyNjksImV4cCI6MjAzNTAwMzI2OX0.VzaJEe6jNl9wfEvBFQzQPh6YnE5-WLAb0HGrON_OLrg"

// Configure auth for native apps
const getAuthConfig = () => {
  if (Capacitor.isNativePlatform()) {
    return {
      auth: {
        storage: window.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Important for native apps
      flowType: 'pkce' as any
      }
    }
  }
  
  return {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce' as any
    }
  }
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  getAuthConfig()
)
