const jobs = [
  {
    id: 1,
    title: "Visual Designer",
    company: "Pickolab Studio",
    location: "Semarang, IND",
    type: "Full Time",
    status: "Active",
    applications: 74,
    posted: "2 days ago",
    logo: "P",
    color: "#7928ca",
  },
  {
    id: 2,
    title: "Product Designer",
    company: "Pickolab Studio",
    location: "Semarang, IND",
    type: "Full Time",
    status: "Active",
    applications: 50,
    posted: "3 days ago",
    logo: "P",
    color: "#7928ca",
  },
  {
    id: 3,
    title: "Senior Interaction Designer",
    company: "Shopee",
    location: "Jakarta, IND",
    type: "Full Time",
    status: "Active",
    applications: 48,
    posted: "5 days ago",
    logo: "S",
    color: "#EE4D2D",
  },
  {
    id: 4,
    title: "Frontend Engineer",
    company: "GoTo Group",
    location: "Remote",
    type: "Full Time",
    status: "Paused",
    applications: 31,
    posted: "6 days ago",
    logo: "G",
    color: "#E42729",
  },
  {
    id: 5,
    title: "UX Researcher",
    company: "Tokopedia",
    location: "Jakarta, IND",
    type: "Part Time",
    status: "Active",
    applications: 22,
    posted: "1 week ago",
    logo: "T",
    color: "#42B549",
  },
  {
    id: 6,
    title: "Backend Developer",
    company: "Stripe",
    location: "Remote",
    type: "Full Time",
    status: "Closed",
    applications: 98,
    posted: "2 weeks ago",
    logo: "S",
    color: "#635BFF",
  },
  {
    id: 7,
    title: "iOS Engineer",
    company: "Figma",
    location: "San Francisco, CA",
    type: "Full Time",
    status: "Active",
    applications: 43,
    posted: "3 days ago",
    logo: "F",
    color: "#F24E1E",
  },
  {
    id: 8,
    title: "Data Scientist",
    company: "Linear",
    location: "Remote",
    type: "Contract",
    status: "Active",
    applications: 37,
    posted: "4 days ago",
    logo: "L",
    color: "#5E6AD2",
  },
];

export default function AdminJobsPage() {
  return (
    <>
      <button className="btn btn--primary btn--sm">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Job
      </button>

      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">All Job Listings</h2>
            <p className="dash-page-header__subtitle">
              Monitor and manage all posted job listings across the platform
            </p>
          </div>
        </div>

        {/* Filters row */}
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
            <input placeholder="Search jobs..." />
          </div>
          {["All", "Active", "Paused", "Closed"].map((f) => (
            <button
              key={f}
              className={`btn btn--sm ${f === "All" ? "btn--primary" : "btn--ghost"}`}
            >
              {f}
            </button>
          ))}
          <span className="dash-results-hint">
            Showing {jobs.length} results
          </span>
        </div>

        <div className="dash-card">
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Applications</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="cell-user">
                        <div
                          className="cell-user__avatar cell-user__avatar--rect"
                          style={
                            {
                              "--avatar-bg": job.color + "1A",
                              "--avatar-color": job.color,
                            } as React.CSSProperties
                          }
                        >
                          {job.logo}
                        </div>
                        {job.title}
                      </div>
                    </td>
                    <td className="cell-meta">{job.company}</td>
                    <td className="cell-muted">{job.location}</td>
                    <td>
                      <span className="badge badge--gray">{job.type}</span>
                    </td>
                    <td>
                      <div className="cell-progress">
                        <div className="progress-bar progress-bar--narrow-sm">
                          <div
                            className="progress-bar__fill"
                            style={{
                              width: `${Math.min(job.applications, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="cell-progress__count">
                          {job.applications}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge badge--${job.status === "Active" ? "success" : job.status === "Paused" ? "warning" : "gray"}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="cell-muted">{job.posted}</td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn--ghost btn--sm">Edit</button>
                        <button className="btn btn--sm btn--accent">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dash-card__footer">
            <span className="cell-muted">Page 1 of 12</span>
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
