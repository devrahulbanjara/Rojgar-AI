const users = [
  {
    id: 1,
    name: "Alex Chen",
    email: "alex@mail.com",
    role: "Candidate",
    plan: "Pro",
    applications: 24,
    joined: "Jan 15, 2026",
    status: "Active",
    initials: "AC",
    color: "#0070f3",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@gmail.com",
    role: "Candidate",
    plan: "Free",
    applications: 8,
    joined: "Jan 22, 2026",
    status: "Active",
    initials: "SJ",
    color: "#7928ca",
  },
  {
    id: 3,
    name: "Marcus Ray",
    email: "marcus@mail.com",
    role: "Candidate",
    plan: "Pro",
    applications: 15,
    joined: "Feb 1, 2026",
    status: "Active",
    initials: "MR",
    color: "#0cce6b",
  },
  {
    id: 4,
    name: "Aisha Patel",
    email: "aisha@mail.com",
    role: "Candidate",
    plan: "Pro",
    applications: 31,
    joined: "Feb 5, 2026",
    status: "Suspended",
    initials: "AP",
    color: "#ff4d4d",
  },
  {
    id: 5,
    name: "John Doe",
    email: "john@mail.com",
    role: "Candidate",
    plan: "Free",
    applications: 3,
    joined: "Feb 10, 2026",
    status: "Active",
    initials: "JD",
    color: "#f59e0b",
  },
  {
    id: 6,
    name: "Pickolab Studio",
    email: "hr@pickolab.com",
    role: "Company",
    plan: "Enterprise",
    applications: 0,
    joined: "Dec 10, 2025",
    status: "Active",
    initials: "PS",
    color: "#7928ca",
  },
  {
    id: 7,
    name: "GoTo Group",
    email: "recruit@goto.id",
    role: "Company",
    plan: "Business",
    applications: 0,
    joined: "Jan 5, 2026",
    status: "Pending",
    initials: "GT",
    color: "#e42729",
  },
  {
    id: 8,
    name: "Stripe Inc",
    email: "jobs@stripe.com",
    role: "Company",
    plan: "Enterprise",
    applications: 0,
    joined: "Nov 20, 2025",
    status: "Active",
    initials: "ST",
    color: "#635BFF",
  },
];

export default function AdminUsersPage() {
  return (
    <>
      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">All Users</h2>
            <p className="dash-page-header__subtitle">
              Manage candidates, recruiters, and company accounts
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="dash-stats dash-stats--4col">
          {[
            {
              label: "Total Users",
              value: "12,842",
              variant: "primary",
              icon: "👥",
            },
            {
              label: "Candidates",
              value: "11,204",
              variant: "success",
              icon: "🧑‍💼",
            },
            {
              label: "Companies",
              value: "384",
              variant: "secondary",
              icon: "🏢",
            },
            {
              label: "Pending Review",
              value: "76",
              variant: "warning",
              icon: "⏳",
            },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__header">
                <div className="stat-card__icon-emoji">{s.icon}</div>
              </div>
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="dash-filter-bar">
          <div className="dash-topbar__search dash-topbar__search--lg">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input placeholder="Search users..." />
          </div>
          {["All", "Candidates", "Companies", "Pending"].map((f) => (
            <button
              key={f}
              className={`btn btn--sm ${f === "All" ? "btn--primary" : "btn--ghost"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="dash-card">
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Applications</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
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
                    <td>
                      <span
                        className={`badge badge--${u.plan === "Enterprise" ? "secondary" : u.plan === "Pro" ? "primary" : "gray"}`}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="cell-meta">
                      {u.role === "Candidate" ? u.applications : "—"}
                    </td>
                    <td className="cell-muted">{u.joined}</td>
                    <td>
                      <span
                        className={`badge badge--${u.status === "Active" ? "success" : u.status === "Suspended" ? "danger" : "warning"}`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn--ghost btn--sm">View</button>
                        <button className="btn btn--ghost btn--sm">
                          {u.status === "Active" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dash-card__footer">
            <span className="cell-muted">Showing 8 of 12,842 users</span>
            <div className="cell-actions">
              <button className="btn btn--ghost btn--sm">← Prev</button>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  className={`btn btn--sm ${n === 1 ? "btn--primary" : "btn--ghost"}`}
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
  );
}
