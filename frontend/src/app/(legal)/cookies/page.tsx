import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { LegalPage } from '@/components/public/legal/LegalPage'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = {
  title: 'Cookies',
  description: `${BRAND.name} uses only the cookies that keep you signed in and remember your language.`,
}

const COOKIES = [
  { name: 'refresh_token', use: 'Keeps you signed in', lasts: '7 days' },
  { name: 'auth_present', use: 'Tells the page you are signed in', lasts: '30 days' },
  { name: 'oauth_state', use: 'Protects Google sign-in', lasts: '10 minutes' },
  { name: 'lang', use: 'Remembers English or Nepali', lasts: '1 year' },
  { name: 'sidebar_state', use: 'Remembers if the side menu is open', lasts: '7 days' },
]

const RELATED = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
]

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies" updated="Updated 17 October 2026" related={RELATED}>
      <section id="cookies">
        <p>
          We use only the cookies {BRAND.name} needs to work. There are no advertising, tracking or
          analytics cookies, and no cookies from other companies.
        </p>
        <Table className="mb-6">
          <TableHeader>
            <TableRow>
              <TableHead>Cookie</TableHead>
              <TableHead>What it does</TableHead>
              <TableHead>Lasts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COOKIES.map((cookie) => (
              <TableRow key={cookie.name}>
                <TableCell className="font-mono text-xs">{cookie.name}</TableCell>
                <TableCell className="whitespace-normal">{cookie.use}</TableCell>
                <TableCell>{cookie.lasts}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p>
          Your browser also remembers a few settings, like whether you closed the cookie notice and
          how you sorted a list. They never leave your device.
        </p>
        <p>
          You can delete cookies in your browser settings at any time. If you do, you will be signed
          out.
        </p>
        <p>
          Questions: <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
        </p>
      </section>
    </LegalPage>
  )
}
