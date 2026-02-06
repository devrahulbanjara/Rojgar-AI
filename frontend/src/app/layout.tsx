import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import React from 'react'
import './globals.css'
import { Providers } from '../components/Providers'
import { Toaster } from 'sonner'

// =============================================================================
// PREMIUM TYPOGRAPHY SYSTEM - Dual-Font AI-Enterprise Aesthetic
// =============================================================================

// Global UI & Body - The gold standard for SaaS
// Handles high-density data (recruiter tables) perfectly, crisp in light/dark
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

// Headings & Branding - Premium geometric sans-serif
// Modern, energetic personality for landing pages and job seeker views
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

// Agentic/AI Data - For Score Breakdowns, AI Logs, Reasoning sections
// Signals to user: "This specific data was computed by an agent"
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ConvexHire',
  description:
    'Transform your hiring process with AI-powered job matching, real-time application tracking, and automated scheduling.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
