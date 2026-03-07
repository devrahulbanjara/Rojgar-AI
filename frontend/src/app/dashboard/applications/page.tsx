'use client'

import { useState } from 'react'

import { Search } from 'lucide-react'

const STATUS_STAGES = [
  { key: 'all', label: 'All Applications', count: 24 },
  { key: 'applied', label: 'Applied', count: 8 },
  { key: 'in_review', label: 'In Review', count: 5 },
  { key: 'shortlisted', label: 'Shortlisted', count: 4 },
  { key: 'interview', label: 'Interview', count: 4 },
  { key: 'offer', label: 'Offer', count: 1 },
  { key: 'rejected', label: 'Rejected', count: 2 },
]

const APPLICATIONS = [
  {
    id: 1,
    company: 'Stripe',
    role: 'Product Designer',
    location: 'Remote',
    type: 'Full Time',
    status: 'interview',
    statusLabel: 'Interview',
    statusVariant: 'success',
    applied: 'Feb 28, 2026',
    logo: 'S',
    logoColor: '#635BFF',
    salary: '$120k–$150k',
    timeline: [
      { stage: 'Applied', date: 'Feb 28', done: true },
      { stage: 'In Review', date: 'Mar 1', done: true },
      { stage: 'Shortlisted', date: 'Mar 1', done: true },
      { stage: 'Interview', date: 'Mar 4', done: false, current: true },
      { stage: 'Offer', date: '—', done: false },
    ],
    lastActivity: 'Interview scheduled for Mar 4',
  },
  {
    id: 2,
    company: 'Figma',
    role: 'UX Designer',
    location: 'San Francisco, CA',
    type: 'Full Time',
    status: 'in_review',
    statusLabel: 'In Review',
    statusVariant: 'warning',
    applied: 'Feb 27, 2026',
    logo: 'F',
    logoColor: '#F24E1E',
    salary: '$110k–$140k',
    timeline: [
      { stage: 'Applied', date: 'Feb 27', done: true },
      { stage: 'In Review', date: 'Mar 1', done: false, current: true },
      { stage: 'Shortlisted', date: '—', done: false },
      { stage: 'Interview', date: '—', done: false },
      { stage: 'Offer', date: '—', done: false },
    ],
    lastActivity: 'Application under review',
  },
  {
    id: 3,
    company: 'Linear',
    role: 'UI Engineer',
    location: 'New York, NY',
    type: 'Full Time',
    status: 'shortlisted',
    statusLabel: 'Shortlisted',
    statusVariant: 'primary',
    applied: 'Feb 25, 2026',
    logo: 'L',
    logoColor: '#5E6AD2',
    salary: '$130k–$160k',
    timeline: [
      { stage: 'Applied', date: 'Feb 25', done: true },
      { stage: 'In Review', date: 'Feb 27', done: true },
      { stage: 'Shortlisted', date: 'Mar 1', done: false, current: true },
      { stage: 'Interview', date: '—', done: false },
      { stage: 'Offer', date: '—', done: false },
    ],
    lastActivity: 'You have been shortlisted',
  },
  {
    id: 4,
    company: 'Vercel',
    role: 'Design Engineer',
    location: 'Remote',
    type: 'Full Time',
    status: 'applied',
    statusLabel: 'Applied',
    statusVariant: 'gray',
    applied: 'Feb 24, 2026',
    logo: 'V',
    logoColor: '#000000',
    salary: '$115k–$145k',
    timeline: [
      { stage: 'Applied', date: 'Feb 24', done: false, current: true },
      { stage: 'In Review', date: '—', done: false },
      { stage: 'Shortlisted', date: '—', done: false },
      { stage: 'Interview', date: '—', done: false },
      { stage: 'Offer', date: '—', done: false },
    ],
    lastActivity: 'Application submitted',
  },
  {
    id: 5,
    company: 'Notion',
    role: 'Product Designer',
    location: 'New York, NY',
    type: 'Full Time',
    status: 'rejected',
    statusLabel: 'Rejected',
    statusVariant: 'danger',
    applied: 'Feb 20, 2026',
    logo: 'N',
    logoColor: '#000000',
    salary: '$100k–$130k',
    timeline: [
      { stage: 'Applied', date: 'Feb 20', done: true },
      { stage: 'In Review', date: 'Feb 22', done: true },
      { stage: 'Shortlisted', date: '—', done: false },
      { stage: 'Interview', date: '—', done: false },
      { stage: 'Offer', date: '—', done: false },
    ],
    lastActivity: 'Application was not selected to proceed',
  },
  {
    id: 6,
    company: 'Loom',
    role: 'Senior Product Designer',
    location: 'San Francisco, CA',
    type: 'Full Time',
    status: 'offer',
    statusLabel: 'Offer',
    statusVariant: 'success',
    applied: 'Feb 10, 2026',
    logo: 'L',
    logoColor: '#625DF5',
    salary: '$140k–$170k',
    timeline: [
      { stage: 'Applied', date: 'Feb 10', done: true },
      { stage: 'In Review', date: 'Feb 12', done: true },
      { stage: 'Shortlisted', date: 'Feb 14', done: true },
      { stage: 'Interview', date: 'Feb 19', done: true },
      { stage: 'Offer', date: 'Feb 28', done: false, current: true },
    ],
    lastActivity: 'Offer letter received',
  },
  {
    id: 7,
    company: 'Dropbox',
    role: 'Senior UI Designer',
    location: 'Remote',
    type: 'Full Time',
    status: 'applied',
    statusLabel: 'Applied',
    statusVariant: 'gray',
    applied: 'Mar 1, 2026',
    logo: 'D',
    logoColor: '#0061FF',
    salary: '$120k–$150k',
    timeline: [
      { stage: 'Applied', date: 'Mar 1', done: false, current: true },
      { stage: 'In Review', date: '—', done: false },
      { stage: 'Shortlisted', date: '—', done: false },
      { stage: 'Interview', date: '—', done: false },
      { stage: 'Offer', date: '—', done: false },
    ],
    lastActivity: 'Application submitted',
  },
  {
    id: 8,
    company: 'Retool',
    role: 'UX Engineer',
    location: 'New York, NY',
    type: 'Full Time',
    status: 'interview',
    statusLabel: 'Interview',
    statusVariant: 'success',
    applied: 'Feb 15, 2026',
    logo: 'R',
    logoColor: '#EF4B4C',
    salary: '$110k–$140k',
    timeline: [
      { stage: 'Applied', date: 'Feb 15', done: true },
      { stage: 'In Review', date: 'Feb 17', done: true },
      { stage: 'Shortlisted', date: 'Feb 20', done: true },
      { stage: 'Interview', date: 'Mar 5', done: false, current: true },
      { stage: 'Offer', date: '—', done: false },
    ],
    lastActivity: '2nd round interview on Mar 5',
  },
]

