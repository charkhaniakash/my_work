import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

/**
 * Hook to handle session expiration and automatic logout
 * @param redirectTo Where to redirect after logout (defaults to /auth/sign-in)
 */
export const useSessionExpiry = (redirectTo = '/auth/sign-in') => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Function to check if session is expired
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        console.log('No active session found, redirecting to login');
        router.push(redirectTo);
        return;
      }

      // Check if session is expired
      if (session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        if (expiresAt < now) {
          console.log('Session expired, logging out');
          await supabase.auth.signOut();
          router.push(redirectTo);
        } else {
          // Schedule next check just before expiration
          const timeToExpiry = expiresAt.getTime() - now.getTime();
          const checkBuffer = Math.min(60000, timeToExpiry / 2); // Check 1 minute before expiry or halfway if less
          
          setTimeout(checkSession, timeToExpiry - checkBuffer);
        }
      }
    };

    // Check session on initial load
    checkSession();

    // Add event listener for storage changes (in case of logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase.auth.token') {
        checkSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [supabase, router, redirectTo]);
}; 