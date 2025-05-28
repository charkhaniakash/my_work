import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface UseAsyncActionOptions {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useAsyncAction<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  options: UseAsyncActionOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await asyncFunction(...args)
        
        if (options.successMessage) {
          toast.success(options.successMessage)
        }
        
        if (options.onSuccess) {
          options.onSuccess(result)
        }
        
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred')
        setError(error)
        
        if (options.errorMessage) {
          toast.error(options.errorMessage)
        } else {
          toast.error(error.message)
        }
        
        if (options.onError) {
          options.onError(error)
        }
        
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [asyncFunction, options]
  )

  return {
    execute,
    isLoading,
    error,
    reset: () => {
      setError(null)
      setIsLoading(false)
    }
  }
} 