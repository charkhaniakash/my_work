'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function SelectRole() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)

  const handleSelect = async (role: 'brand' | 'influencer') => {
    if (!user) return;
    setLoading(true);
    try {
      // Update Supabase user table
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user.id);
      if (error) throw error;
  
      // Call Clerk metadata update API
      const res = await fetch('/api/set-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role }),
      })
      
  
      if (!res.ok) throw new Error('Failed to update Clerk metadata');
  
      toast.success('Role selected!');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Failed to set role');
    } finally {
      setLoading(false);
    }
  };
  

  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Select Your Role</h2>
        <p className="mb-8 text-gray-500">Are you a brand or an influencer?</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelect('brand')}
            disabled={loading}
            className="w-full py-3 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            I am a Brand
          </button>
          <button
            onClick={() => handleSelect('influencer')}
            disabled={loading}
            className="w-full py-3 rounded-md bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-50"
          >
            I am an Influencer
          </button>
        </div>
      </div>
    </div>
  )
} 