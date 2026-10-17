'use client'

import { type ReactNode, useId, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { InsightsData, InsightsJobReply, InsightsSource, InsightsStage } from './insightsApi'

export const SOURCE_LABEL: Record<InsightsSource, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  merojob: 'Merojob',
  viber: 'Viber',
  qr: 'QR poster',
  walk_in: 'Walk-in',
  phone: 'Phone call',
  referral: 'Referral',
  direct: 'Direct link',
  other: 'Other',
}

const STAGE_LABEL: Record<InsightsStage, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interviewed: 'Interviewed',
  offered: 'Offered',
  hired: 'Hired',
}

const NUMERAL_FONT = { fontFamily: 'var(--font-manrope)' }
const ROW_HEIGHT = 36
const COUNT_CONFIG = {
  count: { label: 'Applications', color: 'var(--primary)' },
} satisfies ChartConfig
const PEOPLE_CONFIG = { count: { label: 'People', color: 'var(--primary)' } } satisfies ChartConfig
const DAYS_CONFIG = { days: { label: 'Days', color: 'var(--ai-2)' } } satisfies ChartConfig

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Charts only animate when the viewer hasn't asked for reduced motion. */
function useAnimate(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

/** "2.5 days" · "1 day" · "5 hours" */
export function formatDays(days: number | null | undefined): string {
  if (days == null) return '—'
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24))
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }
  const rounded = Math.round(days * 10) / 10
  return `${rounded} day${rounded === 1 ? '' : 's'}`
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** A titled card holding one chart and the same numbers as a screen-reader table. */
export function ChartCard({
  title,
  summary,
  headline,
  table,
  children,
  className,
}: {
  title: string
  /** Read out for the chart picture; omit when the children are interactive. */
  summary?: string
  headline?: ReactNode
  table: { columns: string[]; rows: (string | number)[][] }
  children?: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={cn('flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5', className)}
    >
      <h2 id={id} className="font-heading text-base font-semibold text-foreground">
        {title}
      </h2>
      {headline}
      {summary ? (
        <div role="img" aria-label={summary}>
          {children}
        </div>
      ) : (
        children
      )}
      <div className="sr-only">
        <Table>
          <caption>{title}</caption>
          <TableHeader>
            <TableRow>
              {table.columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row) => (
              <TableRow key={String(row[0])}>
                {row.map((cell, i) => (
                  <TableCell key={i}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

function HorizontalBars({
  data,
  config,
  dataKey,
  labelWidth,
  valueLabel,
  tooltipLabel,
}: {
  data: { label: string; full?: string; [key: string]: string | number | undefined }[]
  config: ChartConfig
  dataKey: string
  labelWidth: number
  valueLabel: (value: number) => string
  tooltipLabel?: (value: number) => string
}) {
  const animate = useAnimate()
  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: data.length * ROW_HEIGHT + 8 }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56, top: 0, bottom: 0 }}>
        <XAxis type="number" dataKey={dataKey} hide />
        <YAxis
          type="category"
          dataKey="label"
          width={labelWidth}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)' }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.full ?? payload?.[0]?.payload?.label
              }
              formatter={(value) => (
                <span className="font-heading font-medium text-foreground tabular-nums">
                  {(tooltipLabel ?? valueLabel)(Number(value))}
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey={dataKey}
          fill={`var(--color-${dataKey})`}
          radius={[0, 4, 4, 0]}
          barSize={20}
          isAnimationActive={animate}
          animationDuration={400}
        >
          <LabelList
            dataKey={dataKey}
            position="right"
            offset={8}
            className="fill-foreground"
            style={NUMERAL_FONT}
            formatter={(value: unknown) => valueLabel(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export function SourcesChart({ sources }: { sources: InsightsData['sources'] }) {
  const data = sources
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((row) => ({ label: SOURCE_LABEL[row.source], count: row.count }))
  const total = data.reduce((sum, row) => sum + row.count, 0)
  const share = (count: number) => (total ? Math.round((count / total) * 100) : 0)
  return (
    <ChartCard
      title="Where applicants come from"
      summary={data.map((row) => `${row.label} ${row.count}`).join(', ')}
      table={{
        columns: ['Source', 'Applications', 'Share'],
        rows: data.map((row) => [row.label, row.count, `${share(row.count)}%`]),
      }}
    >
      <HorizontalBars
        data={data}
        config={COUNT_CONFIG}
        dataKey="count"
        labelWidth={88}
        valueLabel={(value) => value.toLocaleString()}
        tooltipLabel={(value) => `${value.toLocaleString()} · ${share(value)}% of applicants`}
      />
    </ChartCard>
  )
}

export function WeeklyChart({
  weekly,
  className,
}: {
  weekly: InsightsData['weekly']
  className?: string
}) {
  const animate = useAnimate()
  const id = useId().replace(/:/g, '')
  const data = weekly.map((row) => ({
    label: format(parseISO(row.week_start), 'd MMM'),
    week: format(parseISO(row.week_start), 'd MMM yyyy'),
    count: row.count,
  }))
  const busiest = data.reduce((best, row) => (row.count > best.count ? row : best), data[0])
  return (
    <ChartCard
      title="Applications per week"
      className={className}
      summary={`${data.length} weeks${busiest ? `, busiest week of ${busiest.week} with ${busiest.count}` : ''}`}
      table={{
        columns: ['Week of', 'Applications'],
        rows: data.map((row) => [row.week, row.count]),
      }}
    >
      <ChartContainer config={COUNT_CONFIG} className="aspect-auto h-56 w-full">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={NUMERAL_FONT}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--border)' }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(_, payload) => `Week of ${payload?.[0]?.payload?.week ?? ''}`}
              />
            }
          />
          <Area
            dataKey="count"
            type="monotone"
            stroke="var(--color-count)"
            strokeWidth={2}
            fill={`url(#fill-${id})`}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            isAnimationActive={animate}
            animationDuration={400}
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function ProgressChart({ progress }: { progress: InsightsData['progress'] }) {
  const applied = progress.find((row) => row.stage === 'applied')?.count ?? 0
  const pct = (count: number) => (applied ? Math.round((count / applied) * 100) : 0)
  const data = progress.map((row) => ({ label: STAGE_LABEL[row.stage], count: row.count }))
  return (
    <ChartCard
      title="Hiring progress"
      summary={data.map((row) => `${row.label} ${row.count}`).join(', ')}
      table={{
        columns: ['Stage reached', 'People', 'Of everyone who applied'],
        rows: data.map((row) => [row.label, row.count, `${pct(row.count)}%`]),
      }}
    >
      <HorizontalBars
        data={data}
        config={PEOPLE_CONFIG}
        dataKey="count"
        labelWidth={92}
        valueLabel={(value) => value.toLocaleString()}
        tooltipLabel={(value) => `${value.toLocaleString()} · ${pct(value)}% of applicants`}
      />
    </ChartCard>
  )
}

export function ReplyChart({ replies }: { replies: InsightsJobReply[] }) {
  const data = replies
    .filter((row) => row.median_days != null)
    .slice(0, 8)
    .map((row) => ({
      label: truncate(row.title, 18),
      full: row.title,
      days: row.median_days ?? 0,
    }))
  if (data.length < 2) return null
  return (
    <div
      role="img"
      aria-label={data.map((row) => `${row.full} ${formatDays(row.days)}`).join(', ')}
    >
      <HorizontalBars
        data={data}
        config={DAYS_CONFIG}
        dataKey="days"
        labelWidth={132}
        valueLabel={(value) => formatDays(value)}
      />
    </div>
  )
}
