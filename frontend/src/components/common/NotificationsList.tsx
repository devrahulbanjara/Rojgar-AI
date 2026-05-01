'use client'

import Link from 'next/link'

import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/services/notificationsApi'

function formatTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotificationsList({ emptyText }: { emptyText: string }) {
  const { data, isLoading, isError, error, isFetching, refetch } = useGetNotificationsQuery(50)
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllNotificationsReadMutation()
  const notifications = data?.data ?? []
  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__title">Notifications</div>
          <div className="dash-card__subtitle">
            {unreadCount} unread update{unreadCount === 1 ? '' : 's'}
          </div>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => void markAllRead()}
            disabled={isMarkingAllRead}
          >
            Mark all read
          </button>
        ) : null}
      </div>
      <div className="dash-card__body">
        {isLoading ? (
          <div className="dash-navbar__notifications-empty">Loading notifications...</div>
        ) : isError ? (
          <div className="dash-empty-state">
            <p>
              {error ? 'Notifications are unavailable right now.' : 'Unable to load notifications.'}
            </p>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => void refetch()}
            >
              {isFetching ? 'Retrying...' : 'Try again'}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="dash-navbar__notifications-empty">{emptyText}</div>
        ) : (
          <div className="activity-list activity-list--panel">
            {notifications.map((notification) => {
              const content = (
                <>
                  <div className="activity-item__dot" />
                  <div className="activity-item__body">
                    <p className="activity-item__text">
                      <strong>{notification.title}</strong>
                    </p>
                    {notification.body ? (
                      <p className="activity-item__text">{notification.body}</p>
                    ) : null}
                    <div className="activity-item__time">{formatTime(notification.created_at)}</div>
                  </div>
                </>
              )

              return notification.href ? (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className="activity-item activity-item--panel activity-item--link"
                  onClick={() => void markRead(notification.id)}
                >
                  {content}
                </Link>
              ) : (
                <div key={notification.id} className="activity-item activity-item--panel">
                  {content}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
