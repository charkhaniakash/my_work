'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams ? searchParams.get('session_id') : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationWarning, setVerificationWarning] = useState<string | null>(null);

  useEffect(() => {
    // Verify the payment was successful and update the application status
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('Invalid session ID');
        setLoading(false);
        return;
      }

      try {
        // Call the simple-verify API endpoint that doesn't require auth
        const res = await fetch(`/api/payments/simple-verify?session_id=${sessionId}`);
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to verify payment');
        }
        
        const data = await res.json();
        console.log('Payment verification response:', data);
        
        // Handle case where payment was verified but application update failed
        if (data.success && !data.applicationUpdateStatus) {
          setVerificationWarning(
            `Payment processed successfully, but there was an issue updating the application status: ${data.applicationUpdateError || 'Unknown error'}`
          );
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        // Don't treat this as a fatal error, still show the success screen
        setVerificationWarning(`Note: ${error.message || 'Failed to verify payment. The payment may still have been processed.'}`);
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white p-8 rounded-lg shadow-md">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-green-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. The influencer has been notified and your campaign is now active!
            </p>
            
            {verificationWarning && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
                {verificationWarning}
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Return to Dashboard
              </Link>
              <Link
                href="/dashboard/transactions"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                View Payment History
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 