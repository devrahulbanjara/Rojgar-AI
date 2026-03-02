"use client";

import { useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────
type ExperienceEntry = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

type EducationEntry = {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
};

type Resume = {
  id: string;
  name: string;
  updatedAt: string;
  targetRole: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
};

// ── Seed data ──────────────────────────────────────────────────
const PROFILE_DATA = {
  fullName: "Alex Chen",
  headline: "UI/UX Designer",
  email: "alex.chen@email.com",
  phone: "+1 (415) 555-0198",
  location: "San Francisco, CA",
  website: "alexchen.design",
  summary:
    "Creative and detail-oriented UI/UX Designer with 4+ years of experience crafting user-centric digital products. Proficient in Figma, design systems, and user research.",
  experience: [
    {
      id: "e1",
      title: "Senior UI/UX Designer",
      company: "Acme Corp",
      location: "San Francisco, CA",
      startDate: "2022-06",
      endDate: "",
      current: true,
      description:
        "Led end-to-end design for the core product dashboard, increasing user engagement by 32%. Managed a design system used across 6 product teams.",
    },
    {
      id: "e2",
      title: "UI Designer",
      company: "DesignCo",
      location: "Remote",
      startDate: "2020-09",
      endDate: "2022-05",
      current: false,
      description:
        "Designed mobile-first interfaces for fintech clients. Collaborated with engineering to ensure pixel-perfect delivery.",
    },
  ],
  education: [
    {
      id: "ed1",
      degree: "B.S. in Graphic Design",
      institution: "California College of the Arts",
      location: "San Francisco, CA",
      startDate: "2016-09",
      endDate: "2020-05",
      gpa: "3.8",
    },
  ],
  skills: [
    "Figma",
    "Prototyping",
    "User Research",
    "React",
    "CSS",
    "Design Systems",
    "Accessibility",
  ],
};

const INITIAL_RESUMES: Resume[] = [
  {
    id: "r1",
    name: "General Application",
    updatedAt: "Mar 1, 2026",
    targetRole: "UI/UX Designer",
    ...PROFILE_DATA,
  },
  {
    id: "r2",
    name: "Frontend-Focused",
    updatedAt: "Feb 20, 2026",
    targetRole: "Design Engineer",
    fullName: "Alex Chen",
    headline: "Design Engineer",
    email: "alex.chen@email.com",
    phone: "+1 (415) 555-0198",
    location: "San Francisco, CA",
    website: "alexchen.design",
    summary:
      "Design engineer bridging the gap between design and code. Comfortable shipping UI in React and maintaining scalable CSS architectures.",
    experience: [PROFILE_DATA.experience[0]],
    education: PROFILE_DATA.education,
    skills: [
      "React",
      "TypeScript",
      "CSS / SCSS",
      "Figma",
      "Storybook",
      "Design Systems",
    ],
  },
];

// ── Section ids ────────────────────────────────────────────────
const SECTIONS = [
  "Personal",
  "Summary",
  "Experience",
  "Education",
  "Skills",
] as const;
type Section = (typeof SECTIONS)[number];

function uid() {
  return Math.random().toString(36).slice(2);
}

function fmtDate(val: string, fallback = "Present") {
  if (!val) return fallback;
  const [year, month] = val.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

// ── Resume document template ───────────────────────────────────
function ResumeTemplate({ resume }: { resume: Resume }) {
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
          {resume.website && (
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
                href={`https://${resume.website.replace(/^https?:\/\//, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rv-link"
              >
                {resume.website}
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
                    {fmtDate(exp.startDate)} -{" "}
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
                    {fmtDate(edu.startDate)} - {fmtDate(edu.endDate)}
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

// ── Full-screen viewer wrapper ─────────────────────────────────
function ResumeViewer({
  resume,
  onClose,
  onEdit,
}: {
  resume: Resume;
  onClose: () => void;
  onEdit: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${resume.fullName} — Resume</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Lato', sans-serif; font-size: 10pt; color: #111; padding: 40px 48px; }
            .rv-header__name { font-size: 24pt; font-weight: 900; text-transform: uppercase; letter-spacing: .02em; margin-bottom: 4px; }
            .rv-header__headline { font-size: 10pt; margin-bottom: 8px; font-style: italic; color: #444; }
            .rv-header__contacts { display: flex; flex-wrap: wrap; gap: 14px; font-size: 9pt; color: #444; margin-bottom: 6px; }
            .rv-header__contact { display: flex; align-items: center; gap: 4px; }
            .rv-link { color: #111; text-decoration: none; }
            .rv-section { margin-top: 16px; }
            .rv-section__heading { font-size: 10pt; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; border-bottom: 1.5px solid #111; padding-bottom: 3px; margin-bottom: 10px; }
            .rv-section__body { font-size: 9.5pt; line-height: 1.55; color: #333; }
            .rv-exp { margin-bottom: 14px; }
            .rv-exp__title { font-weight: 700; font-size: 10pt; }
            .rv-exp__company { font-weight: 700; font-size: 9pt; color: #555; margin-bottom: 2px; }
            .rv-exp__meta { display: flex; gap: 14px; font-size: 8.5pt; color: #666; margin-top: 2px; margin-bottom: 4px; }
            .rv-exp__meta-item { display: flex; align-items: center; gap: 3px; }
            .rv-bullets { padding-left: 16px; font-size: 9.5pt; line-height: 1.5; color: #333; }
            .rv-bullets li { margin-bottom: 3px; }
            .rv-edu { margin-bottom: 10px; }
            .rv-edu__degree { font-weight: 700; font-size: 10pt; }
            .rv-edu__institution { font-weight: 700; font-size: 9pt; color: #555; }
            .rv-skills { display: flex; flex-wrap: wrap; gap: 6px; }
            .rv-skills__chip { border: 1px solid #ccc; border-radius: 3px; padding: 2px 10px; font-size: 9pt; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  return (
    <div className="rv-overlay">
      <div className="rv-overlay__bar">
        <button className="btn btn--ghost btn--sm" onClick={onClose}>
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
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
        <span className="rv-overlay__title">{resume.name}</span>
        <div className="rv-overlay__actions">
          <button className="btn btn--ghost btn--sm" onClick={handlePrint}>
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
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print / PDF
          </button>
          <button className="btn btn--primary btn--sm" onClick={onEdit}>
            Edit
          </button>
        </div>
      </div>

      <div className="rv-overlay__scroll">
        <div className="rv-page-shadow">
          <div ref={printRef}>
            <ResumeTemplate resume={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}
function ResumeCard({
  resume,
  onView,
  onEdit,
  onDelete,
}: {
  resume: Resume;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="resume-card">
      <div
        className="resume-card__preview"
        onClick={onView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onView()}
      >
        <div className="resume-card__preview-inner">
          <div className="resume-card__preview-name">{resume.fullName}</div>
          <div className="resume-card__preview-headline">{resume.headline}</div>
          <div className="resume-card__preview-divider" />
          <div className="resume-card__preview-body">
            {resume.summary.slice(0, 120)}…
          </div>
        </div>
      </div>
      <div className="resume-card__info">
        <div className="resume-card__name">{resume.name}</div>
        <div className="resume-card__meta">
          <span>{resume.targetRole}</span>
          <span className="resume-card__sep">·</span>
          <span>Updated {resume.updatedAt}</span>
        </div>
        <div className="resume-card__actions">
          <button className="btn btn--outline btn--sm" onClick={onView}>
            View
          </button>
          <button className="btn btn--primary btn--sm" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn--accent btn--sm" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Editor component ───────────────────────────────────────────
function ResumeEditor({
  resume,
  onClose,
  onPreview,
  onChange,
}: {
  resume: Resume;
  onClose: () => void;
  onPreview: () => void;
  onChange: (r: Resume) => void;
}) {
  const [activeSection, setActiveSection] = useState<Section>("Personal");
  const [draft, setDraft] = useState<Resume>({ ...resume });

  function update<K extends keyof Resume>(key: K, value: Resume[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      onChange(next);
      return next;
    });
  }

  function updateExp(
    id: string,
    field: keyof ExperienceEntry,
    value: string | boolean,
  ) {
    const updated = draft.experience.map((e) =>
      e.id === id ? { ...e, [field]: value } : e,
    );
    update("experience", updated);
  }

  function addExp() {
    const entry: ExperienceEntry = {
      id: uid(),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    update("experience", [...draft.experience, entry]);
  }

  function removeExp(id: string) {
    update(
      "experience",
      draft.experience.filter((e) => e.id !== id),
    );
  }

  function updateEdu(id: string, field: keyof EducationEntry, value: string) {
    const updated = draft.education.map((e) =>
      e.id === id ? { ...e, [field]: value } : e,
    );
    update("education", updated);
  }

  function addEdu() {
    const entry: EducationEntry = {
      id: uid(),
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
    };
    update("education", [...draft.education, entry]);
  }

  function removeEdu(id: string) {
    update(
      "education",
      draft.education.filter((e) => e.id !== id),
    );
  }

  function addSkill(sk: string) {
    if (sk.trim() && !draft.skills.includes(sk.trim())) {
      update("skills", [...draft.skills, sk.trim()]);
    }
  }

  function removeSkill(sk: string) {
    update(
      "skills",
      draft.skills.filter((s) => s !== sk),
    );
  }

  return (
    <div className="resume-editor">
      {/* Editor topbar */}
      <div className="resume-editor__topbar">
        <button className="btn btn--ghost btn--sm" onClick={onClose}>
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
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Resumes
        </button>
        <div className="resume-editor__title">{draft.name}</div>
        <div className="resume-editor__topbar-actions">
          <button className="btn btn--ghost btn--sm" onClick={onPreview}>
            Preview
          </button>
          <button className="btn btn--primary btn--sm">Save</button>
        </div>
      </div>

      <div className="resume-editor__body">
        {/* Section nav */}
        <nav className="resume-editor__nav">
          {SECTIONS.map((s) => (
            <button
              key={s}
              className={`resume-editor__nav-item${activeSection === s ? " resume-editor__nav-item--active" : ""}`}
              onClick={() => setActiveSection(s)}
            >
              {s}
            </button>
          ))}
          <div className="resume-editor__nav-divider" />
          <div className="resume-editor__nav-label">Import from Profile</div>
          <button
            className="btn btn--outline btn--sm resume-editor__import-btn"
            onClick={() =>
              setDraft({
                ...draft,
                fullName: PROFILE_DATA.fullName,
                headline: PROFILE_DATA.headline,
                email: PROFILE_DATA.email,
                phone: PROFILE_DATA.phone,
                location: PROFILE_DATA.location,
                website: PROFILE_DATA.website,
                summary: PROFILE_DATA.summary,
                experience: PROFILE_DATA.experience,
                education: PROFILE_DATA.education,
                skills: PROFILE_DATA.skills,
              })
            }
          >
            Import All Fields
          </button>
        </nav>

        {/* Section form */}
        <div className="resume-editor__form">
          {activeSection === "Personal" && (
            <div className="resume-section">
              <div className="resume-section__title">Personal Information</div>
              <div className="resume-form-grid">
                {(
                  [
                    ["fullName", "Full Name", "text"],
                    ["headline", "Professional Headline", "text"],
                    ["email", "Email", "email"],
                    ["phone", "Phone", "tel"],
                    ["location", "Location", "text"],
                    ["website", "Website / LinkedIn", "url"],
                  ] as [keyof Resume, string, string][]
                ).map(([field, label, type]) => (
                  <div className="resume-field" key={field}>
                    <label className="resume-field__label">{label}</label>
                    <input
                      className="resume-field__input"
                      type={type}
                      value={draft[field] as string}
                      onChange={(e) => update(field, e.target.value)}
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "Summary" && (
            <div className="resume-section">
              <div className="resume-section__title">Professional Summary</div>
              <div className="resume-field">
                <label className="resume-field__label">Summary</label>
                <textarea
                  className="resume-field__textarea"
                  rows={6}
                  value={draft.summary}
                  onChange={(e) => update("summary", e.target.value)}
                  placeholder="Write a compelling summary of your professional background..."
                />
              </div>
            </div>
          )}

          {activeSection === "Experience" && (
            <div className="resume-section">
              <div className="resume-section__header">
                <div className="resume-section__title">Work Experience</div>
                <button className="btn btn--outline btn--sm" onClick={addExp}>
                  + Add Experience
                </button>
              </div>
              {draft.experience.map((exp) => (
                <div className="resume-entry" key={exp.id}>
                  <div className="resume-entry__header">
                    <div className="resume-entry__title">
                      {exp.title || "New Entry"}
                    </div>
                    <button
                      className="resume-entry__remove"
                      onClick={() => removeExp(exp.id)}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                  <div className="resume-form-grid">
                    <div className="resume-field">
                      <label className="resume-field__label">Job Title</label>
                      <input
                        className="resume-field__input"
                        value={exp.title}
                        onChange={(e) =>
                          updateExp(exp.id, "title", e.target.value)
                        }
                        placeholder="Job Title"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Company</label>
                      <input
                        className="resume-field__input"
                        value={exp.company}
                        onChange={(e) =>
                          updateExp(exp.id, "company", e.target.value)
                        }
                        placeholder="Company"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Location</label>
                      <input
                        className="resume-field__input"
                        value={exp.location}
                        onChange={(e) =>
                          updateExp(exp.id, "location", e.target.value)
                        }
                        placeholder="Location"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Start Date</label>
                      <input
                        className="resume-field__input"
                        type="month"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExp(exp.id, "startDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">End Date</label>
                      <input
                        className="resume-field__input"
                        type="month"
                        value={exp.endDate}
                        disabled={exp.current}
                        onChange={(e) =>
                          updateExp(exp.id, "endDate", e.target.value)
                        }
                        placeholder="Present"
                      />
                    </div>
                    <div className="resume-field resume-field--checkbox">
                      <label className="resume-field__checkbox-label">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) =>
                            updateExp(exp.id, "current", e.target.checked)
                          }
                        />
                        Currently working here
                      </label>
                    </div>
                  </div>
                  <div className="resume-field">
                    <label className="resume-field__label">Description</label>
                    <textarea
                      className="resume-field__textarea"
                      rows={4}
                      value={exp.description}
                      onChange={(e) =>
                        updateExp(exp.id, "description", e.target.value)
                      }
                      placeholder="Describe your responsibilities and achievements..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "Education" && (
            <div className="resume-section">
              <div className="resume-section__header">
                <div className="resume-section__title">Education</div>
                <button className="btn btn--outline btn--sm" onClick={addEdu}>
                  + Add Education
                </button>
              </div>
              {draft.education.map((edu) => (
                <div className="resume-entry" key={edu.id}>
                  <div className="resume-entry__header">
                    <div className="resume-entry__title">
                      {edu.degree || "New Entry"}
                    </div>
                    <button
                      className="resume-entry__remove"
                      onClick={() => removeEdu(edu.id)}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                  <div className="resume-form-grid">
                    <div className="resume-field">
                      <label className="resume-field__label">
                        Degree / Certification
                      </label>
                      <input
                        className="resume-field__input"
                        value={edu.degree}
                        onChange={(e) =>
                          updateEdu(edu.id, "degree", e.target.value)
                        }
                        placeholder="B.S. in Computer Science"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Institution</label>
                      <input
                        className="resume-field__input"
                        value={edu.institution}
                        onChange={(e) =>
                          updateEdu(edu.id, "institution", e.target.value)
                        }
                        placeholder="University Name"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Location</label>
                      <input
                        className="resume-field__input"
                        value={edu.location}
                        onChange={(e) =>
                          updateEdu(edu.id, "location", e.target.value)
                        }
                        placeholder="City, State"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Start Date</label>
                      <input
                        className="resume-field__input"
                        type="month"
                        value={edu.startDate}
                        onChange={(e) =>
                          updateEdu(edu.id, "startDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">End Date</label>
                      <input
                        className="resume-field__input"
                        type="month"
                        value={edu.endDate}
                        onChange={(e) =>
                          updateEdu(edu.id, "endDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">
                        GPA (optional)
                      </label>
                      <input
                        className="resume-field__input"
                        value={edu.gpa}
                        onChange={(e) =>
                          updateEdu(edu.id, "gpa", e.target.value)
                        }
                        placeholder="3.8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "Skills" && (
            <SkillsSection
              skills={draft.skills}
              onAdd={addSkill}
              onRemove={removeSkill}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SkillsSection({
  skills,
  onAdd,
  onRemove,
}: {
  skills: string[];
  onAdd: (s: string) => void;
  onRemove: (s: string) => void;
}) {
  const [input, setInput] = useState("");

  function handleAdd() {
    if (input.trim()) {
      onAdd(input.trim());
      setInput("");
    }
  }

  return (
    <div className="resume-section">
      <div className="resume-section__title">Skills</div>
      <div className="skills-input-row">
        <input
          className="resume-field__input"
          placeholder="Add a skill (e.g. Figma)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button className="btn btn--primary btn--sm" onClick={handleAdd}>
          Add
        </button>
      </div>
      <div className="resume-skills-wrap">
        {skills.map((sk) => (
          <div className="resume-skill-chip" key={sk}>
            {sk}
            <button
              className="resume-skill-chip__remove"
              onClick={() => onRemove(sk)}
              aria-label={`Remove ${sk}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>(INITIAL_RESUMES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const editingResume = resumes.find((r) => r.id === editingId) ?? null;
  const viewingResume = resumes.find((r) => r.id === viewingId) ?? null;

  function createNew() {
    const id = uid();
    const newResume: Resume = {
      id,
      name: `Resume ${resumes.length + 1}`,
      updatedAt: "Just now",
      targetRole: "",
      fullName: PROFILE_DATA.fullName,
      headline: PROFILE_DATA.headline,
      email: PROFILE_DATA.email,
      phone: PROFILE_DATA.phone,
      location: PROFILE_DATA.location,
      website: PROFILE_DATA.website,
      summary: "",
      experience: [],
      education: [],
      skills: [],
    };
    setResumes((prev) => [...prev, newResume]);
    setEditingId(id);
  }

  function deleteResume(id: string) {
    setResumes((prev) => prev.filter((r) => r.id !== id));
    if (editingId === id) setEditingId(null);
    if (viewingId === id) setViewingId(null);
  }

  function updateResume(updated: Resume) {
    setResumes((prev) =>
      prev.map((r) =>
        r.id === updated.id ? { ...updated, updatedAt: "Just now" } : r,
      ),
    );
  }

  if (viewingResume && !editingResume) {
    return (
      <ResumeViewer
        resume={viewingResume}
        onClose={() => setViewingId(null)}
        onEdit={() => {
          setViewingId(null);
          setEditingId(viewingResume.id);
        }}
      />
    );
  }

  if (editingResume) {
    return (
      <div className="dash-content container">
        <ResumeEditor
          resume={editingResume}
          onClose={() => setEditingId(null)}
          onPreview={() => {
            setEditingId(null);
            setViewingId(editingResume.id);
          }}
          onChange={updateResume}
        />
      </div>
    );
  }

  return (
    <div className="dash-content container">
      {/* Page Header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Resumes</h2>
          <p className="dash-page-header__subtitle">
            Build tailored resumes for different job applications.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <button className="btn btn--primary" onClick={createNew}>
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
            New Resume
          </button>
        </div>
      </div>

      {/* Resumes grid */}
      {resumes.length === 0 ? (
        <div className="resume-empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>No resumes yet. Create your first one.</p>
          <button className="btn btn--primary" onClick={createNew}>
            Create Resume
          </button>
        </div>
      ) : (
        <div className="resume-grid">
          {resumes.map((r) => (
            <ResumeCard
              key={r.id}
              resume={r}
              onView={() => setViewingId(r.id)}
              onEdit={() => setEditingId(r.id)}
              onDelete={() => deleteResume(r.id)}
            />
          ))}
          <button className="resume-add-card" onClick={createNew}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create New Resume</span>
          </button>
        </div>
      )}
    </div>
  );
}
