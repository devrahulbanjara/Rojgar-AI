'use client'

import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
} from '@/store/services/notificationsApi'

import { PageContainer } from '@/components/app/AppShell'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { NotificationList, NotificationListSkeleton } from '@/components/app/NotificationList'
import { PageHeader } from '@/components/app/PageHeader'
import { Button } from '@/components/ui/button'

export function NotificationsView() {
  const { data, isLoading, isError, isFetching, refetch } = useGetNotificationsQuery(50)
  const [markAllRead, markState] = useMarkAllNotificationsReadMutation()
  const items = data?.data ?? []
  const unread = items.some((n) => !n.is_read)

  return (
    <PageContainer narrow>
      <PageHeader
        title="Notifications"
        primaryAction={
          unread ? (
            <Button
              variant="outline"
              loading={markState.isLoading}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </Button>
          ) : null
        }
      />
      {isLoading ? (
        <div className="rounded-xl border bg-card">
          <NotificationListSkeleton rows={6} />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load notifications.
        </ErrorState>
      ) : items.length === 0 ? (
        <EmptyState>You&apos;re all caught up.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <NotificationList items={items} />
        </div>
      )}
    </PageContainer>
  )
}
