import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/nextjs'
import React from 'react'
import { AuthProvider } from '@/lib/auth-context'
import SupabaseProvider from '@/lib/providers/supabase-provider'
// import MessageNotification from '@/components/MessageNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Micro-Influencer Marketplace',
  description: 'Connect brands with micro-influencers for authentic partnerships',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          <SupabaseProvider>
            <AuthProvider>
              <main className="min-h-screen bg-background">
                {children}
              </main>
              <Toaster />
              {/* <MessageNotification /> */}
            </AuthProvider>
          </SupabaseProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
