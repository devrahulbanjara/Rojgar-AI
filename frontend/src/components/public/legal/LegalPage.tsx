import type { ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'

import { ChevronRightIcon } from '@/components/icons'

import { LegalToc, type LegalTocItem } from './LegalToc'

export type LegalRelated = { href: string; label: string }

/** Shared layout for every legal page: title, sticky contents, prose and related links. */
export function LegalPage({
  title,
  updated,
  toc = [],
  related = [],
  summary,
  children,
}: {
  title: string
  /** e.g. "Updated 17 October 2026" */
  updated: string
  toc?: LegalTocItem[]
  related?: LegalRelated[]
  /** The policy in a few plain lines, in a tinted box above it. */
  summary?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-background">
      <header className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 md:pt-16">
        <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight text-balance text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{updated}</p>
      </header>

      <div
        className={cn(
          'mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-20 sm:px-6',
          toc.length > 0 && 'lg:grid-cols-[240px_1fr] lg:gap-16',
        )}
      >
        {toc.length > 0 ? <LegalToc items={toc} /> : null}

        <div className="max-w-3xl min-w-0">
          {summary ? (
            <div className="mb-8 rounded-xl border border-primary/15 border-l-[3px] border-l-primary bg-primary/5 p-5 text-base leading-7 text-muted-foreground [&_strong]:font-semibold [&_strong]:text-primary">
              {summary}
            </div>
          ) : null}

          <div
            className={cn(
              'text-base leading-7 text-muted-foreground',
              '[&>section]:scroll-mt-24 [&>section+section]:mt-12',
              '[&_h2]:scroll-mt-24 [&_h2]:mb-5 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-3 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground',
              '[&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground',
              '[&_p]:mb-4 [&_p:last-child]:mb-0',
              '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
              '[&_li]:leading-7 [&_li::marker]:text-primary',
              '[&_strong]:font-semibold [&_strong]:text-foreground',
              '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-[3px] [&_a:hover]:opacity-75',
            )}
          >
            {children}
          </div>

          {related.length > 0 ? (
            <nav
              aria-label="Related policies"
              className="mt-12 flex flex-wrap gap-3 border-t border-border pt-6"
            >
              {related.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  )
}
