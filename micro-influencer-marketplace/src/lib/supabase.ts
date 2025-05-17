import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'brand' | 'influencer'
          created_at: string
          updated_at: string
          last_login: string | null
          is_verified: boolean
          avatar_url: string | null
        }
        Insert: {
          email: string
          full_name: string
          role: 'brand' | 'influencer'
          avatar_url?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          role?: 'brand' | 'influencer'
          last_login?: string | null
          is_verified?: boolean
          avatar_url?: string | null
        }
      }
      brand_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string
          industry: string
          website: string | null
          description: string | null
          location: string | null
          company_size: string | null
          budget_range: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          company_name: string
          industry: string
          website?: string | null
          description?: string | null
          location?: string | null
          company_size?: string | null
          budget_range?: string | null
        }
        Update: {
          company_name?: string
          industry?: string
          website?: string | null
          description?: string | null
          location?: string | null
          company_size?: string | null
          budget_range?: string | null
        }
      }
    }
  }
} 