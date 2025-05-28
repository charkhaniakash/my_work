'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LoadingSpinner } from './loading-spinner'

export function PageTransition() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100) // Short delay to prevent flash for fast loads

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-200">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-600 animate-pulse">Loading page...</p>
      </div>
    </div>
  )
}

export function NavigationLoader() {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
      <div className="h-full bg-indigo-600 animate-pulse" style={{
        animation: 'loading-bar 0.5s ease-in-out'
      }} />
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0% }
          50% { width: 70% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  )
} 