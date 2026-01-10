"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import {
  PageTransition,
  AnimatedContainer,
  LoadingSpinner,
} from "../../../components/common";
import {
  RecruiterJobCard,
  JobTabSwitcher,
  JobDetailModal,
  PostJobModal,
  ReferenceJDCard,
  ReferenceJDModal,
} from "../../../components/recruiter";
import type { Job, JobStatus } from "../../../types/job";
import { useJobsByCompany } from "../../../hooks/queries/useJobs";
import { useAuth } from "../../../hooks/useAuth";
import {
  useReferenceJDs,
  useCreateReferenceJD,
} from "../../../hooks/queries/useReferenceJDs";
import { ReferenceJD } from "../../../services/referenceJDService";

type TabType = "active" | "drafts" | "expired" | "reference-jds";

const mapJobStatus = (status: string): JobStatus => {
  const statusMap: Record<string, JobStatus> = {
    active: "Active",
    draft: "Draft",
    expired: "Closed",
    closed: "Closed",
    inactive: "Inactive",
  };
  return statusMap[status.toLowerCase()] || "Draft";
};

interface BackendJobResponse {
  job_id?: string | number;
  id?: string | number;
  company_id?: string | number;
  organization_id?: string | number;
  company?: {
    id?: string | number;
    name?: string;
    logo?: string;
    website?: string;
    description?: string;
    location?: string;
    industry?: string;
    founded_year?: number;
  };
  organization?: {
    id?: string | number;
    name?: string;
    logo?: string;
    website?: string;
    description?: string;
    location?: string;
    industry?: string;
    founded_year?: number;
  };
  company_name?: string;
  title?: string;
  department?: string;
  level?: string;
  location?: string;
  location_city?: string;
  location_country?: string;
  location_type?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_range?: { min: number; max: number; currency: string };
  description?: string;
  role_overview?: string;
  requirements?: string[];
  required_skills_experience?: string[];
  nice_to_have?: string[];
  benefits?: string[];
  posted_date?: string;
  created_at?: string;
  application_deadline?: string;
  status?: string;
  is_remote?: boolean;
  is_featured?: boolean;
  applicant_count?: number;
  views_count?: number;
  created_by?: string;
  updated_at?: string;
  stats?: {
    applicant_count?: number;
    views_count?: number;
  };
}

const transformJob = (job: BackendJobResponse): Job => {
  const requirements = job.requirements || job.required_skills_experience || [];
  const skills: string[] = [];

  return {
    id: parseInt(String(job.job_id || job.id || 0)) || 0,
    job_id: String(job.job_id || job.id || ""),
    company_id: parseInt(String(job.company_id || 0)) || 0,
    company:
      job.organization || job.company
        ? {
            id:
              parseInt(
                String(
                  job.organization?.id ||
                    job.company?.id ||
                    job.company_id ||
                    job.organization_id ||
                    0,
                ),
              ) || 0,
            name:
              job.organization?.name ||
              job.company?.name ||
              job.company_name ||
              "Unknown Company",
            logo: job.organization?.logo || job.company?.logo,
            website: job.organization?.website || job.company?.website,
            description:
              job.organization?.description || job.company?.description,
            location: job.organization?.location || job.company?.location,
            industry: job.organization?.industry || job.company?.industry,
            founded_year:
              job.organization?.founded_year || job.company?.founded_year,
          }
        : undefined,
    title: job.title || "",
    department: job.department || "",
    level: (job.level || "Mid") as Job["level"],
    location:
      job.location ||
      `${job.location_city || ""}, ${job.location_country || ""}`
        .trim()
        .replace(/^,\s*|,\s*$/g, "") ||
      "Not specified",
    location_type: (job.location_type || "On-site") as Job["location_type"],
    employment_type: (job.employment_type ||
      "Full-time") as Job["employment_type"],
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: job.salary_currency || "NPR",
    salary_range: job.salary_range,
    description: job.description || job.role_overview || "",
    requirements: Array.isArray(requirements) ? requirements : [],
    skills: skills.length > 0 ? skills : requirements,
    nice_to_have: Array.isArray(job.nice_to_have) ? job.nice_to_have : [],
    benefits: Array.isArray(job.benefits) ? job.benefits : [],
    posted_date: job.posted_date || job.created_at || new Date().toISOString(),
    application_deadline: job.application_deadline || "",
    status: mapJobStatus(job.status || "draft"),
    is_remote: job.is_remote || job.location_type === "Remote",
    is_featured: job.is_featured || false,
    applicant_count: job.applicant_count || job.stats?.applicant_count || 0,
    views_count: job.views_count || job.stats?.views_count || 0,
    created_by: job.created_by || "system",
    created_at: job.created_at || new Date().toISOString(),
    updated_at: job.updated_at || new Date().toISOString(),
  };
};

