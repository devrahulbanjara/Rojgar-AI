"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  BookmarkRegular,
  BriefcaseRegular,
  LocationRegular,
  ClockRegular,
  SearchRegular,
  DismissRegular,
  ArrowRightRegular,
  ChevronDownRegular,
} from "@fluentui/react-icons";
import Loader from "@/components/common/Loader";
import {
  useSearchJobsQuery,
  useGetJobByIdQuery,
  type JobListItem,
  type JobDetail,
  type LocationType,
  type SearchJobsParams,
} from "@/store/services/jobsApi";
import { useApplyToJobMutation } from "@/store/services/applicationsApi";
import { useGetMyResumesQuery } from "@/store/services/resumeApi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

// ---------------------------------------------------------------------------
// Category and salary band constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  full_stack: "Full Stack",
  mobile: "Mobile",
  data: "Data",
  ml_ai: "ML / AI",
  devops: "DevOps",
  design: "Design",
  product: "Product",
  management: "Management",
  security: "Security",
  qa: "QA",
  other: "Other",
};

interface SalaryBand {
  label: string;
  salary_min?: number;
  salary_max?: number;
}

function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = "NPR",
): string | null {
  if (!min && !max) return null;
  if (min && max)
    return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min) return `From ${currency} ${min.toLocaleString()}`;
  return `Up to ${currency} ${max!.toLocaleString()}`;
}

function formatDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Apply modal — shows resume picker then submits application
// ---------------------------------------------------------------------------

