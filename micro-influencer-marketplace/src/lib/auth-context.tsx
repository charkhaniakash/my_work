'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: 'brand' | 'influencer') => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      console.log('Auth user:', data.user)

      // First get the user record
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', data.user.id)
        .single()

      console.log('User record:', userRecord, 'Error:', userError)
      if (!userRecord) {
        console.log('No user record found, ....g')
        router.push('/onboarding')
      } else {
        console.log('User record found, ....')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('SignIn Error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'brand' | 'influencer') => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })
      
      if (signUpError) throw signUpError
      if (!data.user) throw new Error('User creation failed')

      // Wait a bit for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to onboarding
      router.push('/onboarding')
    } catch (error) {
      console.error('SignUp Error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/auth/sign-in')
    } catch (error) {
      console.error('SignOut Error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 