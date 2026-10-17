'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'

import { ChevronDownIcon } from '@/components/icons'

export type LegalTocItem = { id: string; label: string }

type TocListProps = { items: LegalTocItem[]; active: string; mobile?: boolean }

function linkClasses(isActive: boolean, mobile: boolean) {
  if (mobile) {
    return cn(
      'block py-1.5 text-sm transition-colors',
      isActive ? 'font-medium text-primary' : 'text-muted-foreground hover:text-primary',
    )
  }
  return cn(
    '-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors',
    isActive
      ? 'border-primary font-medium text-primary'
      : 'border-transparent text-muted-foreground hover:border-primary hover:text-primary',
  )
}

function TocList({ items, active, mobile = false }: TocListProps) {
  return (
    <ul
      className={cn(
        'flex flex-col',
        mobile ? 'border-t border-border pt-2' : 'border-l border-border',
      )}
    >
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`#${item.id}`}
            aria-current={active === item.id ? 'location' : undefined}
            className={linkClasses(active === item.id, mobile)}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Sticky "On this page" contents (a collapsible on phones) that tracks the section in view. */
export function LegalToc({ items }: { items: LegalTocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    )

    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [items])

  return (
    <>
      <details className="group rounded-xl border border-border bg-card px-4 py-3 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
          On this page
          <ChevronDownIcon
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-3">
          <TocList items={items} active={active} mobile />
        </div>
      </details>

      <nav aria-label="On this page" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <p className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          On this page
        </p>
        <TocList items={items} active={active} />
      </nav>
    </>
  )
}
