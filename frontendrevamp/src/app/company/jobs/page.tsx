"use client";

import { useState } from "react";
import { GridRegular, TextBulletListRegular } from "@fluentui/react-icons";

const JOBS = [
  {
    id: 1,
    title: "Product Designer",
    type: "Full Time",
    location: "Semarang",
    applications: 50,
    new: 12,
    shortlisted: 8,
    interviewed: 3,
    status: "Active",
    posted: "3 days ago",
    expires: "5 days",
    salary: "$200/mo",
    tags: ["UI/UX Designer", "Design Thinking", "Figma"],
  },
  {
    id: 2,
    title: "Visual Designer",
    type: "Full Time",
    location: "Semarang",
    applications: 74,
    new: 8,
    shortlisted: 15,
    interviewed: 6,
    status: "Active",
    posted: "2 days ago",
    expires: "3 days",
    salary: "$90/hr",
    tags: ["3D Design", "Blender", "Illustration"],
  },
  {
    id: 3,
    title: "Senior Interaction Designer",
    type: "Full Time",
    location: "Remote",
    applications: 31,
    new: 5,
    shortlisted: 6,
    interviewed: 2,
    status: "Active",
    posted: "5 days ago",
    expires: "10 days",
    salary: "$150/hr",
    tags: ["UI Designer", "Motion Graphic", "After Effect"],
  },
  {
    id: 4,
    title: "UX Researcher",
    type: "Part Time",
    location: "Semarang",
    applications: 22,
    new: 3,
    shortlisted: 5,
    interviewed: 1,
    status: "Paused",
    posted: "1 week ago",
    expires: "15 days",
    salary: "$80/hr",
    tags: ["User Research", "Miro", "Figma"],
  },
];

export default function CompanyJobsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <>
      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Job Listings</h2>
            <p className="dash-page-header__subtitle">
              Manage your open, paused, and closed positions
            </p>
          </div>
          <div className="dash-page-header__actions">
            <button
              className={`btn btn--sm ${view === "grid" ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setView("grid")}
            >
              <GridRegular width={14} height={14} aria-hidden="true" />
            </button>
            <button
              className={`btn btn--sm ${view === "list" ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setView("list")}
            >
              <TextBulletListRegular
                width={14}
                height={14}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="dash-filter-bar">
          {["All", "Active", "Paused", "Closed"].map((f) => (
            <button
              key={f}
              className={`btn btn--sm ${f === "All" ? "btn--primary" : "btn--outline"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {view === "grid" ? (
          <div className="dash-grid dash-grid--2col">
            {JOBS.map((job) => (
              <div key={job.id} className="dash-card dash-card--clickable">
                <div className="dash-card__header">
                  <div>
                    <div className="job-card__title-row">
                      <div className="dash-card__title">{job.title}</div>
                      <span
                        className={`badge badge--${job.status === "Active" ? "success" : "warning"}`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="dash-card__subtitle">
                      {job.type} · {job.location} · {job.salary}
                    </div>
                  </div>
                  <div className="cell-actions">
                    <button className="btn btn--outline btn--sm">View</button>
                    <button className="btn btn--primary btn--sm">Edit</button>
                  </div>
                </div>
                <div className="dash-card__body">
                  <div className="job-card__tags-row">
                    {job.tags.map((t) => (
                      <span key={t} className="badge badge--gray">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="job-mini-stats">
                    {[
                      {
                        label: "Applied",
                        value: job.applications,
                        color: "#0070f3",
                      },
                      { label: "New", value: job.new, color: "#7928ca" },
                      {
                        label: "Shortlisted",
                        value: job.shortlisted,
                        color: "#0cce6b",
                      },
                      {
                        label: "Interview",
                        value: job.interviewed,
                        color: "#f59e0b",
                      },
                    ].map((s) => (
                      <div key={s.label} className="job-mini-stats__item">
                        <div
                          className="job-mini-stats__value"
                          style={
                            {
                              "--mini-stat-color": s.color,
                            } as React.CSSProperties
                          }
                        >
                          {s.value}
                        </div>
                        <div className="job-mini-stats__label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="job-card-footer">
                    <span>Posted {job.posted}</span>
                    <span
                      className="job-card-footer__expires"
                      style={
                        {
                          "--expires-color":
                            parseInt(job.expires) <= 5 ? "#ff4d4d" : "#9ca3af",
                        } as React.CSSProperties
                      }
                    >
                      Expires in {job.expires}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dash-card">
            <div className="table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Type</th>
                    <th>Applications</th>
                    <th>Shortlisted</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {JOBS.map((job) => (
                    <tr key={job.id}>
                      <td>{job.title}</td>
                      <td>
                        <span className="badge badge--gray">{job.type}</span>
                      </td>
                      <td>{job.applications}</td>
                      <td>{job.shortlisted}</td>
                      <td>
                        <span
                          className={`badge badge--${job.status === "Active" ? "success" : "warning"}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className="expires-cell"
                          style={
                            {
                              "--expires-color":
                                parseInt(job.expires) <= 5
                                  ? "#ff4d4d"
                                  : "#9ca3af",
                            } as React.CSSProperties
                          }
                        >
                          {job.expires}
                        </span>
                      </td>
                      <td>
                        <div className="cell-actions">
                          <button className="btn btn--primary btn--sm">
                            Edit
                          </button>
                          <button className="btn btn--outline btn--sm">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
