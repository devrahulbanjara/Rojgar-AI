"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import Loader from "@/components/common/Loader";
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  type CandidateProfileData,
  type UpdateProfileRequest,
} from "@/store/services/profileApi";
import { DocumentRegular, LocationRegular } from "@fluentui/react-icons";

// ── Local form types ───────────────────────────────────────────

type FormExperience = {
  /** Client-side stable key for list rendering. */
  _key: string;
  title: string;
  company_name: string;
  /** "YYYY-MM" format used by <input type="month"> */
  startDate: string;
  endDate: string;
  /** When true, end_date is sent as null to the API. */
  current: boolean;
  /** Multi-line text; each non-empty line becomes one item in description[]. */
  description: string;
};

type FormEducation = {
  _key: string;
  institution: string;
  degree: string;
  field_of_study: string;
  startDate: string;
  endDate: string;
};

type FormProfile = {
  headline: string;
  summary: string;
  phone: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  /** Stored as string so the number input works without parse errors. */
  years_of_experience: string;
  experiences: FormExperience[];
  educations: FormEducation[];
  skills: string[];
};

// ── Helpers ────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2);
}

/** "YYYY-MM-DD" → "YYYY-MM" suitable for <input type="month">. Null → "". */
function parseApiDate(d: string | null | undefined): string {
  if (!d) return "";
  return d.slice(0, 7);
}

/** "YYYY-MM" → "YYYY-MM-01" for the API. Empty string → null. */
function toApiDate(d: string): string | null {
  return d ? `${d}-01` : null;
}

/** string[] → textarea value (one per line). */
function descToText(desc: string[]): string {
  return desc.join("\n");
}

/** textarea value → string[] (filter blank lines). */
function textToDesc(text: string): string[] {
  return text.split("\n").filter((l) => l.trim().length > 0);
}

