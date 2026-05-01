'use client'

import Link from 'next/link'

import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/services/notificationsApi'

import styles from '../page.module.scss'

function formatTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotificationsCard() {
  const { data, isLoading, isError, isFetching, refetch } = useGetNotificationsQuery(50)
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllNotificationsReadMutation()
  const notifications = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <section className={styles.card} aria-label="Notifications">
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Activity</div>
          <h2 className={styles.cardTitle}>Notifications</h2>
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
      <p className={styles.cardCopy}>
        {unreadCount} unread update{unreadCount === 1 ? '' : 's'}.
      </p>

      {isLoading ? (
        <div className={styles.empty}>Loading notifications…</div>
      ) : isError ? (
        <div className={styles.errorState}>
          <p>Notifications are unavailable right now.</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => void refetch()}
          >
            {isFetching ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>Activity for your workspace will show up here.</div>
      ) : (
        <div className={styles.notifList}>
          {notifications.map((n) => {
            const content = (
              <>
                <span
                  className={`${styles.notifDot} ${n.is_read ? styles.notifDotMuted : ''}`}
                  aria-hidden="true"
                />
                <div className={styles.notifBody}>
                  <p className={styles.notifTitle}>{n.title}</p>
                  {n.body && <p className={styles.notifText}>{n.body}</p>}
                  <span className={styles.notifTime}>{formatTime(n.created_at)}</span>
                </div>
              </>
            )

            return n.href ? (
              <Link
                key={n.id}
                href={n.href}
                className={styles.notifItem}
                onClick={() => void markRead(n.id)}
              >
                {content}
              </Link>
            ) : (
              <div key={n.id} className={styles.notifItem}>
                {content}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
