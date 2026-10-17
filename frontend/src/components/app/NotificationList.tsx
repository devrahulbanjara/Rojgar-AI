'use client'

import Link from 'next/link'

import { ago } from '@/lib/dates'
import { cn } from '@/lib/utils'
import {
  type NotificationItem,
  useMarkNotificationReadMutation,
} from '@/store/services/notificationsApi'
import { isToday } from 'date-fns'

import { Skeleton } from '@/components/ui/skeleton'

function Row({ item, onOpen }: { item: NotificationItem; onOpen?: () => void }) {
  const [markRead] = useMarkNotificationReadMutation()
  const body = item.body && item.body !== item.title ? item.body : null
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.is_read ? '' : 'bg-primary')}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn('text-sm text-foreground', item.is_read ? 'font-normal' : 'font-medium')}
        >
          {item.title}
        </span>
        {body ? <span className="line-clamp-2 text-sm text-muted-foreground">{body}</span> : null}
        <span className="text-xs text-muted-foreground">{ago(item.created_at)}</span>
      </span>
      {item.is_read ? null : <span className="sr-only">Unread</span>}
    </>
  )
  const open = () => {
    if (!item.is_read) void markRead(item.id)
    onOpen?.()
  }
  const className = 'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent'
  return (
    <li>
      {item.href ? (
        <Link href={item.href} onClick={open} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  )
}

function Group({
  label,
  items,
  onOpen,
}: {
  label: string
  items: NotificationItem[]
  onOpen?: () => void
}) {
  if (!items.length) return null
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="divide-y">
        {items.map((item) => (
          <Row key={item.id} item={item} onOpen={onOpen} />
        ))}
      </ul>
    </div>
  )
}

/** Notifications grouped Today / Earlier, unread dot on the left. Used by the page and the bell. */
export function NotificationList({
  items,
  onOpen,
}: {
  items: NotificationItem[]
  /** Called after a row is opened (the bell closes its popover). */
  onOpen?: () => void
}) {
  const today = items.filter((n) => isToday(new Date(n.created_at)))
  const earlier = items.filter((n) => !isToday(new Date(n.created_at)))
  return (
    <div className="flex flex-col pb-1">
      <Group label="Today" items={today} onOpen={onOpen} />
      <Group label="Earlier" items={earlier} onOpen={onOpen} />
    </div>
  )
}

export function NotificationListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="mt-1.5 size-2 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
