import type { Metadata } from 'next'
import { DM_Sans, EB_Garamond, Geist_Mono, Manrope, Noto_Sans_Devanagari } from 'next/font/google'

import '@/app/globals.css'
import { BRAND } from '@/lib/brand'
import LenisProvider from '@/providers/LenisProvider'
import StoreProvider from '@/providers/StoreProvider'

import { OfflineBar } from '@/components/app/OfflineBar'
import { SiteLayout } from '@/components/app/SiteLayout'
// ToasterNoSSR is a Client Component that uses dynamic(ssr:false) internally,
// which is the correct pattern for Server Component layouts.
import ToasterNoSSR from '@/components/common/ToasterNoSSR'

import '@/styles/main.scss'

// Two typefaces (see docs/DESIGN_SYSTEM.md → Typography): Manrope for headings
// and large numerals, DM Sans for everything else. styles/main.scss maps the
// legacy --font-heading / --font-body variables onto these.
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  // Variable font: covers the 400–600 weights we use, plus optical size.
  axes: ['opsz'],
  display: 'swap',
})

// Nepali text: DM Sans and Manrope have no Devanagari glyphs, so both stacks
// fall back to Noto Sans Devanagari for those characters only.
const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
})

const fontStacks = {
  '--font-dm-sans': `${dmSans.style.fontFamily}, ${devanagari.style.fontFamily}`,
  '--font-manrope': `${manrope.style.fontFamily}, ${devanagari.style.fontFamily}`,
} as React.CSSProperties

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
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmSans.variable} ${ebGaramond.variable} ${geistMono.variable}`}
      style={fontStacks}
    >
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <StoreProvider>
          <OfflineBar />
          <LenisProvider>
            <SiteLayout>{children}</SiteLayout>
          </LenisProvider>
          <ToasterNoSSR />
        </StoreProvider>
      </body>
    </html>
  )
}
