'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'

type AuthContextType = {
  user: any | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(true)
  const { signOut: clerkSignOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded) {
      setLoading(false)
    }
  }, [isLoaded])

  const signOut = async () => {
    try {
      await clerkSignOut()
      router.push('/auth/sign-in')
    } catch (error) {
      console.error('SignOut Error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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