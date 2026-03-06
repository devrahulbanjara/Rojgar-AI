"use client";
import Link from "next/link";
import {
  DocumentRegular,
  CalendarRegular,
  EyeRegular,
  BookmarkRegular,
  MoneyRegular,
} from "@fluentui/react-icons";

const stats = [
  {
    label: "Applications Sent",
    value: "24",
    trend: "+3",
    trendDir: "up",
    icon: "applications",
    variant: "primary",
  },
  {
    label: "Interviews Scheduled",
    value: "5",
    trend: "+1",
    trendDir: "up",
    icon: "calendar",
    variant: "success",
  },
  {
    label: "Profile Views",
    value: "138",
    trend: "+12%",
    trendDir: "up",
    icon: "eye",
    variant: "secondary",
  },
  {
    label: "Saved Jobs",
    value: "17",
    trend: "-2",
    trendDir: "down",
    icon: "bookmark",
    variant: "warning",
  },
];

const recentApplications = [
  {
    company: "Stripe",
    role: "Product Designer",
    location: "Remote",
    status: "Interview",
    statusVariant: "success",
    applied: "2 days ago",
    logo: "S",
    color: "#635BFF",
  },
  {
    company: "Figma",
    role: "UX Designer",
    location: "San Francisco, CA",
    status: "In Review",
    statusVariant: "warning",
    applied: "3 days ago",
    logo: "F",
    color: "#F24E1E",
  },
  {
    company: "Linear",
    role: "UI Engineer",
    location: "New York, NY",
    status: "Shortlisted",
    statusVariant: "primary",
    applied: "5 days ago",
    logo: "L",
    color: "#5E6AD2",
  },
  {
    company: "Vercel",
    role: "Design Engineer",
    location: "Remote",
    status: "Applied",
    statusVariant: "gray",
    applied: "6 days ago",
    logo: "V",
    color: "#000",
  },
  {
    company: "Notion",
    role: "Product Designer",
    location: "New York, NY",
    status: "Rejected",
    statusVariant: "danger",
    applied: "1 week ago",
    logo: "N",
    color: "#000",
  },
];

const activities = [
  {
    text: "<strong>Stripe</strong> moved your application to Interview stage.",
    time: "2 hours ago",
  },
  {
    text: "Your profile was viewed by <strong>Google</strong> recruiter.",
    time: "5 hours ago",
  },
  {
    text: "<strong>Figma</strong> sent you a message regarding your application.",
    time: "Yesterday",
  },
  {
    text: "New job match: <strong>Senior Product Designer</strong> at Airbnb.",
    time: "Yesterday",
  },
  {
    text: "Your resume was downloaded by <strong>Linear</strong>.",
    time: "2 days ago",
  },
];

const recommendedJobs = [
  {
    title: "Senior UI Designer",
    company: "Dropbox",
    location: "Remote",
    salary: "$120k–$150k",
    tags: ["Figma", "Prototyping"],
    match: 94,
    logo: "D",
    color: "#0061FF",
  },
  {
    title: "Product Designer",
    company: "Loom",
    location: "San Francisco",
    salary: "$100k–$130k",
    tags: ["UI/UX", "Research"],
    match: 88,
    logo: "L",
    color: "#625DF5",
  },
  {
    title: "UX Engineer",
    company: "Retool",
    location: "New York",
    salary: "$110k–$140k",
    tags: ["React", "CSS"],
    match: 82,
    logo: "R",
    color: "#EF4B4C",
  },
];

function ApplicationStatusIcon({ variant }: { variant: string }) {
  const colors: Record<string, string> = {
    success: "#0cce6b",
    warning: "#f59e0b",
    primary: "#0070f3",
    gray: "#9ca3af",
    danger: "#ff4d4d",
  };
  return (
    <div
      className="app-status-dot"
      style={
        { "--dot-color": colors[variant] || colors.gray } as React.CSSProperties
      }
    />
  );
}

function StatIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    applications: <DocumentRegular style={{ fontSize: 22 }} />,
    calendar: <CalendarRegular style={{ fontSize: 22 }} />,
    eye: <EyeRegular style={{ fontSize: 22 }} />,
    bookmark: <BookmarkRegular style={{ fontSize: 22 }} />,
  };
  return icons[icon] || null;
}

export default function UserDashboardPage() {
  return (
    <>
      <div className="dash-content container">
        {/* Page header */}
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Welcome back, Alex 👋</h2>
            <p className="dash-page-header__subtitle">
              Here&apos;s what&apos;s happening with your job search today.
            </p>
          </div>
          <div className="dash-page-header__actions">
            <span className="page-header-hint">Last updated: just now</span>
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats">
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

        {/* Main row */}
        <div className="dash-grid dash-grid--sidebar-right">
          {/* Left: recent applications */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Recent Applications</div>
                <div className="dash-card__subtitle">
                  Your latest job applications
                </div>
              </div>
              <Link
                href="/dashboard/applications"
                className="btn btn--outline btn--sm"
              >
                View All
              </Link>
            </div>
            <div className="table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app.company + app.role}>
                      <td>
                        <div className="cell-user">
                          <div
                            className="cell-user__avatar cell-user__avatar--sm cell-user__avatar--rect"
                            style={
                              {
                                "--avatar-bg": app.color + "1A",
                                "--avatar-color": app.color,
                              } as React.CSSProperties
                            }
                          >
                            {app.logo}
                          </div>
                          {app.company}
                        </div>
                      </td>
                      <td className="cell-meta">{app.role}</td>
                      <td className="cell-muted">{app.location}</td>
                      <td>
                        <span className={`badge badge--${app.statusVariant}`}>
                          <ApplicationStatusIcon variant={app.statusVariant} />
                          {app.status}
                        </span>
                      </td>
                      <td className="cell-muted">{app.applied}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: activity feed */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div className="dash-card__title">Recent Activity</div>
            </div>
            <div className="dash-card__body dash-card__body--activity">
              <div className="activity-list">
                {activities.map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-item__dot" />
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
        </div>

        {/* Recommended jobs */}
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Recommended for You</div>
              <div className="dash-card__subtitle">
                Based on your profile and skills
              </div>
            </div>
            <Link href="/dashboard/jobs" className="btn btn--outline btn--sm">
              Browse All Jobs
            </Link>
          </div>
          <div className="dash-card__body">
            <div className="dash-grid dash-grid--3col">
              {recommendedJobs.map((job) => (
                <div key={job.title} className="job-card">
                  <div className="job-card__header">
                    <div
                      className="job-card__logo"
                      style={
                        {
                          "--logo-bg": job.color + "1A",
                          "--logo-color": job.color,
                        } as React.CSSProperties
                      }
                    >
                      {job.logo}
                    </div>
                    <div className="job-card__title-wrap">
                      <div className="job-card__title">{job.title}</div>
                      <div className="job-card__company">
                        {job.company}
                        <span className="job-card__location">
                          · {job.location}
                        </span>
                      </div>
                    </div>
                    <div className="match-badge">{job.match}%</div>
                  </div>
                  <div className="job-card__tags">
                    {job.tags.map((t) => (
                      <span key={t} className="job-card__tag">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="job-card__meta">
                    <span>
                      <MoneyRegular width={12} height={12} aria-hidden="true" />
                      {job.salary}
                    </span>
                    <Link
                      href="/dashboard/jobs"
                      className="btn btn--primary btn--sm job-card__meta-time"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