function ApplyModal({
  jobId,
  jobTitle,
  onClose,
}: {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}) {
  const { data: resumesResp, isLoading: loadingResumes } =
    useGetMyResumesQuery();
  const [applyToJob, { isLoading: applying }] = useApplyToJobMutation();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const resumes = resumesResp?.data ?? [];

  async function handleSubmit() {
    if (!selectedResumeId) return;
    try {
      await applyToJob({ job_id: jobId, resume_id: selectedResumeId }).unwrap();
      toast.success("Application submitted successfully!");
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? "Failed to submit application.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
      >
        <div className="modal__header">
          <div className="modal__title" id="apply-modal-title">
            Apply to {jobTitle}
          </div>
          <button
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Close"
          >
            <DismissRegular width={16} height={16} />
          </button>
        </div>
        <div className="modal__body">
          {loadingResumes ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "1.5rem 0",
              }}
            >
              <Loader size="sm" />
            </div>
          ) : resumes.length === 0 ? (
            <p style={{ color: "var(--color-muted,#6b7280)" }}>
              You need to{" "}
              <a href="/dashboard/resume" className="auth__inline-link">
                create a resume
              </a>{" "}
              before applying.
            </p>
          ) : (
            <>
              <p
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.875rem",
                  color: "var(--color-muted,#6b7280)",
                }}
              >
                Select a resume to submit with your application:
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {resumes.map((r) => (
                  <label
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: `1.5px solid ${selectedResumeId === r.id ? "var(--color-primary,#7c3aed)" : "var(--color-gray-200,#e5e7eb)"}`,
                      cursor: "pointer",
                      background:
                        selectedResumeId === r.id
                          ? "var(--color-primary-50,#ede9fe)"
                          : "",
                    }}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={r.id}
                      checked={selectedResumeId === r.id}
                      onChange={() => setSelectedResumeId(r.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{r.resume_name}</div>
                      {r.headline && (
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-muted,#6b7280)",
                          }}
                        >
                          {r.headline}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          {resumes.length > 0 && (
            <button
              className="btn btn--primary"
              onClick={handleSubmit}
              disabled={!selectedResumeId || applying}
            >
              {applying ? "Submitting…" : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Job preview right panel — short overview + CTA buttons
// ---------------------------------------------------------------------------

function JobPreviewPanel({
  jobId,
  allJobs,
  onApply,
}: {
  jobId: string;
  allJobs: JobListItem[];
  onApply: () => void;
}) {
  const { data: resp, isLoading } = useGetJobByIdQuery(jobId);
  const job: JobDetail | undefined = resp?.data;

  if (isLoading)
    return (
      <div className="job-preview">
        <div className="job-preview__empty">
          <Loader size="md" />
        </div>
      </div>
    );

  if (!job)
    return (
      <div className="job-preview">
        <div className="job-preview__empty">
          <p>Could not load job details.</p>
        </div>
      </div>
    );

  const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
  const isOpen = job.status === "open";
  const openRolesCount = allJobs.filter(
    (j) => j.company_id === job.company_id,
  ).length;

  return (
    <div className="job-preview">
      <div
        className="job-preview__cover"
        style={
          {
            "--jp-from": "rgba(0,112,243,0.18)",
            "--jp-to": "rgba(121,40,202,0.1)",
          } as React.CSSProperties
        }
      >
        <div
          className="job-preview__logo"
          style={{ "--jp-logo": "#7928ca" } as React.CSSProperties}
        >
          {job.title[0]}
        </div>
      </div>

      <div className="job-preview__header">
        <div className="job-preview__date">
          Posted {formatDate(job.created_at)}
        </div>
        <div className="job-preview__title">{job.title}</div>
        <div className="job-preview__company">{job.company?.name}</div>
        <div className="job-preview__location">
          <LocationRegular width={12} height={12} aria-hidden="true" />
          {job.location ?? "Location not specified"} ·{" "}
          {LOCATION_TYPE_LABELS[job.location_type]}
        </div>
      </div>

      <div className="job-preview__company-meta">
        {job.company?.industry && <span>{job.company.industry}</span>}
        {job.company?.company_size && <span>· {job.company.company_size}</span>}
        {openRolesCount > 1 && (
          <span className="job-preview__chip job-preview__chip--success">
            {openRolesCount} open roles
          </span>
        )}
      </div>

      <div className="job-preview__chips">
        <span className="job-preview__chip">
          {LOCATION_TYPE_LABELS[job.location_type]}
        </span>
        {salary && <span className="job-preview__chip">{salary}</span>}
        <span
          className={`job-preview__chip${isOpen ? " job-preview__chip--success" : " job-preview__chip--gray"}`}
        >
          {isOpen ? "Actively Hiring" : job.status}
        </span>
      </div>

      {job.overview && (
        <div className="job-preview__overview">
          <div className="job-preview__overview-label">About the Role</div>
          <p className="job-preview__overview-text">{job.overview}</p>
        </div>
      )}

      <div className="job-preview__cta">
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="job-preview__view-btn"
        >
          View Details
          <ArrowRightRegular width={14} height={14} aria-hidden="true" />
        </Link>
        <button
          className="job-preview__quick-btn"
          onClick={onApply}
          disabled={!isOpen}
        >
          {isOpen ? "Quick Apply" : `Applications ${job.status}`}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function UserJobsPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [location, setLocation] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] =
    useState<LocationType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [salaryMinInput, setSalaryMinInput] = useState("");
  const [salaryMaxInput, setSalaryMaxInput] = useState("");
  const [salaryMin, setSalaryMin] = useState<number | undefined>(undefined);
  const [salaryMax, setSalaryMax] = useState<number | undefined>(undefined);
  const [workTypeOpen, setWorkTypeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [applyingToJob, setApplyingToJob] = useState<JobListItem | null>(null);

  const workTypeRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        workTypeRef.current &&
        !workTypeRef.current.contains(e.target as Node)
      )
        setWorkTypeOpen(false);
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target as Node)
      )
        setCategoryOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const queryParams: SearchJobsParams = {
    q: search || undefined,
    location: location || undefined,
    location_type: locationTypeFilter ?? undefined,
    category: categoryFilter ?? undefined,
    salary_min: salaryMin,
    salary_max: salaryMax,
  };

  const {
    data: jobsResp,
    isLoading,
    isError,
  } = useSearchJobsQuery(queryParams);

  const jobs: JobListItem[] = jobsResp?.data ?? [];
  const resolvedId = selectedJobId ?? jobs[0]?.id ?? null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setLocation(locationInput);
    setSelectedJobId(null);
  }

  return (
    <>
      <div className="dash-content container dash-content--pad-top">
        <div className="jobs-layout">
          {/* ── Filter Sidebar ── */}
          <div className="jobs-layout__sidebar">
            <div className="jobs-layout__sidebar-title">Filters</div>

            {/* Pill search input */}
            <form onSubmit={handleSearch}>
              <div className="jobs-sidebar-search">
                <span className="jobs-sidebar-search__icon">
                  <SearchRegular width={16} height={16} aria-hidden="true" />
                </span>
                <input
                  className="jobs-sidebar-search__input"
                  placeholder="Search jobs…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="jobs-sidebar-search__btn"
                  aria-label="Search"
                >
                  <SearchRegular width={12} height={12} aria-hidden="true" />
                </button>
              </div>
            </form>

            {/* Work Type dropdown */}
            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Work Type</div>
              <div className="jobs-filter-dropdown" ref={workTypeRef}>
                <button
                  type="button"
                  className={`jobs-filter-dropdown__trigger${workTypeOpen ? " jobs-filter-dropdown__trigger--open" : ""}${locationTypeFilter !== null ? " jobs-filter-dropdown__trigger--active" : ""}`}
                  onClick={() => setWorkTypeOpen((v) => !v)}
                >
                  <span>
                    {locationTypeFilter
                      ? LOCATION_TYPE_LABELS[locationTypeFilter]
                      : "All Types"}
                  </span>
                  <ChevronDownRegular
                    className={`jobs-filter-dropdown__chevron${workTypeOpen ? " jobs-filter-dropdown__chevron--open" : ""}`}
                    width={12}
                    height={12}
                  />
                </button>
                {workTypeOpen && (
                  <div className="jobs-filter-dropdown__menu">
                    {(
                      [
                        null,
                        "onsite",
                        "remote",
                        "hybrid",
                      ] as (LocationType | null)[]
                    ).map((t) => (
                      <button
                        key={String(t)}
                        type="button"
                        className={`jobs-filter-dropdown__option${locationTypeFilter === t ? " jobs-filter-dropdown__option--active" : ""}`}
                        onClick={() => {
                          setLocationTypeFilter(t);
                          setSelectedJobId(null);
                          setWorkTypeOpen(false);
                        }}
                      >
                        <span className="jobs-filter-dropdown__option-dot" />
                        {t === null ? "All Types" : LOCATION_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location text filter */}
            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Location</div>
              <div className="jobs-sidebar-search">
                <span className="jobs-sidebar-search__icon">
                  <LocationRegular width={15} height={15} aria-hidden="true" />
                </span>
                <input
                  className="jobs-sidebar-search__input"
                  placeholder="e.g. Kathmandu…"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setLocation(locationInput);
                      setSelectedJobId(null);
                    }
                  }}
                />
                {locationInput && (
                  <button
                    type="button"
                    className="jobs-sidebar-search__btn"
                    aria-label="Clear location"
                    onClick={() => {
                      setLocationInput("");
                      setLocation("");
                      setSelectedJobId(null);
                    }}
                  >
                    <DismissRegular width={11} height={11} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Category dropdown */}
            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Category</div>
              <div className="jobs-filter-dropdown" ref={categoryRef}>
                <button
                  type="button"
                  className={`jobs-filter-dropdown__trigger${categoryOpen ? " jobs-filter-dropdown__trigger--open" : ""}${categoryFilter !== null ? " jobs-filter-dropdown__trigger--active" : ""}`}
                  onClick={() => setCategoryOpen((v) => !v)}
                >
                  <span>
                    {categoryFilter
                      ? CATEGORY_LABELS[categoryFilter]
                      : "All Categories"}
                  </span>
                  <ChevronDownRegular
                    className={`jobs-filter-dropdown__chevron${categoryOpen ? " jobs-filter-dropdown__chevron--open" : ""}`}
                    width={12}
                    height={12}
                  />
                </button>
                {categoryOpen && (
                  <div className="jobs-filter-dropdown__menu">
                    <button
                      type="button"
                      className={`jobs-filter-dropdown__option${categoryFilter === null ? " jobs-filter-dropdown__option--active" : ""}`}
                      onClick={() => {
                        setCategoryFilter(null);
                        setSelectedJobId(null);
                        setCategoryOpen(false);
                      }}
                    >
                      <span className="jobs-filter-dropdown__option-dot" />
                      All Categories
                    </button>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={`jobs-filter-dropdown__option${categoryFilter === key ? " jobs-filter-dropdown__option--active" : ""}`}
                        onClick={() => {
                          setCategoryFilter(key);
                          setSelectedJobId(null);
                          setCategoryOpen(false);
                        }}
                      >
                        <span className="jobs-filter-dropdown__option-dot" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Salary range inputs */}
            <div className="jobs-layout__filter-group jobs-layout__filter-group--last">
              <div className="jobs-layout__filter-group-label">
                Salary (NPR)
              </div>
              <div className="jobs-salary-range">
                <input
                  type="number"
                  className="jobs-salary-range__input"
                  placeholder="Min"
                  value={salaryMinInput}
                  onChange={(e) => setSalaryMinInput(e.target.value)}
                  onBlur={() => {
                    const v = salaryMinInput
                      ? Number(salaryMinInput)
                      : undefined;
                    setSalaryMin(v);
                    setSelectedJobId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = salaryMinInput
                        ? Number(salaryMinInput)
                        : undefined;
                      setSalaryMin(v);
                      setSelectedJobId(null);
                    }
                  }}
                />
                <span className="jobs-salary-range__sep">···</span>
                <input
                  type="number"
                  className="jobs-salary-range__input"
                  placeholder="Max"
                  value={salaryMaxInput}
                  onChange={(e) => setSalaryMaxInput(e.target.value)}
                  onBlur={() => {
                    const v = salaryMaxInput
                      ? Number(salaryMaxInput)
                      : undefined;
                    setSalaryMax(v);
                    setSelectedJobId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = salaryMaxInput
                        ? Number(salaryMaxInput)
                        : undefined;
                      setSalaryMax(v);
                      setSelectedJobId(null);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Job List ── */}
          <div>
            <div className="job-list-header">
              <div className="job-list-header__count">
                {isLoading
                  ? ""
                  : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} found`}
              </div>
            </div>

            {isLoading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "320px",
                }}
              >
                <Loader size="lg" />
              </div>
            )}

            {isError && (
              <div className="dash-card">
                <div className="dash-card__body">Failed to load jobs.</div>
              </div>
            )}

            {!isLoading && !isError && jobs.length === 0 && (
              <div className="dash-card">
                <div
                  className="dash-card__body"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "2rem",
                    gap: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  <BriefcaseRegular
                    style={{
                      width: 32,
                      height: 32,
                      color: "var(--color-muted,#9ca3af)",
                    }}
                  />
                  <p>No jobs match your search.</p>
                </div>
              </div>
            )}

            <div className="job-list-stack">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`job-card${resolvedId === job.id ? " job-card--active" : ""}`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <div className="job-card__header">
                    <div
                      className="job-card__logo"
                      style={
                        {
                          "--logo-bg": "#7928CA1A",
                          "--logo-color": "#7928CA",
                        } as React.CSSProperties
                      }
                    >
                      {job.title[0]}
                    </div>
                    <div className="job-card__title-wrap">
                      <div className="job-card__title">{job.title}</div>
                      <div className="job-card__company">
                        {job.company?.name}
                      </div>
                      <div className="job-card__location">
                        {job.location && (
                          <>
                            <LocationRegular
                              style={{ width: 11, height: 11 }}
                              aria-hidden="true"
                            />{" "}
                            {job.location} ·{" "}
                          </>
                        )}
                        {LOCATION_TYPE_LABELS[job.location_type]}
                      </div>
                    </div>
                    <button
                      className="job-card__bookmark"
                      title="Save job"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BookmarkRegular
                        width={14}
                        height={14}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div className="job-card__tags">
                    <span className="job-card__tag">
                      {LOCATION_TYPE_LABELS[job.location_type]}
                    </span>
                    {job.category && (
                      <span className="job-card__tag">
                        {CATEGORY_LABELS[job.category] ?? job.category}
                      </span>
                    )}
                    {(job.salary_min || job.salary_max) && (
                      <span className="job-card__tag">
                        {formatSalary(
                          job.salary_min,
                          job.salary_max,
                          job.currency,
                        )}
                      </span>
                    )}
                  </div>

                  <div className="job-card__meta">
                    <span>
                      <BriefcaseRegular
                        width={12}
                        height={12}
                        aria-hidden="true"
                      />
                      {LOCATION_TYPE_LABELS[job.location_type]}
                    </span>
                    {job.location && (
                      <span>
                        <LocationRegular
                          width={12}
                          height={12}
                          aria-hidden="true"
                        />
                        {job.location}
                      </span>
                    )}
                    <span className="job-card__meta-time">
                      <ClockRegular width={12} height={12} aria-hidden="true" />
                      {formatDate(job.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Job Preview Panel ── */}
          {isLoading ? (
            <div className="job-preview">
              <div className="job-preview__empty">
                <Loader size="lg" />
              </div>
            </div>
          ) : resolvedId ? (
            <JobPreviewPanel
              jobId={resolvedId}
              allJobs={jobs}
              onApply={() => {
                const j = jobs.find((x) => x.id === resolvedId);
                if (j) setApplyingToJob(j);
              }}
            />
          ) : (
            <div className="job-preview">
              <div className="job-preview__empty">
                <BriefcaseRegular
                  style={{ width: 40, height: 40, opacity: 0.3 }}
                />
                <p>Select a job to preview details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {applyingToJob && (
        <ApplyModal
          jobId={applyingToJob.id}
          jobTitle={applyingToJob.title}
          onClose={() => setApplyingToJob(null)}
        />
      )}
    </>
  );
}
