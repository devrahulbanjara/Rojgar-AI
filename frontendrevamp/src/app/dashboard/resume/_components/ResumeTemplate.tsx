"use client";

import type { Resume } from "@/lib/types/resume";
import { fmtDate } from "./resumeUtils";

// ── Resume document template ───────────────────────────────────────────────
// This renders the actual printable resume HTML. Used in viewer + print.

export default function ResumeTemplate({ resume }: { resume: Resume }) {
  return (
    <div className="rv-doc">
      {/* Header */}
      <div className="rv-header">
        <h1 className="rv-header__name">{resume.fullName || "Your Name"}</h1>
        {resume.headline && (
          <p className="rv-header__headline">{resume.headline}</p>
        )}
        <div className="rv-header__contacts">
          {resume.phone && (
            <span className="rv-header__contact">
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.7 12.4 19.79 19.79 0 0 1 1.63 3.8 2 2 0 0 1 3.6 1.64h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .65 2.59 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.29 6.29l1.93-1.93a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.59.65A2 2 0 0 1 22 16.92z" />
              </svg>
              {resume.phone}
            </span>
          )}
          {resume.email && (
            <span className="rv-header__contact">
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
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <a href={`mailto:${resume.email}`} className="rv-link">
                {resume.email}
              </a>
            </span>
          )}
          {resume.linkedin_url && (
            <span className="rv-header__contact">
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
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              <a
                href={resume.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rv-link"
              >
                LinkedIn
              </a>
            </span>
          )}
          {resume.github_url && (
            <span className="rv-header__contact">
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
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              <a
                href={resume.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rv-link"
              >
                GitHub
              </a>
            </span>
          )}
          {resume.website &&
            resume.website !== resume.linkedin_url &&
            resume.website !== resume.github_url && (
              <span className="rv-header__contact">
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
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <a
                  href={
                    resume.website.startsWith("http")
                      ? resume.website
                      : `https://${resume.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rv-link"
                >
                  Portfolio
                </a>
              </span>
            )}
          {resume.location && (
            <span className="rv-header__contact">
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
              {resume.location}
            </span>
          )}
        </div>
      </div>

      {/* Profile / Summary */}
      {resume.summary && (
        <div className="rv-section">
          <div className="rv-section__heading">Profile</div>
          <p className="rv-section__body">{resume.summary}</p>
        </div>
      )}

      {/* Professional Experience */}
      {resume.experience.length > 0 && (
        <div className="rv-section">
          <div className="rv-section__heading">Professional Experience</div>
          {resume.experience.map((exp) => (
            <div className="rv-exp" key={exp.id}>
              <div className="rv-exp__title">{exp.title}</div>
              {exp.company && (
                <div className="rv-exp__company">{exp.company}</div>
              )}
              <div className="rv-exp__meta">
                {(exp.startDate || exp.endDate || exp.current) && (
                  <span className="rv-exp__meta-item">
                    <svg
                      width="11"
                      height="11"
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
                    {fmtDate(exp.startDate)} &ndash;{" "}
                    {exp.current ? "Present" : fmtDate(exp.endDate)}
                  </span>
                )}
                {exp.location && (
                  <span className="rv-exp__meta-item">
                    <svg
                      width="11"
                      height="11"
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
                    {exp.location}
                  </span>
                )}
              </div>
              {exp.description && (
                <ul className="rv-bullets">
                  {exp.description
                    .split(/\n|(?<=\.)\s+(?=[A-Z])/)
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i}>{line.replace(/^[•\-]\s*/, "").trim()}</li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <div className="rv-section">
          <div className="rv-section__heading">Education</div>
          {resume.education.map((edu) => (
            <div className="rv-edu" key={edu.id}>
              <div className="rv-edu__degree">{edu.degree}</div>
              {edu.institution && (
                <div className="rv-edu__institution">{edu.institution}</div>
              )}
              <div className="rv-exp__meta">
                {(edu.startDate || edu.endDate) && (
                  <span className="rv-exp__meta-item">
                    <svg
                      width="11"
                      height="11"
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
                    {fmtDate(edu.startDate)} &ndash; {fmtDate(edu.endDate)}
                  </span>
                )}
                {edu.location && (
                  <span className="rv-exp__meta-item">
                    <svg
                      width="11"
                      height="11"
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
                    {edu.location}
                  </span>
                )}
                {edu.gpa && (
                  <span className="rv-exp__meta-item">GPA {edu.gpa}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Technical Skills */}
      {resume.skills.length > 0 && (
        <div className="rv-section">
          <div className="rv-section__heading">Technical Skills</div>
          <div className="rv-skills">
            {resume.skills.map((sk) => (
              <span className="rv-skills__chip" key={sk}>
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
