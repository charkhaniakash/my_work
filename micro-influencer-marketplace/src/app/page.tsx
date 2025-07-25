'use client'

import React from 'react'
import Link from 'next/link'
import { useVisibilityChange } from '@/lib/hooks/useVisibilityChange'
import { useAuth } from '@/lib/auth-context'
import { useSupabase } from '@/lib/providers/supabase-provider'

export default function Home() {
  // Use the visibility change hook to prevent reload on tab switch
  useVisibilityChange();
  const { user, isLoading } = useSupabase();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">
        Welcome to Micro-Influencer Marketplace
      </h1>
      <p className="text-lg text-gray-600 text-center max-w-2xl mb-8">
        Connect with the perfect micro-influencers to grow your brand or showcase your influence to amazing brands.
      </p>
      
      {!isLoading && (
        <div className="flex gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
} 