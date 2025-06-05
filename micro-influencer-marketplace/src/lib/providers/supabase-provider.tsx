// lib/providers/supabase-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, Session } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'

interface SupabaseContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  supabase: SupabaseClient
  signUp: (
    email: string,
    password: string,
    role: 'brand' | 'influencer',
    fullName: string
  ) => Promise<{ error: Error | null }>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    console.log('SupabaseProvider: Initializing...')
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('SupabaseProvider: Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('SupabaseProvider: Error getting session:', error)
        } else {
          console.log('SupabaseProvider: Initial session:', session ? 'found' : 'not found')
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('SupabaseProvider: Error in getInitialSession:', error)
      } finally {
        setIsLoading(false)
        console.log('SupabaseProvider: Initial loading complete')
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('SupabaseProvider: Auth state changed:', event, session ? 'session exists' : 'no session')
        
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      console.log('SupabaseProvider: Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [supabase])

  // Handle page visibility change
  useEffect(() => {
    let lastCheck = Date.now()
    const minInterval = 5000 // Minimum 5 seconds between checks

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Only refresh if enough time has passed since last check
        const now = Date.now()
        if (now - lastCheck >= minInterval) {
          console.log('SupabaseProvider: Page became visible, refreshing session...')
          try {
            const { data: { session: newSession }, error } = await supabase.auth.getSession()
            if (!error && newSession) {
              // Only update state if session has changed
              if (JSON.stringify(newSession) !== JSON.stringify(session)) {
                setSession(newSession)
                setUser(newSession.user)
              }
            }
          } catch (error) {
            console.error('SupabaseProvider: Error refreshing session on visibility change:', error)
          }
          lastCheck = now
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [supabase, session])

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    role: 'brand' | 'influencer',
    fullName: string
  ) => {
    try {
      console.log('SupabaseProvider: Signing up user with role:', role)
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName
          }
        }
      })

      if (authError) {
        console.error('SupabaseProvider: Auth error during signup:', authError)
        return { error: authError }
      }

      if (authData?.user) {
        // Create an entry in the custom users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            full_name: fullName,
            role: role
          })

        if (insertError) {
          console.error('SupabaseProvider: Error inserting user data:', insertError)
          return { error: insertError }
        }

        console.log('SupabaseProvider: User signed up successfully with role:', role)
        toast.success('Signed up successfully! Please check your email to confirm your account.')
        return { error: null }
      }

      return { error: new Error('Failed to create user') }
    } catch (error: any) {
      console.error('SupabaseProvider: Unexpected error during signup:', error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    isLoading,
    supabase,
    signUp
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}