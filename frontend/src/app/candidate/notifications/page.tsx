'use client'

import NotificationsList from '@/components/common/NotificationsList'

export default function CandidateNotificationsPage() {
  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h1 className="dash-page-header__title">Notifications</h1>
          <p className="dash-page-header__subtitle">
            Application and interview updates for your candidate account.
          </p>
        </div>
      </div>

      <NotificationsList emptyText="Your candidate notifications will appear here." />
    </div>
  )
}
