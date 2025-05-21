'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type SupabaseContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, role: 'brand' | 'influencer', fullName: string) => Promise<{
    error: Error | null
    data: { user: User | null } | null
  }>
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    data: { user: User | null } | null
  }>
  signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }
    
    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      
      // Force a router refresh when auth state changes
      // This ensures that server components re-fetch data with the new auth state
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signUp = async (email: string, password: string, role: 'brand' | 'influencer', fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
        // Set a longer session expiry (e.g., 7 days)
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (data.user) {
      // Create user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            role,
          },
        ])

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Set a longer session expiry (e.g., 7 days)
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/sign-in')
  }

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
