import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const toneFor = (pct: number) =>
  pct >= 70
    ? { text: 'text-success', bar: 'bg-success' }
    : pct >= 40
      ? { text: 'text-warning', bar: 'bg-warning' }
      : { text: 'text-danger', bar: 'bg-danger' }

/** "8/10 ▬ 80%" — fraction, thin bar, percent, coloured by threshold. */
export function FitMeter({ score, outOf = 100 }: { score: number | null; outOf?: number }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>
  const pct = Math.round((score / outOf) * 100)
  const tone = toneFor(pct)
  return (
    <span className="inline-flex items-center gap-2 text-xs tabular-nums">
      <span className="font-medium text-foreground">{Math.round(pct / 10)}/10</span>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className={cn('block h-full rounded-full', tone.bar)} style={{ width: `${pct}%` }} />
      </span>
      <span className={tone.text}>{pct}%</span>
    </span>
  )
}

/** One bordered row of 3–4 numbers that drive action. Label small and muted above value. */
export function StatStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 divide-x divide-y rounded-xl border bg-card sm:grid-cols-4 sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1 px-4 py-3">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="text-xl font-light tabular-nums text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Side-card key facts: icon + label + value. */
export function KeyFacts({
  items,
}: {
  items: { icon: ReactNode; label: string; value: ReactNode }[]
}) {
  return (
    <dl className="grid grid-cols-1 gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{item.icon}</span>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-medium text-foreground">{item.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
