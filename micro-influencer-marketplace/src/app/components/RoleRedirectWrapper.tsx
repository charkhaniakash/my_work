'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function RoleRedirectWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && user && !user.publicMetadata?.role && pathname !== '/select-role') {
      router.push('/select-role')
    }
  }, [isLoaded, user, router, pathname])

  return <>{children}</>
} 