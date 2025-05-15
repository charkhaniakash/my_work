'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignUp } from '@clerk/nextjs';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const redirectUrl = '/auth/role-selection';

  // If this page is accessed after signing up, the user needs to verify their email
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please check your email and click the verification link to continue
          </p>
        </div>

        <SignUp
          path="/auth/sign-up"
          routing="path"
          signInUrl="/auth/sign-in"
          redirectUrl={redirectUrl}
          appearance={{
            elements: {
              rootBox: "mx-auto w-full max-w-md",
              card: "rounded-lg shadow-md",
            },
          }}
        />
      </div>
    </div>
  );
} 