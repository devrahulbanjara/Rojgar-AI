"use client";

import { useState } from "react";

const JOBS = [
  {
    id: 1,
    title: "Visual Designer",
    company: "Pickolab Studio",
    location: "Semarang, IND",
    type: "Full Time",
    tags: ["3D Design", "Blender", "After Effect", "Illustration"],
    desc: "The Visual Designer conveys design concepts into wireframes and high fidelity, quality prototypes that match project requirement, product objective, brand identity...",
    applied: 74,
    daysLeft: 3,
    salary: "$90/hr",
    experience: "Min. 2 Years",
    logo: "P",
    logoColor: "#7928CA",
    totalCandidates: 74,
    newApplicants: 21,
    approved: 46,
    rejected: 15,
    matchLevel: 68,
    about:
      "Pickolab Studio is a creative design agency based in Semarang, Indonesia. We specialize in crafting compelling visual experiences that align with brand strategy and product goals. Join our growing team to work on world-class design projects.",
  },
  {
    id: 2,
    title: "Product Designer",
    company: "Pickolab Studio",
    location: "Semarang, IND",
    type: "Full Time",
    tags: ["UI/UX Designer", "Design Thinking", "Figma", "4+"],
    desc: "The Product Designer is responsible for articulating and conceptualizing our product vision and to shape our features from start to finish. You will not only be improving...",
    applied: 50,
    daysLeft: 5,
    salary: "$200/mo",
    experience: "Min. 1 Year",
    logo: "P",
    logoColor: "#7928CA",
    totalCandidates: 67,
    newApplicants: 21,
    approved: 46,
    rejected: 15,
    matchLevel: 70,
    about:
      "The Product Designer is responsible for articulating and conceptualizing our product vision and to shape our features from start to finish. You will not only be improving the user experience via UI and UX, but drive business value through great design decisions.",
  },
  {
    id: 3,
    title: "Senior Interaction Designer",
    company: "Shopee",
    location: "Semarang, IND",
    type: "Full Time",
    tags: ["UI Designer", "Motion Graphic", "After Effect", "3+"],
    desc: "The Senior Interaction Designer is responsible for certain phases of design projects assigned to be implemented into outputs such as design research reports...",
    applied: 48,
    daysLeft: 12,
    salary: "$150/hr",
    experience: "Min. 3 Years",
    logo: "S",
    logoColor: "#EE4D2D",
    totalCandidates: 48,
    newApplicants: 18,
    approved: 22,
    rejected: 8,
    matchLevel: 75,
    about:
      "Shopee is Southeast Asia's premier e-commerce platform. We are looking for a Senior Interaction Designer to lead design initiatives for our enterprise products, improving UX for millions of users.",
  },
  {
    id: 4,
    title: "UX Researcher",
    company: "Tokopedia",
    location: "Jakarta, IND",
    type: "Part Time",
    tags: ["User Research", "Figma", "Miro"],
    desc: "Conduct user research and usability testing sessions. Synthesize qualitative and quantitative data to generate actionable insights for product teams...",
    applied: 31,
    daysLeft: 7,
    salary: "$80/hr",
    experience: "Min. 2 Years",
    logo: "T",
    logoColor: "#42B549",
    totalCandidates: 31,
    newApplicants: 12,
    approved: 14,
    rejected: 5,
    matchLevel: 83,
    about:
      "Tokopedia is Indonesia's largest digital marketplace. Our UX Research team is core to how we build products that serve tens of millions of users.",
  },
  {
    id: 5,
    title: "Motion Designer",
    company: "GoTo Group",
    location: "Jakarta, IND",
    type: "Full Time",
    tags: ["After Effects", "Cinema 4D", "Lottie"],
    desc: "Create motion graphics, animated explainers, and UI animations that communicate complex ideas simply and bring product interfaces to life...",
    applied: 22,
    daysLeft: 10,
    salary: "$110/hr",
    experience: "Min. 2 Years",
    logo: "G",
    logoColor: "#E42729",
    totalCandidates: 22,
    newApplicants: 9,
    approved: 10,
    rejected: 3,
    matchLevel: 61,
    about:
      "GoTo Group is the largest digital ecosystem in Indonesia, combining Gojek and Tokopedia into one powerhouse.",
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
  const size = 100;
  const r = 38;
  const cx = 50;
  const cy = 50;
  const circ = 2 * Math.PI * r;

  const approvedPct = approved / total;
  const rejectedPct = rejected / total;
  const newPct = newApplicants / total;

  const approvedDash = approvedPct * circ;
  const rejectedDash = rejectedPct * circ;
  const newDash = newPct * circ;

  const segments = [
    { dash: approvedDash, offset: 0, color: "#7928ca" },
    { dash: rejectedDash, offset: -approvedDash, color: "#ff4d4d" },
    { dash: newDash, offset: -(approvedDash + rejectedDash), color: "#0070f3" },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* bg track */}
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
          className="donut-ring"
        />
      ))}
    </svg>
  );
}

