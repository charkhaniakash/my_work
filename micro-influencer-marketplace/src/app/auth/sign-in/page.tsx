import { SignIn } from "@clerk/nextjs";
import React from 'react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignIn
        afterSignInUrl="/dashboard"
        redirectUrl="/dashboard"
        signUpUrl="/auth/sign-up"
      />
    </div>
  );
} 