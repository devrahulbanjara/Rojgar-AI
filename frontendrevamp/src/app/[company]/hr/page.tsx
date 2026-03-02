"use client";

import { useState } from "react";

const JOBS = [
  {
    id: 1,
    title: "Product Designer",
    type: "Full Time",
    location: "Semarang, IND",
    salary: "$200/mo",
    experience: "Min. 1 Year",
    tags: ["UI/UX Designer", "Design Thinking", "Figma", "4+"],
    desc: "The Product Designer is responsible for articulating and conceptualizing our product vision and to shape our features from start to finish.",
    applied: 50,
    daysLeft: 5,
    total: 67,
    newApplicants: 21,
    approved: 46,
    rejected: 15,
    matchLevel: 70,
    logo: "P",
    logoColor: "#7928ca",
    about:
      "You will define the visual language, build design systems, and work closely with engineering and product teams to ship impactful experiences.",
  },
  {
    id: 2,
    title: "Visual Designer",
    type: "Full Time",
    location: "Semarang, IND",
    salary: "$90/hr",
    experience: "Min. 2 Years",
    tags: ["3D Design", "Blender", "After Effect", "Illustration"],
    desc: "The Visual Designer conveys design concepts into wireframes and high fidelity, quality prototypes that match project requirements.",
    applied: 74,
    daysLeft: 3,
    total: 74,
    newApplicants: 21,
    approved: 38,
    rejected: 15,
    matchLevel: 68,
    logo: "P",
    logoColor: "#7928ca",
    about:
      "Create compelling visual systems across web, mobile, and marketing materials. Own the brand voice through design.",
  },
  {
    id: 3,
    title: "Senior Interaction Designer",
    type: "Full Time",
    location: "Remote",
    salary: "$150/hr",
    experience: "Min. 3 Years",
    tags: ["UI Designer", "Motion Graphic", "After Effect", "3+"],
    desc: "Lead interaction design for complex product flows. Collaborate with PM and engineering to define interaction patterns.",
    applied: 31,
    daysLeft: 12,
    total: 31,
    newApplicants: 12,
    approved: 15,
    rejected: 4,
    matchLevel: 75,
    logo: "P",
    logoColor: "#7928ca",
    about:
      "Define and champion interaction design across our entire product suite. Mentor mid-level designers.",
  },
  {
    id: 4,
    title: "UX Researcher",
    type: "Part Time",
    location: "Semarang, IND",
    salary: "$80/hr",
    experience: "Min. 2 Years",
    tags: ["User Research", "Miro", "Figma"],
    desc: "Conduct qualitative and quantitative user research. Generate actionable insights that drive product decisions.",
    applied: 22,
    daysLeft: 7,
    total: 22,
    newApplicants: 9,
    approved: 10,
    rejected: 3,
    matchLevel: 83,
    logo: "P",
    logoColor: "#7928ca",
    about:
      "Own the end-to-end research process from planning to insights delivery. Collaborate across teams.",
  },
];

const SHORTLISTED = [
  {
    name: "Alex Chen",
    role: "UI/UX Designer",
    score: 94,
    status: "Interview",
    initials: "AC",
    color: "#0070f3",
  },
  {
    name: "Maria Santos",
    role: "Product Designer",
    score: 91,
    status: "Technical",
    initials: "MS",
    color: "#7928ca",
  },
  {
    name: "Sofia Greco",
    role: "UX Designer",
    score: 88,
    status: "Interview",
    initials: "SG",
    color: "#0cce6b",
  },
  {
    name: "James Park",
    role: "UX Researcher",
    score: 85,
    status: "Screening",
    initials: "JP",
    color: "#f59e0b",
  },
  {
    name: "Lily Wang",
    role: "Visual Designer",
    score: 82,
    status: "Screening",
    initials: "LW",
    color: "#ff4d4d",
  },
];

const UPCOMING_INTERVIEWS = [
  {
    candidate: "Alex Chen",
    role: "Product Designer",
    time: "Today, 2:00 PM",
    type: "Video",
    initials: "AC",
    color: "#0070f3",
  },
  {
    candidate: "Maria Santos",
    role: "Visual Designer",
    time: "Today, 4:30 PM",
    type: "In Person",
    initials: "MS",
    color: "#7928ca",
  },
  {
    candidate: "Sofia Greco",
    role: "Senior Interaction",
    time: "Tomorrow, 10:00 AM",
    type: "Video",
    initials: "SG",
    color: "#0cce6b",
  },
];

