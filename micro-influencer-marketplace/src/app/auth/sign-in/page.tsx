'use client'

import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { SignInForm } from '@/components/sign-in-form'

export default function SignInPage() {
  const router = useRouter()
  const { user } = useSupabase()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/sign-up" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
} 