/** "YYYY-MM" → "Jan 2024" display label. "" → "Present". */
function formatDate(value: string): string {
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

/** Map API profile data → local form state. */
function apiToForm(data: CandidateProfileData): FormProfile {
  return {
    headline: data.headline ?? "",
    summary: data.summary ?? "",
    phone: data.phone ?? "",
    location: data.location ?? "",
    linkedin_url: data.linkedin_url ?? "",
    github_url: data.github_url ?? "",
    portfolio_url: data.portfolio_url ?? "",
    years_of_experience: data.years_of_experience?.toString() ?? "",
    experiences: data.experiences.map((e) => ({
      _key: e.id ?? uid(),
      title: e.title,
      company_name: e.company_name,
      startDate: parseApiDate(e.start_date),
      endDate: parseApiDate(e.end_date),
      current: !e.end_date,
      description: descToText(e.description),
    })),
    educations: data.educations.map((e) => ({
      _key: e.id ?? uid(),
      institution: e.institution,
      degree: e.degree ?? "",
      field_of_study: e.field_of_study ?? "",
      startDate: parseApiDate(e.start_date),
      endDate: parseApiDate(e.end_date),
    })),
    skills: data.skills.map((s) => s.skill_name),
  };
}

/** Map local form state → PUT /profiles/me request body. */
function formToApiUpdate(form: FormProfile): UpdateProfileRequest {
  return {
    headline: form.headline || null,
    summary: form.summary || null,
    phone: form.phone || null,
    location: form.location || null,
    linkedin_url: form.linkedin_url || null,
    github_url: form.github_url || null,
    portfolio_url: form.portfolio_url || null,
    years_of_experience: form.years_of_experience
      ? parseInt(form.years_of_experience, 10)
      : null,
    experiences: form.experiences.map((e) => ({
      company_name: e.company_name,
      title: e.title,
      start_date: toApiDate(e.startDate),
      end_date: e.current ? null : toApiDate(e.endDate),
      description: textToDesc(e.description),
    })),
    educations: form.educations.map((e) => ({
      institution: e.institution,
      degree: e.degree || null,
      field_of_study: e.field_of_study || null,
      start_date: toApiDate(e.startDate),
      end_date: toApiDate(e.endDate),
    })),
    skills: form.skills.map((s) => ({ skill_name: s })),
  };
}

const EMPTY_FORM: FormProfile = {
  headline: "",
  summary: "",
  phone: "",
  location: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
  years_of_experience: "",
  experiences: [],
  educations: [],
  skills: [],
};

// ── Section tabs definition ────────────────────────────────────

const SECTIONS = ["Overview", "Experience", "Education", "Skills"] as const;
type Section = (typeof SECTIONS)[number];

// ════════════════════════════════════════════════════════════
// Main page component
// ════════════════════════════════════════════════════════════

export default function ProfilePage() {
  // ── Auth user (name / email come from auth, not from profile API) ──────
  const user = useAppSelector((state) => state.auth.user);

  // ── RTK Query ───────────────────────────────────────────────────────────
  const {
    data: profileResp,
    isLoading,
    isError,
    refetch,
  } = useGetMyProfileQuery();

  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  // ── Local form state ─────────────────────────────────────────────────────
  const [form, setForm] = useState<FormProfile>(EMPTY_FORM);
  const [activeSection, setActiveSection] = useState<Section>("Overview");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Populate local form when API data arrives.
  useEffect(() => {
    if (profileResp?.data) {
      setForm(apiToForm(profileResp.data));
    }
  }, [profileResp]);

  // ── Save helpers ─────────────────────────────────────────────────────────

  const saveProfile = useCallback(
    async (targetForm?: FormProfile) => {
      setSaveError(null);
      setSaveSuccess(false);
      try {
        await updateProfile(formToApiUpdate(targetForm ?? form)).unwrap();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (err: unknown) {
        const msg =
          (err as { data?: { message?: string } })?.data?.message ??
          "Failed to save. Please try again.";
        setSaveError(msg);
      }
    },
    [form, updateProfile],
  );

  async function finishEditing(key: string, latestForm?: FormProfile) {
    void key;
    setEditingSection(null);
    await saveProfile(latestForm);
  }

  // ── Generic field setter ─────────────────────────────────────────────────

  function set<K extends keyof FormProfile>(key: K, value: FormProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Experience helpers ────────────────────────────────────────────────────

  function updateExp(
    k: string,
    field: keyof FormExperience,
    value: string | boolean,
  ) {
    set(
      "experiences",
      form.experiences.map((e) =>
        e._key === k ? { ...e, [field]: value } : e,
      ),
    );
  }

  function addExp() {
    const entry: FormExperience = {
      _key: uid(),
      title: "",
      company_name: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    set("experiences", [...form.experiences, entry]);
    setEditingSection(entry._key);
  }

  async function removeExp(k: string) {
    const next = form.experiences.filter((e) => e._key !== k);
    if (editingSection === k) setEditingSection(null);
    const nextForm = { ...form, experiences: next };
    setForm(nextForm);
    await saveProfile(nextForm);
  }

  // ── Education helpers ─────────────────────────────────────────────────────

  function updateEdu(k: string, field: keyof FormEducation, value: string) {
    set(
      "educations",
      form.educations.map((e) => (e._key === k ? { ...e, [field]: value } : e)),
    );
  }

  function addEdu() {
    const entry: FormEducation = {
      _key: uid(),
      institution: "",
      degree: "",
      field_of_study: "",
      startDate: "",
      endDate: "",
    };
    set("educations", [...form.educations, entry]);
    setEditingSection(entry._key);
  }

  async function removeEdu(k: string) {
    const next = form.educations.filter((e) => e._key !== k);
    if (editingSection === k) setEditingSection(null);
    const nextForm = { ...form, educations: next };
    setForm(nextForm);
    await saveProfile(nextForm);
  }

  // ── Skills helpers ────────────────────────────────────────────────────────

  function addSkill() {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) return;
    const next = [...form.skills, s];
    setSkillInput("");
    const nextForm = { ...form, skills: next };
    setForm(nextForm);
    saveProfile(nextForm);
  }

  function removeSkill(sk: string) {
    const next = form.skills.filter((s) => s !== sk);
    const nextForm = { ...form, skills: next };
    setForm(nextForm);
    saveProfile(nextForm);
  }

  // ── Derived display values ────────────────────────────────────────────────

  const displayName = user?.full_name ?? "—";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="dash-content container">
        <div className="profile-loading">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dash-content container">
        <div className="profile-error">
          <p>Failed to load profile.</p>
          <button className="btn btn--primary btn--sm" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusHint = isSaving
    ? "Saving…"
    : saveError
      ? saveError
      : saveSuccess
        ? "Saved ✓"
        : "Changes saved automatically";

  const statusClass =
    "page-header-hint" +
    (saveError ? " page-header-hint--error" : "") +
    (saveSuccess ? " page-header-hint--success" : "");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="dash-content container">
      {/* ── Page header ── */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Profile</h2>
          <p className="dash-page-header__subtitle">
            Build your professional profile — this data powers your resumes and
            applications.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className={statusClass}>{statusHint}</span>
          <Link href="/dashboard/resume" className="btn btn--outline btn--sm">
            <DocumentRegular width={13} height={13} aria-hidden="true" />
            My Resumes
          </Link>
        </div>
      </div>

      <div className="profile-layout">
        {/* ── Aside: avatar + summary card ── */}
        <aside className="profile-layout__aside">
          <div className="profile-aside-card">
            <div className="profile-aside-card__avatar">{initials}</div>
            <div className="profile-aside-card__name">{displayName}</div>
            <div className="profile-aside-card__headline">
              {form.headline || "No headline set"}
            </div>
            {form.location && (
              <div className="profile-aside-card__location">
                <LocationRegular width={13} height={13} aria-hidden="true" />
                {form.location}
              </div>
            )}
            <div className="profile-aside-card__divider" />
            <div className="profile-aside-card__stats">
              <div className="profile-aside-card__stat">
                <div className="profile-aside-card__stat-value">
                  {form.experiences.length}
                </div>
                <div className="profile-aside-card__stat-label">Roles</div>
              </div>
              <div className="profile-aside-card__stat">
                <div className="profile-aside-card__stat-value">
                  {form.educations.length}
                </div>
                <div className="profile-aside-card__stat-label">Degrees</div>
              </div>
              <div className="profile-aside-card__stat">
                <div className="profile-aside-card__stat-value">
                  {form.skills.length}
                </div>
                <div className="profile-aside-card__stat-label">Skills</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main: tabs + sections ── */}
        <div className="profile-layout__main">
          {/* Tabs */}
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

          {/* ── Overview ──────────────────────────────────────────────── */}
          {activeSection === "Overview" && (
            <div className="profile-section">
              {/* Personal info block */}
              <div className="profile-block">
                <div className="profile-block__header">
                  <div className="profile-block__title">
                    Personal Information
                  </div>
                  <button
                    className="btn btn--primary btn--sm"
                    disabled={isSaving}
                    onClick={() =>
                      editingSection === "personal"
                        ? finishEditing("personal")
                        : setEditingSection("personal")
                    }
                  >
                    {editingSection === "personal" ? "Save" : "Edit"}
                  </button>
                </div>

                {editingSection === "personal" ? (
                  <div className="resume-form-grid">
                    {(
                      [
                        ["headline", "Professional Headline", "text"],
                        ["phone", "Phone", "tel"],
                        ["location", "Location", "text"],
                        [
                          "years_of_experience",
                          "Years of Experience",
                          "number",
                        ],
                        ["linkedin_url", "LinkedIn URL", "url"],
                        ["github_url", "GitHub URL", "url"],
                        ["portfolio_url", "Portfolio / Website URL", "url"],
                      ] as [keyof FormProfile, string, string][]
                    ).map(([field, label, type]) => (
                      <div className="resume-field" key={field}>
                        <label className="resume-field__label">{label}</label>
                        <input
                          className="resume-field__input"
                          type={type}
                          value={form[field] as string}
                          onChange={(e) => set(field, e.target.value)}
                          placeholder={label}
                          min={type === "number" ? 0 : undefined}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    {[
                      { label: "Full Name", value: displayName },
                      { label: "Email", value: user?.email ?? "—" },
                      { label: "Headline", value: form.headline },
                      { label: "Phone", value: form.phone },
                      { label: "Location", value: form.location },
                      {
                        label: "Years of Experience",
                        value: form.years_of_experience,
                      },
                      { label: "LinkedIn", value: form.linkedin_url },
                      { label: "GitHub", value: form.github_url },
                      { label: "Portfolio", value: form.portfolio_url },
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

              {/* Summary block */}
              <div className="profile-block">
                <div className="profile-block__header">
                  <div className="profile-block__title">
                    Professional Summary
                  </div>
                  <button
                    className="btn btn--primary btn--sm"
                    disabled={isSaving}
                    onClick={() =>
                      editingSection === "summary"
                        ? finishEditing("summary")
                        : setEditingSection("summary")
                    }
                  >
                    {editingSection === "summary" ? "Save" : "Edit"}
                  </button>
                </div>

                {editingSection === "summary" ? (
                  <textarea
                    className="resume-field__textarea"
                    rows={6}
                    value={form.summary}
                    onChange={(e) => set("summary", e.target.value)}
                    placeholder="Write a compelling professional summary…"
                  />
                ) : (
                  <p className="profile-about-text">
                    {form.summary || "No summary added yet."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Experience ──────────────────────────────────────────────── */}
          {activeSection === "Experience" && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">Work Experience</div>
                <button
                  className="btn btn--outline btn--sm"
                  onClick={addExp}
                  disabled={isSaving}
                >
                  + Add
                </button>
              </div>

              {form.experiences.length === 0 && (
                <div className="profile-empty">No experience added yet.</div>
              )}

              {form.experiences.map((exp) => (
                <div className="profile-block" key={exp._key}>
                  <div className="profile-block__header">
                    <div className="profile-block__title">
                      {exp.title || "Untitled Role"}
                      {exp.company_name && (
                        <span className="profile-block__sub">
                          {" "}
                          · {exp.company_name}
                        </span>
                      )}
                    </div>
                    <div className="profile-block__header-actions">
                      <button
                        className="btn btn--primary btn--sm"
                        disabled={isSaving}
                        onClick={() =>
                          editingSection === exp._key
                            ? finishEditing(exp._key)
                            : setEditingSection(exp._key)
                        }
                      >
                        {editingSection === exp._key ? "Save" : "Edit"}
                      </button>
                      <button
                        className="btn btn--accent btn--sm"
                        disabled={isSaving}
                        onClick={() => removeExp(exp._key)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {editingSection === exp._key ? (
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
                              updateExp(exp._key, "title", e.target.value)
                            }
                            placeholder="Job Title"
                          />
                        </div>
                        <div className="resume-field">
                          <label className="resume-field__label">Company</label>
                          <input
                            className="resume-field__input"
                            value={exp.company_name}
                            onChange={(e) =>
                              updateExp(
                                exp._key,
                                "company_name",
                                e.target.value,
                              )
                            }
                            placeholder="Company Name"
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
                              updateExp(exp._key, "startDate", e.target.value)
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
                              updateExp(exp._key, "endDate", e.target.value)
                            }
                          />
                        </div>
                        <div className="resume-field resume-field--checkbox">
                          <label className="resume-field__checkbox-label">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) =>
                                updateExp(exp._key, "current", e.target.checked)
                              }
                            />
                            Currently working here
                          </label>
                        </div>
                      </div>
                      <div className="resume-field">
                        <label className="resume-field__label">
                          Description{" "}
                          <span className="resume-field__hint">
                            (one achievement per line)
                          </span>
                        </label>
                        <textarea
                          className="resume-field__textarea"
                          rows={4}
                          value={exp.description}
                          onChange={(e) =>
                            updateExp(exp._key, "description", e.target.value)
                          }
                          placeholder={
                            "Led end-to-end design for the core product\nIncreased engagement by 32%"
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <div className="profile-exp-view">
                      <div className="profile-exp-view__meta">
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
                        <ul className="profile-exp-view__desc-list">
                          {exp.description
                            .split("\n")
                            .filter(Boolean)
                            .map((line, i) => (
                              <li key={i}>{line}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Education ───────────────────────────────────────────────── */}
          {activeSection === "Education" && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">Education</div>
                <button
                  className="btn btn--outline btn--sm"
                  onClick={addEdu}
                  disabled={isSaving}
                >
                  + Add
                </button>
              </div>

              {form.educations.length === 0 && (
                <div className="profile-empty">No education added yet.</div>
              )}

              {form.educations.map((edu) => (
                <div className="profile-block" key={edu._key}>
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
                        className="btn btn--primary btn--sm"
                        disabled={isSaving}
                        onClick={() =>
                          editingSection === edu._key
                            ? finishEditing(edu._key)
                            : setEditingSection(edu._key)
                        }
                      >
                        {editingSection === edu._key ? "Save" : "Edit"}
                      </button>
                      <button
                        className="btn btn--accent btn--sm"
                        disabled={isSaving}
                        onClick={() => removeEdu(edu._key)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {editingSection === edu._key ? (
                    <div className="resume-form-grid">
                      <div className="resume-field">
                        <label className="resume-field__label">
                          Degree / Certification
                        </label>
                        <input
                          className="resume-field__input"
                          value={edu.degree}
                          onChange={(e) =>
                            updateEdu(edu._key, "degree", e.target.value)
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
                            updateEdu(edu._key, "institution", e.target.value)
                          }
                          placeholder="University Name"
                        />
                      </div>
                      <div className="resume-field">
                        <label className="resume-field__label">
                          Field of Study
                        </label>
                        <input
                          className="resume-field__input"
                          value={edu.field_of_study}
                          onChange={(e) =>
                            updateEdu(
                              edu._key,
                              "field_of_study",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. Computer Science"
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
                            updateEdu(edu._key, "startDate", e.target.value)
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
                            updateEdu(edu._key, "endDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="profile-exp-view">
                      <div className="profile-exp-view__meta">
                        {edu.field_of_study && (
                          <span>{edu.field_of_study}</span>
                        )}
                        {(edu.startDate || edu.endDate) && (
                          <span>
                            {formatDate(edu.startDate)} —{" "}
                            {formatDate(edu.endDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Skills ──────────────────────────────────────────────────── */}
          {activeSection === "Skills" && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">Skills</div>
              </div>
              <div className="profile-block">
                <div className="skills-input-row">
                  <input
                    className="resume-field__input"
                    placeholder="Add a skill (e.g. React) and press Enter"
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
                    disabled={isSaving}
                  >
                    Add
                  </button>
                </div>

                <div className="resume-skills-wrap">
                  {form.skills.map((sk) => (
                    <div className="resume-skill-chip" key={sk}>
                      {sk}
                      <button
                        className="resume-skill-chip__remove"
                        disabled={isSaving}
                        onClick={() => removeSkill(sk)}
                        aria-label={`Remove ${sk}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {form.skills.length === 0 && (
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
