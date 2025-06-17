'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/providers/supabase-provider'

export function SignUpForm() {
  const router = useRouter()
  const { signUp } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'brand' as 'brand' | 'influencer',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.role,
        formData.fullName
      )

      if (error) {
        setError(error.message)
      } else {
        // Redirect based on role
        router.push(formData.role === 'brand' ? '/dashboard/brand' : '/dashboard/influencer')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">I am a</label>
        <div className="mt-2 space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="brand"
              checked={formData.role === 'brand'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'brand' })}
              className="form-radio"
            />
            <span className="ml-2">Brand</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="influencer"
              checked={formData.role === 'influencer'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'influencer' })}
              className="form-radio"
            />
            <span className="ml-2">Influencer</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex cursor-pointer justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Signing up...' : 'Sign up'}
      </button>
    </form>
  )
} 