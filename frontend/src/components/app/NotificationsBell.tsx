'use client'

import Link from 'next/link'

import { ago } from '@/lib/dates'
import { cn } from '@/lib/utils'
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/services/notificationsApi'

import { BellIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function NotificationsBell() {
  const { data } = useGetNotificationsQuery(12, { pollingInterval: 60_000 })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()
  const notifications = data?.data ?? []
  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <BellIcon className="size-5" />
          {unread ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread ? (
            <Button variant="link" size="xs" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
          ) : null}
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing new.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href ?? '/recruiter'}
                  onClick={() => void markRead(n.id)}
                  className={cn(
                    'flex flex-col gap-0.5 px-4 py-2.5 hover:bg-accent',
                    !n.is_read && 'bg-primary/5',
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{n.title}</span>
                  {n.body && n.body !== n.title ? (
                    <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{ago(n.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
