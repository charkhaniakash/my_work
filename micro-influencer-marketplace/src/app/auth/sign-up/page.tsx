'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'react-hot-toast'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'brand' | 'influencer'>('brand')
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data?.user) {
        setVerificationSent(true)
        toast.success('Please check your email for verification link')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  if (verificationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="mt-2 text-gray-600">
              We've sent you a verification link. Please check your email and click the link to verify your account.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleSignUp}
                className="text-primary hover:underline"
                disabled={loading}
              >
                click here to resend
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create an account</h2>
          <p className="mt-2 text-gray-600">Choose your role to get started</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
            />
          </div>

          <div className="space-y-2">
            <Label>I am a</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as 'brand' | 'influencer')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="brand" id="brand" />
                <Label htmlFor="brand">Brand</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="influencer" id="influencer" />
                <Label htmlFor="influencer">Influencer</Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/auth/sign-in" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}