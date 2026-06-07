import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// ─────────────────────────────────────────
//  Heartlight Collective × Supabase Bridge
//  Replace these with your real credentials
//  from your Supabase project settings
// ─────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Graceful degradation: warn if not configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Heartlight · Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. ' +
    'Add them to your .env file for cloud sync. Falling back to localStorage-only mode.'
  )
}

export const supabase = createClient<Database>(supabaseUrl || 'http://placeholder.supabase.co', supabaseAnonKey || 'placeholder')

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
