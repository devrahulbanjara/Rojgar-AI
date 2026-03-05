"use client";

import { useState } from "react";

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

type ProfileData = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  about: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
};

// ── Initial data ───────────────────────────────────────────────
const INITIAL_PROFILE: ProfileData = {
  fullName: "Alex Chen",
  headline: "UI/UX Designer",
  email: "alex.chen@email.com",
  phone: "+1 (415) 555-0198",
  location: "San Francisco, CA",
  website: "alexchen.design",
  about:
    "Creative and detail-oriented UI/UX Designer with 4+ years of experience crafting user-centric digital products. Proficient in Figma, design systems, and user research. Passionate about building accessible, beautiful interfaces that solve real problems.",
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
    "CSS / SCSS",
    "Design Systems",
    "Accessibility",
    "Wireframing",
    "Motion Design",
  ],
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function formatDate(value: string) {
  if (!value) return "Present";
  const [year, month] = value.split("-");
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

// ── Profile sections ───────────────────────────────────────────
const SECTIONS = ["Overview", "Experience", "Education", "Skills"] as const;
type Section = (typeof SECTIONS)[number];

// ── Main page ──────────────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [activeSection, setActiveSection] = useState<Section>("Overview");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");

  function updateField<K extends keyof ProfileData>(
    key: K,
    value: ProfileData[K],
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  // ── Experience ────────────────────────────────────────────────
  function updateExp(
    id: string,
    field: keyof ExperienceEntry,
    value: string | boolean,
  ) {
    updateField(
      "experience",
      profile.experience.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    );
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
    updateField("experience", [...profile.experience, entry]);
    setEditingSection(entry.id);
  }
  function removeExp(id: string) {
    updateField(
      "experience",
      profile.experience.filter((e) => e.id !== id),
    );
    if (editingSection === id) setEditingSection(null);
  }

  // ── Education ────────────────────────────────────────────────
  function updateEdu(id: string, field: keyof EducationEntry, value: string) {
    updateField(
      "education",
      profile.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    );
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
    updateField("education", [...profile.education, entry]);
    setEditingSection(entry.id);
  }
  function removeEdu(id: string) {
    updateField(
      "education",
      profile.education.filter((e) => e.id !== id),
    );
    if (editingSection === id) setEditingSection(null);
  }

  // ── Skills ───────────────────────────────────────────────────
  function addSkill() {
    const s = skillInput.trim();
    if (s && !profile.skills.includes(s)) {
      updateField("skills", [...profile.skills, s]);
      setSkillInput("");
    }
  }
  function removeSkill(sk: string) {
    updateField(
      "skills",
      profile.skills.filter((s) => s !== sk),
    );
  }

  return (
    <div className="dash-content container">
      {/* Page Header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Profile</h2>
          <p className="dash-page-header__subtitle">
            Build your professional profile — this data powers your resumes and
            applications.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className="page-header-hint">
            Changes are saved automatically
          </span>
        </div>
      </div>

      <div className="profile-layout">
        {/* Left: avatar & summary card */}
        <aside className="profile-layout__aside">
          <div className="profile-aside-card">
            <div className="profile-aside-card__avatar">
              {profile.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="profile-aside-card__name">{profile.fullName}</div>
            <div className="profile-aside-card__headline">
              {profile.headline}
            </div>
            <div className="profile-aside-card__location">
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
              {profile.location}
            </div>
            <div className="profile-aside-card__divider" />
            <div className="profile-aside-card__stats">
              <div className="profile-aside-card__stat">
                <div className="profile-aside-card__stat-value">
                  {profile.experience.length}
                </div>
                <div className="profile-aside-card__stat-label">Roles</div>
              </div>
              <div className="profile-aside-card__stat">
                <div className="profile-aside-card__stat-value">
                  {profile.education.length}
                </div>
                <div className="profile-aside-card__stat-label">Degrees</div>
              </div>
              <div className="profile-aside-card__stat">
                <div className="profile-aside-card__stat-value">
                  {profile.skills.length}
                </div>
                <div className="profile-aside-card__stat-label">Skills</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: section tabs + content */}
        <div className="profile-layout__main">
          {/* Section tabs */}
          <div className="profile-tabs">
            {SECTIONS.map((s) => (
              <button
                key={s}
                className={`profile-tabs__tab${activeSection === s ? " profile-tabs__tab--active" : ""}`}
                onClick={() => setActiveSection(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeSection === "Overview" && (
            <div className="profile-section">
              {/* Contact & personal info */}
              <div className="profile-block">
                <div className="profile-block__header">
                  <div className="profile-block__title">
                    Personal Information
                  </div>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      setEditingSection(
                        editingSection === "personal" ? null : "personal",
                      )
                    }
                  >
                    {editingSection === "personal" ? "Done" : "Edit"}
                  </button>
                </div>
                {editingSection === "personal" ? (
                  <div className="resume-form-grid">
                    {(
                      [
                        ["fullName", "Full Name", "text"],
                        ["headline", "Professional Headline", "text"],
                        ["email", "Email", "email"],
                        ["phone", "Phone", "tel"],
                        ["location", "Location", "text"],
                        ["website", "Website / LinkedIn", "url"],
                      ] as [keyof ProfileData, string, string][]
                    ).map(([field, label, type]) => (
                      <div className="resume-field" key={field}>
                        <label className="resume-field__label">{label}</label>
                        <input
                          className="resume-field__input"
                          type={type}
                          value={profile[field] as string}
                          onChange={(e) => updateField(field, e.target.value)}
                          placeholder={label}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    {[
                      { label: "Full Name", value: profile.fullName },
                      { label: "Headline", value: profile.headline },
                      { label: "Email", value: profile.email },
                      { label: "Phone", value: profile.phone },
                      { label: "Location", value: profile.location },
                      { label: "Website", value: profile.website },
                    ].map(({ label, value }) => (
                      <div className="profile-info-item" key={label}>
                        <span className="profile-info-item__label">
                          {label}
                        </span>
                        <span className="profile-info-item__value">
                          {value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* About / Summary */}
              <div className="profile-block">
                <div className="profile-block__header">
                  <div className="profile-block__title">About / Summary</div>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      setEditingSection(
                        editingSection === "about" ? null : "about",
                      )
                    }
                  >
                    {editingSection === "about" ? "Done" : "Edit"}
                  </button>
                </div>
                {editingSection === "about" ? (
                  <textarea
                    className="resume-field__textarea"
                    rows={6}
                    value={profile.about}
                    onChange={(e) => updateField("about", e.target.value)}
                    placeholder="Write a compelling professional summary..."
                  />
                ) : (
                  <p className="profile-about-text">
                    {profile.about || "No summary added yet."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {activeSection === "Experience" && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">Work Experience</div>
                <button className="btn btn--outline btn--sm" onClick={addExp}>
                  + Add
                </button>
              </div>

              {profile.experience.length === 0 && (
                <div className="profile-empty">No experience added yet.</div>
              )}

              {profile.experience.map((exp) => (
                <div className="profile-block" key={exp.id}>
                  <div className="profile-block__header">
                    <div className="profile-block__title">
                      {exp.title || "Untitled Role"}
                      {exp.company && (
                        <span className="profile-block__sub">
                          {" "}
                          · {exp.company}
                        </span>
                      )}
                    </div>
                    <div className="profile-block__header-actions">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          setEditingSection(
                            editingSection === exp.id ? null : exp.id,
                          )
                        }
                      >
                        {editingSection === exp.id ? "Done" : "Edit"}
                      </button>
                      <button
                        className="btn btn--accent btn--sm"
                        onClick={() => removeExp(exp.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {editingSection === exp.id ? (
                    <>
                      <div className="resume-form-grid">
                        <div className="resume-field">
                          <label className="resume-field__label">
                            Job Title
                          </label>
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
                          <label className="resume-field__label">
                            Location
                          </label>
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
                          <label className="resume-field__label">
                            Start Date
                          </label>
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
                          <label className="resume-field__label">
                            End Date
                          </label>
                          <input
                            className="resume-field__input"
                            type="month"
                            value={exp.endDate}
                            disabled={exp.current}
                            onChange={(e) =>
                              updateExp(exp.id, "endDate", e.target.value)
                            }
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
                        <label className="resume-field__label">
                          Description
                        </label>
                        <textarea
                          className="resume-field__textarea"
                          rows={4}
                          value={exp.description}
                          onChange={(e) =>
                            updateExp(exp.id, "description", e.target.value)
                          }
                          placeholder="Describe your role, achievements..."
                        />
                      </div>
                    </>
                  ) : (
                    <div className="profile-exp-view">
                      <div className="profile-exp-view__meta">
                        {exp.location && <span>{exp.location}</span>}
                        {(exp.startDate || exp.endDate || exp.current) && (
                          <span>
                            {formatDate(exp.startDate)} —{" "}
                            {exp.current ? "Present" : formatDate(exp.endDate)}
                          </span>
                        )}
                        {exp.current && (
                          <span className="badge badge--success">Current</span>
                        )}
                      </div>
                      {exp.description && (
                        <p className="profile-exp-view__desc">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {activeSection === "Education" && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">Education</div>
                <button className="btn btn--outline btn--sm" onClick={addEdu}>
                  + Add
                </button>
              </div>

              {profile.education.length === 0 && (
                <div className="profile-empty">No education added yet.</div>
              )}

              {profile.education.map((edu) => (
                <div className="profile-block" key={edu.id}>
                  <div className="profile-block__header">
                    <div className="profile-block__title">
                      {edu.degree || "Untitled Degree"}
                      {edu.institution && (
                        <span className="profile-block__sub">
                          {" "}
                          · {edu.institution}
                        </span>
                      )}
                    </div>
                    <div className="profile-block__header-actions">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          setEditingSection(
                            editingSection === edu.id ? null : edu.id,
                          )
                        }
                      >
                        {editingSection === edu.id ? "Done" : "Edit"}
                      </button>
                      <button
                        className="btn btn--accent btn--sm"
                        onClick={() => removeEdu(edu.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {editingSection === edu.id ? (
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
                          placeholder="B.S. Computer Science"
                        />
                      </div>
                      <div className="resume-field">
                        <label className="resume-field__label">
                          Institution
                        </label>
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
                        <label className="resume-field__label">
                          Start Date
                        </label>
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
                  ) : (
                    <div className="profile-exp-view">
                      <div className="profile-exp-view__meta">
                        {edu.location && <span>{edu.location}</span>}
                        {(edu.startDate || edu.endDate) && (
                          <span>
                            {formatDate(edu.startDate)} —{" "}
                            {formatDate(edu.endDate)}
                          </span>
                        )}
                        {edu.gpa && <span>GPA {edu.gpa}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {activeSection === "Skills" && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">Skills</div>
              </div>
              <div className="profile-block">
                <div className="skills-input-row">
                  <input
                    className="resume-field__input"
                    placeholder="Add a skill (e.g. Figma) and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={addSkill}
                  >
                    Add
                  </button>
                </div>
                <div className="resume-skills-wrap">
                  {profile.skills.map((sk) => (
                    <div className="resume-skill-chip" key={sk}>
                      {sk}
                      <button
                        className="resume-skill-chip__remove"
                        onClick={() => removeSkill(sk)}
                        aria-label={`Remove ${sk}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {profile.skills.length === 0 && (
                  <div className="profile-empty">No skills added yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