function DonutChart({
  total,
  approved,
  rejected,
  newApplicants,
}: {
  total: number;
  approved: number;
  rejected: number;
  newApplicants: number;
}) {
  const r = 36,
    cx = 50,
    cy = 50;
  const circ = 2 * Math.PI * r;
  const approvedDash = (approved / total) * circ;
  const rejectedDash = (rejected / total) * circ;
  const newDash = (newApplicants / total) * circ;
  const segments = [
    { dash: approvedDash, offset: 0, color: "#7928ca" },
    { dash: rejectedDash, offset: -approvedDash, color: "#ff4d4d" },
    { dash: newDash, offset: -(approvedDash + rejectedDash), color: "#0070f3" },
  ];
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#f4f4f5"
        strokeWidth="14"
      />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth="14"
          strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
          strokeDashoffset={circ * 0.25 + seg.offset}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

export default function HRDashboardPage() {
  const [selectedJob, setSelectedJob] = useState(JOBS[0]);

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
        Post Job
      </button>

      <div className="dash-content container dash-content--pad-top">
        {/* Stats */}
        <div className="dash-stats dash-stats--4col">
          {[
            {
              label: "Open Positions",
              value: "4",
              icon: "📋",
              color: "#0070f3",
              bg: "rgba(0,112,243,0.1)",
            },
            {
              label: "Total Applications",
              value: "177",
              icon: "📩",
              color: "#7928ca",
              bg: "rgba(121,40,202,0.1)",
            },
            {
              label: "Interviews Today",
              value: "3",
              icon: "🎙️",
              color: "#f59e0b",
              bg: "rgba(245,158,11,0.1)",
            },
            {
              label: "Offers Sent",
              value: "2",
              icon: "✅",
              color: "#0cce6b",
              bg: "rgba(12,206,107,0.1)",
            },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__header">
                <div
                  className="pipeline-icon"
                  style={{ "--pipeline-bg": s.bg } as React.CSSProperties}
                >
                  {s.icon}
                </div>
              </div>
              <div
                className="stat-card__value stat-card__value--colored"
                style={{ "--stat-value-color": s.color } as React.CSSProperties}
              >
                {s.value}
              </div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Three col layout */}
        <div className="hr-layout">
          {/* Left: profile + shortlisted + interviews */}
          <div className="dash-col-stack">
            {/* HR profile card */}
            <div className="profile-card">
              <div className="profile-card__avatar-wrap">
                <div className="profile-card__avatar">PM</div>
                <div className="profile-card__name">Priya Mehta</div>
                <div className="profile-card__title">HR Manager</div>
                <div className="profile-card__status">
                  <div className="profile-card__status-dot" />
                  Active
                </div>
              </div>
              <div className="profile-card__details">
                <div className="profile-card__details-title">Quick Stats</div>
                {[
                  { label: "Open Roles", value: "4" },
                  { label: "Pending Shortlist", value: "12" },
                  { label: "Interviews Today", value: "3" },
                ].map((item) => (
                  <div key={item.label} className="profile-card__detail-item">
                    <div className="profile-card__detail-item-icon">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                    <div>
                      <div className="profile-card__detail-item-label">
                        {item.label}
                      </div>
                      <div className="profile-card__detail-item-value">
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming interviews */}
            <div className="dash-card">
              <div className="dash-card__header">
                <div className="dash-card__title dash-card__title--sm">
                  Today&apos;s Interviews
                </div>
              </div>
              <div className="dash-card__body dash-card__body--activity">
                {UPCOMING_INTERVIEWS.map((iv, i) => (
                  <div key={iv.candidate} className="interview-item">
                    <div
                      className="interview-item__avatar"
                      style={
                        {
                          "--avatar-bg": iv.color + "1A",
                          "--avatar-color": iv.color,
                        } as React.CSSProperties
                      }
                    >
                      {iv.initials}
                    </div>
                    <div className="interview-item__body">
                      <div className="interview-item__name">{iv.candidate}</div>
                      <div className="interview-item__sub">{iv.time}</div>
                    </div>
                    <span
                      className={`badge badge--xs badge--${iv.type === "Video" ? "primary" : "gray"}`}
                    >
                      {iv.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Shortlisted */}
            <div className="dash-card">
              <div className="dash-card__header">
                <div className="dash-card__title dash-card__title--sm">
                  AI Shortlisted
                </div>
              </div>
              <div className="dash-card__body dash-card__body--activity">
                {SHORTLISTED.map((c, i) => (
                  <div key={c.name} className="interview-item">
                    <div
                      className="interview-item__avatar"
                      style={
                        {
                          "--avatar-bg": c.color + "1A",
                          "--avatar-color": c.color,
                        } as React.CSSProperties
                      }
                    >
                      {c.initials}
                    </div>
                    <div className="interview-item__body">
                      <div className="interview-item__name">{c.name}</div>
                      <div className="interview-item__sub">{c.role}</div>
                    </div>
                    <div
                      className="score-pill"
                      style={
                        {
                          "--score-bg":
                            c.score >= 90
                              ? "rgba(12,206,107,0.1)"
                              : "rgba(0,112,243,0.1)",
                          "--score-color":
                            c.score >= 90 ? "#0cce6b" : "#0070f3",
                        } as React.CSSProperties
                      }
                    >
                      {c.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: job list */}
          <div>
            <div className="job-list-header">
              <p className="job-list-header__count">
                {JOBS.length} Open Positions
              </p>
              <button className="btn btn--outline btn--sm">
                Sort by: Latest ↓
              </button>
            </div>
            <div className="job-list-stack">
              {JOBS.map((job) => (
                <div
                  key={job.id}
                  className={`job-card${selectedJob.id === job.id ? " job-card--active" : ""}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="job-card__header">
                    <div
                      className="job-card__logo"
                      style={
                        {
                          "--logo-bg": job.logoColor + "1A",
                          "--logo-color": job.logoColor,
                        } as React.CSSProperties
                      }
                    >
                      {job.logo}
                    </div>
                    <div className="job-card__title-wrap">
                      <div className="job-card__title">{job.title}</div>
                      <div className="job-card__company">
                        Pickolab Studio
                        <span className="job-card__location">
                          · {job.location}
                        </span>
                      </div>
                    </div>
                    <div className="job-card__header-right">
                      <span className="badge badge--xs badge--success">
                        Active
                      </span>
                      <span
                        className="job-card__days-left"
                        style={
                          {
                            "--expires-color":
                              job.daysLeft <= 5 ? "#ff4d4d" : "#9ca3af",
                          } as React.CSSProperties
                        }
                      >
                        {job.daysLeft}d left
                      </span>
                    </div>
                  </div>

                  <div className="job-card__tags">
                    {job.tags.slice(0, 3).map((t) => (
                      <span key={t} className="job-card__tag">
                        {t}
                      </span>
                    ))}
                  </div>

                  <p className="job-card__desc">{job.desc}</p>

                  <div className="job-card__meta">
                    <span>
                      <svg
                        width="12"
                        height="12"
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
                      {job.type}
                    </span>
                    <span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {job.location}
                    </span>
                    <span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      {job.applied} applied
                    </span>
                    <button className="btn btn--outline btn--sm job-card__meta-time">
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: job detail panel */}
          <div className="job-detail">
            {/* Cover */}
            <div
              className="job-detail__cover"
              style={
                {
                  "--job-color-from": selectedJob.logoColor + "22",
                  "--job-color-to": selectedJob.logoColor + "0D",
                } as React.CSSProperties
              }
            />

            <div className="job-detail__header">
              <div className="job-detail__logo-wrap">
                <div
                  className="job-detail__logo"
                  style={
                    {
                      "--job-logo-color": selectedJob.logoColor,
                    } as React.CSSProperties
                  }
                >
                  {selectedJob.logo}
                </div>
                <div className="job-detail__actions">
                  <button className="job-detail__action-btn" title="Edit job">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button className="job-detail__action-btn" title="Share">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="job-detail__meta">
                Created {selectedJob.daysLeft * 2} days ago
              </div>
              <div className="job-detail__title">{selectedJob.title}</div>
              <div className="job-detail__company">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Pickolab Studio · {selectedJob.location}
              </div>
            </div>

            {/* Applicants Summary */}
            <div className="job-detail__stats">
              <div className="job-detail__stats-title">
                Applicants Summary
                <div className="job-detail__match">
                  <span className="job-detail__match-label">AI Match</span>
                  <span className="job-detail__match-value">
                    {selectedJob.matchLevel}%
                  </span>
                </div>
              </div>
              <div className="job-detail__stats-row">
                <div className="job-detail__donut-wrap">
                  <DonutChart
                    total={selectedJob.total}
                    approved={selectedJob.approved}
                    rejected={selectedJob.rejected}
                    newApplicants={selectedJob.newApplicants}
                  />
                  <div className="job-detail__donut-center">
                    {selectedJob.total}
                  </div>
                </div>
                <div className="job-detail__stats-info">
                  <div className="job-detail__stats-total">
                    {selectedJob.total}
                    <span className="text-note">/100</span>
                  </div>
                  <div className="job-detail__stats-label">
                    Total Candidates
                  </div>
                  <div className="job-detail__legend">
                    <div className="job-detail__legend-item">
                      <div className="job-detail__legend-item-dot job-detail__legend-item-dot--primary" />
                      New ({selectedJob.newApplicants})
                    </div>
                    <div className="job-detail__legend-item">
                      <div className="job-detail__legend-item-dot job-detail__legend-item-dot--secondary" />
                      Approved ({selectedJob.approved})
                    </div>
                    <div className="job-detail__legend-item">
                      <div className="job-detail__legend-item-dot job-detail__legend-item-dot--accent" />
                      Rejected ({selectedJob.rejected})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="job-detail__info">
              <div className="job-detail__info-grid">
                <div className="job-detail__info-item">
                  <span className="job-detail__info-item-label">Job Type</span>
                  <span className="job-detail__info-item-value">
                    {selectedJob.type}
                  </span>
                </div>
                <div className="job-detail__info-item">
                  <span className="job-detail__info-item-label">
                    Experience
                  </span>
                  <span className="job-detail__info-item-value">
                    {selectedJob.experience}
                  </span>
                </div>
                <div className="job-detail__info-item">
                  <span className="job-detail__info-item-label">Salary</span>
                  <span className="job-detail__info-item-value">
                    {selectedJob.salary}
                  </span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="job-detail__about">
              <h4>About Job Role</h4>
              <p>{selectedJob.about.slice(0, 160)}…</p>
            </div>

            {/* CTA */}
            <div className="job-detail__cta">
              <button className="job-detail__apply-btn">
                View All Candidates
              </button>
              <button
                className="job-detail__msg-btn"
                title="Schedule Interview"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
