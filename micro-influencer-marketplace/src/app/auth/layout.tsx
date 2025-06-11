'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Effect to check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      // If there's an active session, redirect to dashboard
      if (data?.session) {
        router.replace('/dashboard');
      }
    };
    
    checkSession();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      {children}
    </div>
  );
} 