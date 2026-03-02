import Link from "next/link";

const stats = [
  {
    label: "Total Users",
    value: "12,842",
    trend: "+248",
    trendDir: "up",
    icon: "users",
    variant: "primary",
  },
  {
    label: "Active Companies",
    value: "384",
    trend: "+18",
    trendDir: "up",
    icon: "companies",
    variant: "success",
  },
  {
    label: "Jobs Posted",
    value: "2,410",
    trend: "+67",
    trendDir: "up",
    icon: "jobs",
    variant: "secondary",
  },
  {
    label: "Placements",
    value: "1,093",
    trend: "+41",
    trendDir: "up",
    icon: "placements",
    variant: "warning",
  },
  {
    label: "Monthly Revenue",
    value: "$48.2k",
    trend: "+12%",
    trendDir: "up",
    icon: "revenue",
    variant: "accent",
  },
  {
    label: "Pending Reviews",
    value: "76",
    trend: "+5",
    trendDir: "down",
    icon: "review",
    variant: "accent",
  },
];

const recentUsers = [
  {
    name: "Sarah Johnson",
    email: "sarah@gmail.com",
    role: "Candidate",
    plan: "Pro",
    joined: "1 hr ago",
    status: "Active",
    initials: "SJ",
    color: "#0070f3",
  },
  {
    name: "Pickolab Studio",
    email: "hr@pickolab.com",
    role: "Company",
    plan: "Enterprise",
    joined: "3 hrs ago",
    status: "Active",
    initials: "PS",
    color: "#7928ca",
  },
  {
    name: "Marcus Ray",
    email: "marcus@mail.com",
    role: "Candidate",
    plan: "Free",
    joined: "5 hrs ago",
    status: "Active",
    initials: "MR",
    color: "#0cce6b",
  },
  {
    name: "GoTo Group",
    email: "recruit@goto.id",
    role: "Company",
    plan: "Business",
    joined: "8 hrs ago",
    status: "Pending",
    initials: "GT",
    color: "#e42729",
  },
  {
    name: "Aisha Patel",
    email: "aisha@mail.com",
    role: "Candidate",
    plan: "Pro",
    joined: "12 hrs ago",
    status: "Active",
    initials: "AP",
    color: "#ff4d4d",
  },
];

const topCompanies = [
  { name: "Stripe", jobs: 12, hires: 8, logo: "S", color: "#635BFF" },
  { name: "Shopee", jobs: 9, hires: 6, logo: "Sh", color: "#EE4D2D" },
  { name: "Figma", jobs: 7, hires: 4, logo: "F", color: "#F24E1E" },
  { name: "Tokopedia", jobs: 11, hires: 7, logo: "T", color: "#42B549" },
  { name: "Linear", jobs: 5, hires: 3, logo: "L", color: "#5E6AD2" },
];

const platformActivity = [
  {
    text: "<strong>Pickolab Studio</strong> posted 3 new jobs.",
    time: "30 mins ago",
    type: "jobs",
  },
  {
    text: "<strong>248 new users</strong> registered today.",
    time: "1 hour ago",
    type: "users",
  },
  {
    text: "<strong>GoTo Group</strong> upgraded to Enterprise plan.",
    time: "2 hours ago",
    type: "billing",
  },
  {
    text: "AI screening flagged <strong>5 suspicious profiles</strong> for review.",
    time: "3 hours ago",
    type: "warning",
  },
  {
    text: "<strong>Stripe</strong> closed 2 positions after successful hires.",
    time: "5 hours ago",
    type: "success",
  },
];

function StatIcon({ icon }: { icon: string }) {
  const map: Record<string, React.ReactNode> = {
    users: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    companies: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    jobs: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    placements: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    revenue: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    review: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  };
  return <>{map[icon]}</>;
}

export default function AdminDashboardPage() {
  return (
    <>
      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Platform Overview</h2>
            <p className="dash-page-header__subtitle">
              Real-time statistics for ConvexHire platform
            </p>
          </div>
          <div className="dash-page-header__actions">
            <select className="dash-select dash-select--md">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats dash-stats--3col">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__header">
                <div
                  className={`stat-card__icon-wrap stat-card__icon-wrap--${s.variant}`}
                >
                  <StatIcon icon={s.icon} />
                </div>
                <span
                  className={`stat-card__trend stat-card__trend--${s.trendDir}`}
                >
                  {s.trend}
                </span>
              </div>
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Two column layout */}
        <div className="dash-grid dash-grid--sidebar-right">
          {/* Recent users table */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Recent Registrations</div>
                <div className="dash-card__subtitle">
                  Newest users and companies
                </div>
              </div>
              <Link href="/admin/users" className="btn btn--outline btn--sm">
                View All
              </Link>
            </div>
            <div className="table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.email}>
                      <td>
                        <div className="cell-user">
                          <div
                            className="cell-user__avatar"
                            style={
                              {
                                "--avatar-bg": u.color + "1A",
                                "--avatar-color": u.color,
                              } as React.CSSProperties
                            }
                          >
                            {u.initials}
                          </div>
                          <div className="cell-user__info">
                            <div className="cell-user__name">{u.name}</div>
                            <div className="cell-user__sub">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge badge--${u.role === "Company" ? "secondary" : "primary"}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="cell-muted">{u.plan}</td>
                      <td className="cell-muted">{u.joined}</td>
                      <td>
                        <span
                          className={`badge badge--${u.status === "Active" ? "success" : "warning"}`}
                        >
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity feed */}
          <div className="dash-col-stack">
            <div className="dash-card">
              <div className="dash-card__header">
                <div className="dash-card__title">Platform Activity</div>
              </div>
              <div className="dash-card__body dash-card__body--activity">
                <div className="activity-list">
                  {platformActivity.map((a, i) => (
                    <div key={i} className="activity-item">
                      <div
                        className={`activity-item__dot${
                          a.type === "warning"
                            ? " activity-item__dot--warning"
                            : a.type === "success"
                              ? " activity-item__dot--success"
                              : ""
                        }`}
                      />
                      <div className="activity-item__body">
                        <p
                          className="activity-item__text"
                          dangerouslySetInnerHTML={{ __html: a.text }}
                        />
                        <div className="activity-item__time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top companies */}
            <div className="dash-card">
              <div className="dash-card__header">
                <div className="dash-card__title">Top Companies</div>
              </div>
              <div className="dash-card__body dash-card__body--no-top">
                {topCompanies.map((c, i) => (
                  <div
                    key={c.name}
                    className={`item-row item-row--pad${i < topCompanies.length - 1 ? "" : ""}`}
                  >
                    <div
                      className="item-row__logo"
                      style={
                        {
                          "--logo-bg": c.color + "1A",
                          "--logo-color": c.color,
                        } as React.CSSProperties
                      }
                    >
                      {c.logo}
                    </div>
                    <div className="item-row__info">
                      <div className="item-row__title">{c.name}</div>
                      <div className="item-row__sub">
                        {c.jobs} jobs · {c.hires} hires
                      </div>
                    </div>
                    <div className="progress-bar progress-bar--narrow-md">
                      <div
                        className="progress-bar__fill"
                        style={{ width: `${(c.hires / c.jobs) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
