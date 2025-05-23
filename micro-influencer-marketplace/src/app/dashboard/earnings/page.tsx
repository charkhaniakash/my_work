'use client'

import React from 'react';
import EarningsTracker from '@/components/payments/EarningsTracker';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EarningsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Helper to check if user is an influencer
  const isInfluencer = (user: any) => {
    if (!user) return false;
    // Check both possible locations of role info
    return user.role === 'influencer' || user.user_metadata?.role === 'influencer';
  };
  
  // Log user details for debugging
  useEffect(() => {
    if (user) {
      console.log('User data in earnings page:', {
        id: user.id,
        role: user.role,
        metadata: user.user_metadata
      });
    }
  }, [user]);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/sign-in');
    } else if (!loading && user && !isInfluencer(user)) {
      // Redirect brands to transactions page instead
      router.push('/dashboard/transactions');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !isInfluencer(user)) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Earnings Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <EarningsTracker userId={user.id} />
      </div>
    </div>
  );
} 