export default function RecruiterJobsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("active");

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [postJobMode, setPostJobMode] = useState<"agent" | "manual" | null>(
    null,
  );
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  const [selectedReferenceJD, setSelectedReferenceJD] =
    useState<ReferenceJD | null>(null);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

  // Fetch reference JDs from API
  const {
    data: referenceJDData,
    isLoading: isLoadingReferenceJDs,
    refetch: refetchReferenceJDs,
  } = useReferenceJDs();
  const createReferenceJD = useCreateReferenceJD();

  const userId = user?.id || null;

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isAuthLoading]);

  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useJobsByCompany(userId || "", { page: 1, limit: 100 });

  useEffect(() => {
    if (jobsData?.jobs) {
      const jobWithBenefits = jobsData.jobs.find(
        (j: Job) => j.benefits && j.benefits.length > 0,
      );
      if (jobWithBenefits) {
        console.log(
          "Found job with benefits:",
          jobWithBenefits.title,
          jobWithBenefits.benefits,
        );
      }
    }
  }, [jobsData]);

  const allJobs = useMemo(() => {
    if (!jobsData?.jobs) return [];
    return jobsData.jobs.map((job, index) => {
      const transformed = transformJob(job);
      if (!transformed.id || transformed.id === 0) {
        transformed.id = -(index + 1);
      }
      return transformed;
    });
  }, [jobsData]);

  const filteredJobs = useMemo(() => {
    const filtered = allJobs.filter((job) => {
      if (activeTab === "active") {
        return job.status === "Active";
      }
      if (activeTab === "drafts") {
        return job.status === "Draft";
      }
      if (activeTab === "expired") {
        return job.status === "Closed" || job.status === "Inactive";
      }
      return false;
    });

    // Sort by latest posted date first
    return filtered.sort((a, b) => {
      const dateA = new Date(a.posted_date || a.created_at).getTime();
      const dateB = new Date(b.posted_date || b.created_at).getTime();
      return dateB - dateA;
    });
  }, [allJobs, activeTab]);

  const activeCount = useMemo(
    () => allJobs.filter((j) => j.status === "Active").length,
    [allJobs],
  );
  const draftCount = useMemo(
    () => allJobs.filter((j) => j.status === "Draft").length,
    [allJobs],
  );
  const expiredCount = useMemo(
    () =>
      allJobs.filter((j) => j.status === "Closed" || j.status === "Inactive")
        .length,
    [allJobs],
  );
  const referenceJDCount = useMemo(
    () => referenceJDData?.reference_jds?.length || 0,
    [referenceJDData],
  );

  // Handlers
  const handleJobClick = useCallback((job: Job) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedJob(null), 300);
  }, []);

  const handleEditJob = useCallback((job: Job) => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setSelectedJob(null);
      setJobToEdit(job);
      setPostJobMode("manual");
      setIsPostJobModalOpen(true);
    }, 300);
  }, []);

  const handlePostNewJob = useCallback(() => {
    setPostJobMode(null);
    setIsPostJobModalOpen(true);
  }, []);

  const handleClosePostJobModal = useCallback(() => {
    setIsPostJobModalOpen(false);
    setTimeout(() => {
      setPostJobMode(null);
      setJobToEdit(null);
    }, 300);
    refetchJobs();
  }, [refetchJobs]);

  const handleReferenceClick = useCallback((jd: ReferenceJD) => {
    setSelectedReferenceJD(jd);
    setIsReferenceModalOpen(true);
  }, []);

  const handleCloseReferenceModal = useCallback(() => {
    setIsReferenceModalOpen(false);
    setTimeout(() => setSelectedReferenceJD(null), 300);
  }, []);

  const handleConvertToReferenceJD = useCallback(
    async (job: Job) => {
      try {
        const jobData = job as Job & {
          nice_to_have?: string[];
          benefits?: string[];
        };

        const referenceJDData = {
          role_overview: job.description || "",
          requiredSkillsAndExperience: job.requirements || [],
          niceToHave: jobData.nice_to_have || [],
          benefits: jobData.benefits || [],
          department: job.department,
        };

        await createReferenceJD.mutateAsync(referenceJDData);
        refetchReferenceJDs();
      } catch (error) {
        console.error("Error converting job to reference JD:", error);
      }
    },
    [createReferenceJD, refetchReferenceJDs],
  );

  const handleUseTemplate = useCallback((jd: ReferenceJD) => {
    const templateText = `Role Overview: ${jd.role_overview}\n\nRequired Skills: ${jd.requiredSkillsAndExperience.join(", ")}\n\nNice to Have: ${jd.niceToHave.join(", ")}\n\nBenefits: ${jd.benefits.join(", ")}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(templateText);
    }

    setIsReferenceModalOpen(false);
    setTimeout(() => {
      setPostJobMode("agent");
      setIsPostJobModalOpen(true);
    }, 300);
  }, []);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTransition
        className="min-h-screen"
        style={{ background: "#F9FAFB" }}
      >
        <div className="space-y-8 pb-12">
          {/* Enhanced Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">
                      Jobs
                    </h1>
                    <p className="text-lg text-[#475569] mt-2 max-w-2xl">
                      Manage your job postings and track applicants
                    </p>
                  </div>
                  <button
                    onClick={handlePostNewJob}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Post New Job
                  </button>
                </div>
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Tab Switcher */}
            <div>
              <JobTabSwitcher
                activeTab={activeTab}
                onTabChange={setActiveTab}
                activeCount={activeCount}
                draftCount={draftCount}
                expiredCount={expiredCount}
                referenceJDCount={referenceJDCount}
              />
            </div>

            {/* Content Area */}
            <AnimatedContainer direction="up" delay={0.2}>
              {isLoadingJobs ||
              (activeTab === "reference-jds" && isLoadingReferenceJDs) ? (
                <div className="flex items-center justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : activeTab === "reference-jds" ? (
                /* Reference JDs Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {referenceJDData?.reference_jds?.map((jd) => (
                    <ReferenceJDCard
                      key={jd.id}
                      jd={jd}
                      onClick={() => handleReferenceClick(jd)}
                      onUseTemplate={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleUseTemplate(jd);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredJobs.map((job, index) => (
                    <RecruiterJobCard
                      key={`job-${job.id}-${index}`}
                      job={job}
                      onClick={() => handleJobClick(job)}
                      onConvertToReferenceJD={
                        activeTab === "active" || activeTab === "expired"
                          ? () => handleConvertToReferenceJD(job)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}

              {/* Empty State for Jobs */}
              {activeTab !== "reference-jds" && filteredJobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-6">
                    <FolderOpen className="w-10 h-10 text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No{" "}
                    {activeTab === "active"
                      ? "active"
                      : activeTab === "drafts"
                        ? "draft"
                        : "expired"}{" "}
                    jobs
                  </h3>
                  <p className="text-base text-gray-500 max-w-md mb-8">
                    {activeTab === "active"
                      ? "Create a new job posting to start receiving applications."
                      : activeTab === "drafts"
                        ? "Save a job as draft to continue editing later."
                        : "Expired or closed jobs will appear here."}
                  </p>
                  <button
                    onClick={handlePostNewJob}
                    className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Create Job
                  </button>
                </div>
              )}

              {/* Empty State for Reference JDs */}
              {activeTab === "reference-jds" &&
                (!referenceJDData?.reference_jds ||
                  referenceJDData.reference_jds.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-6">
                      <FolderOpen className="w-10 h-10 text-purple-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No reference JDs yet
                    </h3>
                    <p className="text-base text-gray-500 max-w-md mb-8">
                      Convert your existing job postings to reference JDs or
                      create new ones to streamline your hiring process.
                    </p>
                  </div>
                )}
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>

      {/* Modals */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onEdit={handleEditJob}
      />

      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={handleClosePostJobModal}
        initialMode={postJobMode}
        jobToEdit={jobToEdit || undefined}
      />

      <ReferenceJDModal
        isOpen={isReferenceModalOpen}
        onClose={handleCloseReferenceModal}
        jd={selectedReferenceJD}
        onUseTemplate={handleUseTemplate}
      />
    </AppShell>
  );
}
