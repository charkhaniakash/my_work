'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

type SupabaseContext = {
  supabase: SupabaseClient<Database>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [supabase] = useState(() => createClientComponentClient<Database>())
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
} 