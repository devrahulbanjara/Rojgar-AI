"use client";

import type { Resume } from "@/lib/types/resume";
import { fmtDate } from "./resumeUtils";
import {
  CallRegular,
  MailRegular,
  LinkEditRegular,
  GlobeRegular,
  LocationRegular,
  CalendarRegular,
} from "@fluentui/react-icons";

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
              <CallRegular width={12} height={12} aria-hidden="true" />
              {resume.phone}
            </span>
          )}
          {resume.email && (
            <span className="rv-header__contact">
              <MailRegular width={12} height={12} aria-hidden="true" />
              <a href={`mailto:${resume.email}`} className="rv-link">
                {resume.email}
              </a>
            </span>
          )}
          {resume.linkedin_url && (
            <span className="rv-header__contact">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                fill="currentColor"
                className="bi bi-linkedin"
                viewBox="0 0 16 16"
              >
                <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
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
              <GlobeRegular width={12} height={12} aria-hidden="true" />
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
                <GlobeRegular width={12} height={12} aria-hidden="true" />
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
              <LocationRegular width={12} height={12} aria-hidden="true" />
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
                    <CalendarRegular
                      width={11}
                      height={11}
                      aria-hidden="true"
                    />
                    {fmtDate(exp.startDate)} &ndash;{" "}
                    {exp.current ? "Present" : fmtDate(exp.endDate)}
                  </span>
                )}
                {exp.location && (
                  <span className="rv-exp__meta-item">
                    <LocationRegular
                      width={11}
                      height={11}
                      aria-hidden="true"
                    />
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
                    <CalendarRegular
                      width={11}
                      height={11}
                      aria-hidden="true"
                    />
                    {fmtDate(edu.startDate)} &ndash; {fmtDate(edu.endDate)}
                  </span>
                )}
                {edu.location && (
                  <span className="rv-exp__meta-item">
                    <LocationRegular
                      width={11}
                      height={11}
                      aria-hidden="true"
                    />
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
