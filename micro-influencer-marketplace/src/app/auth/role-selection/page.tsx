'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Building2, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function RoleSelection() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)

  // Debug logging to see user's state
  useEffect(() => {
    if (isLoaded) {
      console.log('Role selection - User loaded:', {
        userId: user?.id,
        hasMetadata: !!user?.publicMetadata,
        existingRole: user?.publicMetadata?.role
      });
    }
  }, [isLoaded, user]);

  const handleRoleSelect = async (role: 'brand' | 'influencer') => {
    try {
      if (!user) {
        toast.error('No user found. Please sign in again.')
        router.push('/auth/sign-in')
        return
      }

      setIsUpdating(true)
      
      console.log(`Selecting role: ${role}`);
      
      // Send request to role-selection API endpoint
      const response = await fetch('/api/role-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      })

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Role selection API error:', data);
        throw new Error(data.message || 'Failed to set role')
      }

      console.log('Role updated successfully:', data);

      // Redirect to the onboarding page
      toast.success('Role selected! Now complete your profile.')
      router.push('/onboarding')
    } catch (error) {
      console.error('Error setting role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to set role. Please try again.')
      setIsUpdating(false)
    }
  }

  // If user is already loaded and has a role, redirect to onboarding
  useEffect(() => {
    if (isLoaded && user && user.publicMetadata?.role) {
      console.log('User already has role, redirecting to onboarding');
      router.push('/onboarding')
    }
  }, [isLoaded, user, router])

  if (!isLoaded || isUpdating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Select your role
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose how you'll use our platform
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleRoleSelect('brand')}
            className="relative w-full flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 focus:outline-none"
            disabled={isUpdating}
          >
            <div className="flex-shrink-0 rounded-full bg-indigo-50 p-3">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-sm font-medium text-gray-900">I'm a Brand</span>
              <p className="text-sm text-gray-500">
                I want to work with influencers to promote my products or services
              </p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('influencer')}
            className="relative w-full flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 focus:outline-none"
            disabled={isUpdating}
          >
            <div className="flex-shrink-0 rounded-full bg-indigo-50 p-3">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-sm font-medium text-gray-900">I'm an Influencer</span>
              <p className="text-sm text-gray-500">
                I want to collaborate with brands and create content
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
} 