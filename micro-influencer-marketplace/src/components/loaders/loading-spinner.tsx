'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const variantClasses = {
  primary: 'border-indigo-600',
  secondary: 'border-gray-600',
  white: 'border-white'
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  className,
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn(
      'animate-spin rounded-full border-2 border-t-transparent',
      sizeClasses[size],
      variantClasses[variant],
      className
    )} />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          {spinner}
          {text && (
            <p className="text-sm text-gray-600 animate-pulse">{text}</p>
          )}
        </div>
      </div>
    )
  }

  if (text) {
    return (
      <div className="flex items-center justify-center space-x-3">
        {spinner}
        <span className="text-sm text-gray-600">{text}</span>
      </div>
    )
  }

  return spinner
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex justify-center items-center py-8">
      <LoadingSpinner size="md" text={text} />
    </div>
  )
}

export function ButtonLoader() {
  return <LoadingSpinner size="sm" variant="white" />
} 