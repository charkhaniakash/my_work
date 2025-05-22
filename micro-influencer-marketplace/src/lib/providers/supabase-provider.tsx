// lib/providers/supabase-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, Session } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

interface SupabaseContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  supabase: SupabaseClient
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
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('SupabaseProvider: Page became visible, refreshing session...')
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (!error && session) {
            setSession(session)
            setUser(session.user)
          }
        } catch (error) {
          console.error('SupabaseProvider: Error refreshing session on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [supabase])

  const value = {
    user,
    session,
    isLoading,
    supabase
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