const TYPE_FILTERS = ['All Types', 'Full Time', 'Part Time', 'Contract', 'Remote']

const statusVariantMap: Record<string, string> = {
  success: '#0cce6b',
  warning: '#f59e0b',
  primary: '#0070f3',
  gray: '#9ca3af',
  danger: '#ff4d4d',
}

export default function ApplicationsPage() {
  const [activeStage, setActiveStage] = useState('all')
  const [selectedType, setSelectedType] = useState('All Types')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApp, setSelectedApp] = useState<(typeof APPLICATIONS)[0] | null>(APPLICATIONS[0])

  const filtered = APPLICATIONS.filter((app) => {
    const matchStage = activeStage === 'all' || app.status === activeStage
    const matchType = selectedType === 'All Types' || app.type === selectedType
    const matchSearch =
      searchQuery === '' ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStage && matchType && matchSearch
  })

  return (
    <div className="dash-content container">
      {/* Page Header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Applications</h2>
          <p className="dash-page-header__subtitle">
            Track and manage all your job applications in one place.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className="page-header-hint">{APPLICATIONS.length} total applications</span>
        </div>
      </div>

      {/* Main layout: sidebar + list + detail */}
      <div className="apps-layout">
        {/* Left sidebar: stage filter */}
        <aside className="apps-layout__sidebar">
          <div className="apps-sidebar">
            <div className="apps-sidebar__title">Status</div>
            <div className="apps-sidebar__stages">
              {STATUS_STAGES.map((stage) => (
                <button
                  key={stage.key}
                  className={`apps-sidebar__stage${activeStage === stage.key ? ' apps-sidebar__stage--active' : ''}`}
                  onClick={() => setActiveStage(stage.key)}
                >
                  <span className="apps-sidebar__stage-label">{stage.label}</span>
                  <span className="apps-sidebar__stage-count">{stage.count}</span>
                </button>
              ))}
            </div>

            <div className="apps-sidebar__divider" />

            <div className="apps-sidebar__title">Job Type</div>
            <div className="apps-sidebar__types">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  className={`apps-sidebar__type-btn${selectedType === t ? ' apps-sidebar__type-btn--active' : ''}`}
                  onClick={() => setSelectedType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Application list */}
        <div className="apps-layout__list">
          {/* Search bar */}
          <div className="apps-search-row">
            <div className="apps-search">
              <Search size={15} aria-hidden="true" />
              <input
                className="apps-search__input"
                type="text"
                placeholder="Search company or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="apps-results-count">{filtered.length} results</span>
          </div>

          {/* Application cards */}
          <div className="apps-list">
            {filtered.length === 0 ? (
              <div className="apps-empty">
                <Search size={40} aria-hidden="true" />
                <p>No applications match your filters.</p>
              </div>
            ) : (
              filtered.map((app) => (
                <div
                  key={app.id}
                  className={`app-item${selectedApp?.id === app.id ? ' app-item--active' : ''}`}
                  onClick={() => setSelectedApp(app)}
                >
                  <div
                    className="app-item__logo"
                    style={
                      {
                        '--app-logo-bg': app.logoColor + '1A',
                        '--app-logo-color': app.logoColor,
                      } as React.CSSProperties
                    }
                  >
                    {app.logo}
                  </div>
                  <div className="app-item__body">
                    <div className="app-item__top">
                      <div className="app-item__role">{app.role}</div>
                      <span className={`badge badge--${app.statusVariant}`}>
                        <span
                          className="app-status-dot"
                          style={
                            {
                              '--dot-color':
                                statusVariantMap[app.statusVariant] || statusVariantMap.gray,
                            } as React.CSSProperties
                          }
                        />
                        {app.statusLabel}
                      </span>
                    </div>
                    <div className="app-item__company">
                      {app.company}
                      <span className="app-item__sep">·</span>
                      {app.location}
                    </div>
                    <div className="app-item__meta">
                      <span>{app.salary}</span>
                      <span className="app-item__sep">·</span>
                      <span>Applied {app.applied}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail / tracking panel */}
        <aside className="apps-layout__detail">
          {selectedApp ? (
            <div className="app-detail">
              <div className="app-detail__header">
                <div
                  className="app-detail__logo"
                  style={
                    {
                      '--app-logo-bg': selectedApp.logoColor + '1A',
                      '--app-logo-color': selectedApp.logoColor,
                    } as React.CSSProperties
                  }
                >
                  {selectedApp.logo}
                </div>
                <div className="app-detail__info">
                  <div className="app-detail__role">{selectedApp.role}</div>
                  <div className="app-detail__company">{selectedApp.company}</div>
                  <div className="app-detail__location">{selectedApp.location}</div>
                </div>
              </div>

              <div className="app-detail__section">
                <div className="app-detail__section-title">Application Status</div>
                <span className={`badge badge--${selectedApp.statusVariant}`}>
                  <span
                    className="app-status-dot"
                    style={
                      {
                        '--dot-color': statusVariantMap[selectedApp.statusVariant],
                      } as React.CSSProperties
                    }
                  />
                  {selectedApp.statusLabel}
                </span>
              </div>

              <div className="app-detail__section">
                <div className="app-detail__section-title">Timeline</div>
                <div className="app-timeline">
                  {selectedApp.timeline.map((step, i) => (
                    <div
                      key={i}
                      className={`app-timeline__step${step.done ? ' app-timeline__step--done' : ''}${step.current ? ' app-timeline__step--current' : ''}`}
                    >
                      <div className="app-timeline__marker">
                        <div className="app-timeline__dot" />
                        {i < selectedApp.timeline.length - 1 && (
                          <div className="app-timeline__line" />
                        )}
                      </div>
                      <div className="app-timeline__content">
                        <div className="app-timeline__stage">{step.stage}</div>
                        <div className="app-timeline__date">{step.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="app-detail__section">
                <div className="app-detail__section-title">Latest Activity</div>
                <p className="app-detail__activity">{selectedApp.lastActivity}</p>
              </div>

              <div className="app-detail__section">
                <div className="app-detail__section-title">Details</div>
                <div className="app-detail__facts">
                  <div className="app-detail__fact">
                    <span className="app-detail__fact-label">Applied</span>
                    <span className="app-detail__fact-value">{selectedApp.applied}</span>
                  </div>
                  <div className="app-detail__fact">
                    <span className="app-detail__fact-label">Job Type</span>
                    <span className="app-detail__fact-value">{selectedApp.type}</span>
                  </div>
                  <div className="app-detail__fact">
                    <span className="app-detail__fact-label">Salary</span>
                    <span className="app-detail__fact-value">{selectedApp.salary}</span>
                  </div>
                </div>
              </div>

              <div className="app-detail__actions">
                <button className="btn btn--ghost btn--sm">Withdraw</button>
                <button className="btn btn--primary btn--sm">View Job</button>
              </div>
            </div>
          ) : (
            <div className="app-detail-empty">
              <p>Select an application to view details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
