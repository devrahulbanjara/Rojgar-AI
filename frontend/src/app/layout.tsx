import type { Metadata } from 'next'
import { DM_Sans, Manrope, Noto_Sans_Devanagari } from 'next/font/google'

import '@/app/globals.css'
import { BRAND } from '@/lib/brand'
import { LocaleProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'
import LenisProvider from '@/providers/LenisProvider'
import StoreProvider from '@/providers/StoreProvider'

import { OfflineBar } from '@/components/app/OfflineBar'
import { SiteLayout } from '@/components/app/SiteLayout'
// ToasterNoSSR is a Client Component that uses dynamic(ssr:false) internally,
// which is the correct pattern for Server Component layouts.
import ToasterNoSSR from '@/components/common/ToasterNoSSR'

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

// Nepali text: DM Sans and Manrope have no Devanagari, so the browser falls back
// to this per glyph (it is second in both stacks in globals.css). Not preloaded:
// unicode-range means it only downloads on pages that show Devanagari.
const devanagari = Noto_Sans_Devanagari({
  variable: '--font-devanagari',
  subsets: ['devanagari'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`${manrope.variable} ${dmSans.variable} ${devanagari.variable}`}>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <LocaleProvider locale={locale}>
          <StoreProvider>
            <OfflineBar />
            <LenisProvider>
              <SiteLayout>{children}</SiteLayout>
            </LenisProvider>
            <ToasterNoSSR />
          </StoreProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
