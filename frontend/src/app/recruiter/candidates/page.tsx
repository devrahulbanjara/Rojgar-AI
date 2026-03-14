import { Search, Users } from 'lucide-react'

const candidates = [
  {
    name: 'Alex Chen',
    role: 'UI/UX Designer',
    job: 'Product Designer',
    score: 94,
    status: 'Shortlisted',
    stage: 'Interview',
    initials: 'AC',
    color: '#0070f3',
    skills: ['Figma', 'Prototyping', 'UI Design'],
    applied: '2 days ago',
  },
  {
    name: 'Maria Santos',
    role: 'Product Designer',
    job: 'Visual Designer',
    score: 91,
    status: 'Shortlisted',
    stage: 'Technical',
    initials: 'MS',
    color: '#7928ca',
    skills: ['Design Thinking', 'Research', 'Figma'],
    applied: '3 days ago',
  },
  {
    name: 'James Park',
    role: 'UX Researcher',
    job: 'Senior Interaction',
    score: 88,
    status: 'In Review',
    stage: 'Screening',
    initials: 'JP',
    color: '#0cce6b',
    skills: ['User Testing', 'Miro', 'Analytics'],
    applied: '1 day ago',
  },
  {
    name: 'Lily Wang',
    role: 'Visual Designer',
    job: 'Visual Designer',
    score: 85,
    status: 'Applied',
    stage: 'Applied',
    initials: 'LW',
    color: '#f59e0b',
    skills: ['Illustration', 'After Effects', 'Blender'],
    applied: '4 hours ago',
  },
  {
    name: 'Carlos Rivera',
    role: 'Motion Designer',
    job: 'Visual Designer',
    score: 82,
    status: 'Applied',
    stage: 'Applied',
    initials: 'CR',
    color: '#ff4d4d',
    skills: ['After Effects', 'Cinema 4D', 'Lottie'],
    applied: '6 hours ago',
  },
  {
    name: 'Emma Larsson',
    role: 'UX Designer',
    job: 'Product Designer',
    score: 79,
    status: 'In Review',
    stage: 'Screening',
    initials: 'EL',
    color: '#5E6AD2',
    skills: ['Figma', 'Wireframing', 'UX Research'],
    applied: '1 day ago',
  },
  {
    name: 'David Kim',
    role: 'UI Designer',
    job: 'Visual Designer',
    score: 76,
    status: 'Rejected',
    stage: 'Rejected',
    initials: 'DK',
    color: '#9ca3af',
    skills: ['Sketch', 'InVision'],
    applied: '5 days ago',
  },
  {
    name: 'Sofia Greco',
    role: 'Product Designer',
    job: 'Senior Interaction',
    score: 88,
    status: 'Shortlisted',
    stage: 'Interview',
    initials: 'SG',
    color: '#0cce6b',
    skills: ['UX Design', 'Figma', 'Prototyping'],
    applied: '2 days ago',
  },
]

const stageOrder: Record<string, number> = {
  Applied: 1,
  Screening: 2,
  Technical: 3,
  Interview: 4,
  Offer: 5,
}

export default function CompanyCandidatesPage() {
  return (
    <>
      <div className="dash-content container container--app-shell">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Candidate Pipeline</h2>
            <p className="dash-page-header__subtitle">
              Track and manage all applicants across your job postings
            </p>
          </div>
        </div>

        {/* Pipeline summary */}
        <div className="dash-stats dash-stats--5col">
          {[
            { label: 'Applied', value: 74, color: '#9ca3af', bg: '#f4f4f5' },
            {
              label: 'Screening',
              value: 28,
              color: '#0070f3',
              bg: 'rgba(0,112,243,0.08)',
            },
            {
              label: 'Technical',
              value: 12,
              color: '#7928ca',
              bg: 'rgba(121,40,202,0.08)',
            },
            {
              label: 'Interview',
              value: 8,
              color: '#f59e0b',
              bg: 'rgba(245,158,11,0.1)',
            },
            {
              label: 'Offer',
              value: 3,
              color: '#0cce6b',
              bg: 'rgba(12,206,107,0.1)',
            },
          ].map((s) => (
            <div key={s.label} className="stat-card stat-card--centered">
              <div
                className="pipeline-icon"
                style={{ '--pipeline-bg': s.bg } as React.CSSProperties}
              >
                <Users size={18} stroke={s.color} aria-hidden="true" />
              </div>
              <div
                className="stat-card__value stat-card__value--colored"
                style={{ '--stat-value-color': s.color } as React.CSSProperties}
              >
                {s.value}
              </div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="dash-filter-bar">
          <div className="dash-topbar__search dash-topbar__search--md">
            <Search size={16} aria-hidden="true" />
            <input placeholder="Search candidates..." />
          </div>
          <select className="dash-select">
            <option>All Jobs</option>
            <option>Product Designer</option>
            <option>Visual Designer</option>
            <option>Senior Interaction Designer</option>
          </select>
          {['All', 'Shortlisted', 'In Review', 'Applied'].map((f) => (
            <button
              key={f}
              className={`btn btn--sm ${f === 'All' ? 'btn--primary' : 'btn--ghost'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="dash-card">
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applied For</th>
                  <th>Skills</th>
                  <th>AI Score</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <div className="cell-user">
                        <div
                          className="cell-user__avatar"
                          style={
                            {
                              '--avatar-bg': c.color + '1A',
                              '--avatar-color': c.color,
                            } as React.CSSProperties
                          }
                        >
                          {c.initials}
                        </div>
                        <div className="cell-user__info">
                          <div className="cell-user__name">{c.name}</div>
                          <div className="cell-user__sub">{c.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="cell-meta">{c.job}</td>
                    <td>
                      <div className="cell-actions">
                        {c.skills.slice(0, 2).map((s) => (
                          <span key={s} className="skill-tag">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className="score-badge"
                        style={
                          {
                            '--score-color':
                              c.score >= 90 ? '#0cce6b' : c.score >= 80 ? '#0070f3' : '#f59e0b',
                          } as React.CSSProperties
                        }
                      >
                        {c.score}%
                      </span>
                    </td>
                    <td>
                      {/* Stage progress */}
                      <div className="stage-progress">
                        {['S', 'T', 'I', 'O'].map((step, idx) => (
                          <div
                            key={step}
                            className="stage-progress__bar"
                            style={
                              {
                                '--bar-color':
                                  (stageOrder[c.stage] || 0) > idx + 1
                                    ? '#0070f3'
                                    : stageOrder[c.stage] === idx + 2
                                      ? 'rgba(0,112,243,0.4)'
                                      : '#e4e4e7',
                              } as React.CSSProperties
                            }
                          />
                        ))}
                        <span className="stage-progress__label">{c.stage}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge badge--${c.status === 'Shortlisted' ? 'success' : c.status === 'In Review' ? 'warning' : c.status === 'Rejected' ? 'danger' : 'gray'}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="cell-muted">{c.applied}</td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn--outline btn--sm">Review</button>
                        <button className="btn btn--ghost btn--sm">Schedule</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dash-card__footer">
            <span className="cell-muted">Showing 8 of 125 candidates</span>
            <div className="cell-actions">
              <button className="btn btn--ghost btn--sm">← Prev</button>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  className={`btn btn--sm ${n === 1 ? 'btn--primary' : 'btn--ghost'}`}
                >
                  {n}
                </button>
              ))}
              <button className="btn btn--ghost btn--sm">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
