'use client'

import Link from 'next/link'

import type { ActivityEvent } from '@/store/services/activityApi'

type ActivityFeedCardProps = {
  title: string
  subtitle: string
  items: ActivityEvent[]
  emptyText: string
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ActivityFeedCard({
  title,
  subtitle,
  items,
  emptyText,
}: ActivityFeedCardProps) {
  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__title">{title}</div>
          <div className="dash-card__subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="dash-card__body">
        {items.length === 0 ? (
          <div className="dash-navbar__notifications-empty">{emptyText}</div>
        ) : (
          <div className="activity-list activity-list--panel">
            {items.map((item) => {
              const content = (
                <>
                  <div className="activity-item__dot" />
                  <div className="activity-item__body">
                    <p className="activity-item__text">
                      <strong>{item.title}</strong>
                    </p>
                    {item.description ? (
                      <p className="activity-item__text">{item.description}</p>
                    ) : null}
                    <div className="activity-item__time">{formatTime(item.created_at)}</div>
                  </div>
                </>
              )

              return item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className="activity-item activity-item--panel activity-item--link"
                >
                  {content}
                </Link>
              ) : (
                <div key={item.id} className="activity-item activity-item--panel">
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
