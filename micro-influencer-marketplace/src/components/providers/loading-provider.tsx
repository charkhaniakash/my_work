'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/loaders'

interface LoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  showPageLoader: () => void
  hidePageLoader: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPageLoading, setShowPageLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Show loading on route changes
  useEffect(() => {
    setShowPageLoading(true)
    const timer = setTimeout(() => {
      setShowPageLoading(false)
    }, 300) // Short delay to prevent flash for fast loads

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const showPageLoader = () => {
    setShowPageLoading(true)
  }

  const hidePageLoader = () => {
    setShowPageLoading(false)
  }

  const value = {
    isLoading,
    setLoading,
    showPageLoader,
    hidePageLoader
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {(isLoading || showPageLoading) && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-200">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 animate-pulse">
              {isLoading ? 'Processing...' : 'Loading page...'}
            </p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
} 