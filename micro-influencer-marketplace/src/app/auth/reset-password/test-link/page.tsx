'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestResetLink() {
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClientComponentClient();
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        setIsLoggedIn(true);
        
        // Redirect after a short delay to allow the message to be seen
        setTimeout(() => {
          router.replace('/dashboard');
        }, 3000);
      }
    };
    
    checkSession();
  }, [router]);
  
  // Create a simulated reset link with test parameters
  const baseUrl = typeof window !== 'undefined' ? 
    `${window.location.origin}/auth/reset-password` : 
    '/auth/reset-password';
  
  // Create fake tokens that will pass the validation check in our page
  const testParams = new URLSearchParams({
    type: 'recovery',
    access_token: 'test_access_token_' + Math.random().toString(36).substring(2),
    refresh_token: 'test_refresh_token_' + Math.random().toString(36).substring(2)
  });
  
  const testResetLink = `${baseUrl}?${testParams.toString()}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(testResetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        {isLoggedIn ? (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <h2 className="text-md font-semibold text-yellow-700 mb-2">Already Logged In</h2>
            <p className="text-sm text-yellow-600 mb-2">
              You are currently logged in. This page is only for testing the password reset flow when logged out.
            </p>
            <p className="text-sm text-yellow-600">
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Test Reset Link Generator</h1>
              <p className="mt-2 text-sm text-gray-600">
                Use this tool to test the password reset flow
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h2 className="text-md font-semibold text-blue-700 mb-2">For Testing Only</h2>
              <p className="text-sm text-blue-600 mb-4">
                This page generates a test link that simulates coming from a password reset email.
                In production, users would receive a real reset link via email.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Test Reset Link</h3>
              </div>
              <div className="p-3">
                <div className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded border border-gray-200">
                  {testResetLink}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              
              <Link
                href={testResetLink}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Open Link
              </Link>
            </div>
          </>
        )}
        
        <div className="text-center">
          <Link 
            href={isLoggedIn ? '/dashboard' : '/auth/sign-in'}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Back to Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
} 