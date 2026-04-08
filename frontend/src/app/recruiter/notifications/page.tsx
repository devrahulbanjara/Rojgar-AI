'use client'

import NotificationsList from '@/components/common/NotificationsList'

export default function RecruiterNotificationsPage() {
  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h1 className="dash-page-header__title">Notifications</h1>
          <p className="dash-page-header__subtitle">
            Team, outreach, interview, and application updates for your workspace.
          </p>
        </div>
      </div>

      <NotificationsList emptyText="Your recruiter notifications will appear here." />
    </div>
  )
}