export default function UserJobsPage() {
  const [selectedJob, setSelectedJob] = useState(JOBS[1]);
  const [searchVal, setSearchVal] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const filtered = JOBS.filter((j) => {
    const matchSearch =
      !searchVal ||
      j.title.toLowerCase().includes(searchVal.toLowerCase()) ||
      j.company.toLowerCase().includes(searchVal.toLowerCase());
    const matchType = typeFilter.length === 0 || typeFilter.includes(j.type);
    return matchSearch && matchType;
  });

  const toggleType = (t: string) =>
    setTypeFilter((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  return (
    <>
      <div className="dash-content container dash-content--pad-top">
        {/* Three-column layout */}
        <div className="jobs-layout">
          {/* Filter Sidebar */}
          <div className="jobs-layout__sidebar">
            <div className="jobs-layout__sidebar-title">Filters</div>

            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Job Type</div>
              {["Full Time", "Part Time", "Remote", "Contract"].map((t) => (
                <label key={t} className="jobs-layout__filter-option">
                  <input
                    type="checkbox"
                    checked={typeFilter.includes(t)}
                    onChange={() => toggleType(t)}
                  />
                  {t}
                </label>
              ))}
            </div>

            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Experience</div>
              {["Entry Level", "Mid Level", "Senior", "Lead"].map((t) => (
                <label key={t} className="jobs-layout__filter-option">
                  <input type="checkbox" readOnly />
                  {t}
                </label>
              ))}
            </div>

            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">
                Salary Range
              </div>
              {["$50/hr–$80/hr", "$80/hr–$120/hr", "$120/hr–$200/hr"].map(
                (t) => (
                  <label key={t} className="jobs-layout__filter-option">
                    <input type="checkbox" readOnly />
                    {t}
                  </label>
                ),
              )}
            </div>

            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Location</div>
              {["Semarang", "Jakarta", "Remote"].map((t) => (
                <label key={t} className="jobs-layout__filter-option">
                  <input type="checkbox" readOnly />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* Job List */}
          <div>
            <div className="job-list-header">
              <p className="job-list-header__count">
                {filtered.length} Job Active
              </p>
              <div className="job-list-header__sort">
                Sort by
                <select className="dash-select">
                  <option>Popular Job</option>
                  <option>Newest</option>
                  <option>Highest Pay</option>
                  <option>Best Match</option>
                </select>
              </div>
            </div>

            <div className="job-list-stack">
              {filtered.map((job) => (
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
                        {job.company}
                        <span className="job-card__location">
                          · {job.location}
                        </span>
                      </div>
                    </div>
                    <button className="job-card__bookmark" title="Save job">
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
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>

                  <div className="job-card__tags">
                    {job.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="job-card__tag">
                        {tag}
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
                        <rect
                          x="2"
                          y="7"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        />
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
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {job.applied} applied
                    </span>
                    <span className="job-card__meta-time">
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
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {job.daysLeft} days left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Detail */}
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

            {/* Header */}
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
                  <button className="job-detail__action-btn" title="Save">
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
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                  <button className="job-detail__action-btn" title="Share">
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
                Created {selectedJob.daysLeft * 2} Days ago
              </div>
              <div className="job-detail__title">{selectedJob.title}</div>
              <div className="job-detail__company">
                <svg
                  width="13"
                  height="13"
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
                {selectedJob.company} · {selectedJob.location}
              </div>
            </div>

            {/* Applicants Summary */}
            <div className="job-detail__stats">
              <div className="job-detail__stats-title">
                Applicants Summary
                <div className="job-detail__match">
                  <span className="job-detail__match-label">Match level</span>
                  <span className="job-detail__match-value">
                    {selectedJob.matchLevel}%
                  </span>
                </div>
              </div>
              <div className="job-detail__stats-row">
                <div className="job-detail__donut-wrap">
                  <DonutChart
                    total={selectedJob.totalCandidates}
                    approved={selectedJob.approved}
                    rejected={selectedJob.rejected}
                    newApplicants={selectedJob.newApplicants}
                  />
                  <div className="job-detail__donut-center">
                    {selectedJob.totalCandidates}
                  </div>
                </div>
                <div className="job-detail__stats-info">
                  <div className="job-detail__stats-total">
                    {selectedJob.totalCandidates}
                    <span className="text-note">/100</span>
                  </div>
                  <div className="job-detail__stats-label">Total Candidate</div>
                  <div className="job-detail__legend">
                    <div className="job-detail__legend-item">
                      <div className="job-detail__legend-item-dot job-detail__legend-item-dot--primary" />
                      New Applicants ({selectedJob.newApplicants})
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

            {/* About Job Role */}
            <div className="job-detail__about">
              <h4>About Job Role</h4>
              <p>
                {selectedJob.about.slice(0, 180)}…{" "}
                <a href="#" className="job-detail__about-link">
                  View Detail Job
                </a>
              </p>
            </div>

            {/* CTA */}
            <div className="job-detail__cta">
              <button className="job-detail__apply-btn">Apply Job</button>
              <button className="job-detail__msg-btn" title="Message">
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
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
