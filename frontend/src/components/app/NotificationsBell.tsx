'use client'

import { useState } from 'react'

import Link from 'next/link'

import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
} from '@/store/services/notificationsApi'

import { BellIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { NotificationList, NotificationListSkeleton } from './NotificationList'

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useGetNotificationsQuery(12, { pollingInterval: 60_000 })
  const [markAllRead] = useMarkAllNotificationsReadMutation()
  const notifications = data?.data ?? []
  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <BellIcon className="size-5" />
          {unread ? (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-card" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex h-11 items-center justify-between border-b px-4">
          <p className="text-sm font-medium">Notifications</p>
          {unread ? (
            <Button variant="link" size="xs" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <NotificationListSkeleton rows={3} />
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            <NotificationList items={notifications} onOpen={() => setOpen(false)} />
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Button asChild variant="link" size="xs" className="px-0">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              See all
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
