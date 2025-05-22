import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { SupabaseProvider } from '@/lib/providers/supabase-provider'
import VisibilityProvider from '@/components/VisibilityProvider'
// import MessageNotification from '@/components/MessageNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Micro Influencer Marketplace',
  description: 'Connect brands with micro influencers',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <VisibilityProvider>
            <main className="min-h-screen bg-background">
              {children}
            </main>
            <Toaster />
            {/* <MessageNotification /> */}
          </VisibilityProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
