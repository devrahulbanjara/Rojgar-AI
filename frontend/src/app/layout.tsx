import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Manrope } from 'next/font/google'
import React from 'react'
import './globals.css'
import { Providers } from '../components/Providers'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ConvexHire',
  description: 'Make hiring understandable, efficient, and fair with ConvexHire. AI-powered recruitment platform that treats hiring as a reasoning problem, not keyword filtering.',
  keywords: ['recruitment', 'hiring', 'AI', 'ATS', 'applicant tracking', 'HR technology', 'semantic screening'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/logo-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'ConvexHire - AI-Powered Recruitment Operations Platform',
    description: 'Make hiring understandable, efficient, and fair with ConvexHire.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} font-manrope antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-right" richColors theme="system" />
        </Providers>
      </body>
    </html>
  )
}
