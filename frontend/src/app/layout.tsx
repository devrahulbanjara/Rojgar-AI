import type { Metadata } from 'next'
import { EB_Garamond, Geist_Mono, Manrope } from 'next/font/google'

import '@/app/globals.css'
import LenisProvider from '@/providers/LenisProvider'
import StoreProvider from '@/providers/StoreProvider'

import BackendConnectionBanner from '@/components/common/BackendConnectionBanner'
// ToasterNoSSR is a Client Component that uses dynamic(ssr:false) internally,
// which is the correct pattern for Server Component layouts.
import ToasterNoSSR from '@/components/common/ToasterNoSSR'
import MainLayout from '@/components/layout/MainLayout'

import '@/styles/main.scss'

// One typeface for the whole app; styles/main.scss maps the legacy
// --font-heading / --font-body variables onto it.
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  variable: '--font-resume',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  fallback: ['Garamond', 'Times New Roman', 'serif'],
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ConvexHire',
  description: 'ConvexHire is a job board for software engineers built with Next.js and Convex.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${ebGaramond.variable} ${geistMono.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <StoreProvider>
          <BackendConnectionBanner />
          <LenisProvider>
            <MainLayout>{children}</MainLayout>
          </LenisProvider>
          <ToasterNoSSR />
        </StoreProvider>
      </body>
    </html>
  )
}
