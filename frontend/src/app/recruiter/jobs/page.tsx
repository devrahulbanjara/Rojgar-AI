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
  ReferenceJDEditModal,
} from "../../../components/recruiter";
import type { Job, JobStatus } from "../../../types/job";
import { useJobsByCompany, useExpireJob, useDeleteJob } from "../../../hooks/queries/useJobs";
import { useAuth } from "../../../hooks/useAuth";
import {
  useReferenceJDs,
  useCreateReferenceJD,
  useUpdateReferenceJD,
  useDeleteReferenceJD,
} from "../../../hooks/queries/useReferenceJDs";
import { ReferenceJD, CreateReferenceJDRequest } from "../../../services/referenceJDService";

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
  // New backend fields
  job_summary?: string;
  job_responsibilities?: string[];
  required_qualifications?: string[];
  preferred?: string[];
  compensation_and_benefits?: string[];
  // Legacy fields (for backward compatibility)
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
  // New backend fields
  job_summary?: string;
  job_responsibilities?: string[];
  required_qualifications?: string[];
  preferred?: string[];
  compensation_and_benefits?: string[];
  // Legacy fields (for backward compatibility)
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
  // Map new backend fields to frontend fields
  const requirements = job.required_qualifications || job.requirements || job.required_skills_experience || [];
  const preferred = job.preferred || job.nice_to_have || [];
  const benefits = job.compensation_and_benefits || job.benefits || [];
  const description = job.job_summary || job.description || job.role_overview || "";
  const skills: string[] = [];

  const transformedJob = {
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
    location: (() => {
      // Prioritize location_city and location_country - they are the source of truth
      const city = job.location_city?.trim();
      const country = job.location_country?.trim();
      
      // Check if city/country are actually set (not empty strings or null)
      if (city && city.length > 0 && country && country.length > 0) {
        return `${city}, ${country}`;
      }
      if (city && city.length > 0) {
        return city;
      }
      if (country && country.length > 0) {
        return country;
      }
      
      // Fallback: Check if job.location contains a valid city/country format
      // (e.g., "Kathmandu, Nepal") and doesn't match location_type
      const jobLocation = (job.location || "").trim();
      const locationType = (job.location_type || "").toLowerCase();
      const jobLocationLower = jobLocation.toLowerCase();
      
      // Check if location matches location_type keywords (these should not be shown as location)
      const locationTypeKeywords = ["remote", "hybrid", "on-site", "onsite"];
      const isLocationType = locationTypeKeywords.includes(jobLocationLower);
      
      // If location doesn't match location_type keywords and is different from location_type, use it
      if (jobLocation && !isLocationType && jobLocationLower !== locationType) {
        // If it contains a comma, it's likely "City, Country" format - use it
        if (jobLocation.includes(",")) {
          return jobLocation;
        }
        // Otherwise, only use if it's clearly not a location type
        return jobLocation;
      }
      
      return "Not specified";
    })(),
    location_city: job.location_city || undefined,
    location_country: job.location_country || undefined,
    location_type: (job.location_type || "On-site") as Job["location_type"],
    employment_type: (job.employment_type ||
      "Full-time") as Job["employment_type"],
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: job.salary_currency || "NPR",
    salary_range: job.salary_range,
    description: description,
    requirements: Array.isArray(requirements) ? requirements : [],
    skills: skills.length > 0 ? skills : requirements,
    nice_to_have: Array.isArray(preferred) ? preferred : [],
    benefits: Array.isArray(benefits) ? benefits : [],
    posted_date: job.posted_date || job.created_at || new Date().toISOString(),
    // Add new backend fields for access via type casting
    job_responsibilities: job.job_responsibilities || [],
    application_deadline: job.application_deadline || "",
    status: mapJobStatus(job.status || "draft"),
    is_remote: job.is_remote || job.location_type === "Remote",
    is_featured: job.is_featured || false,
    applicant_count: job.applicant_count || job.stats?.applicant_count || 0,
    views_count: job.views_count || job.stats?.views_count || 0,
    created_by: job.created_by || "system",
    created_at: job.created_at || new Date().toISOString(),
    updated_at: job.updated_at || new Date().toISOString(),
  } as Job & { job_responsibilities?: string[] };

  return transformedJob;
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
  const [initialReferenceJdId, setInitialReferenceJdId] = useState<string | undefined>(undefined);

  const [selectedReferenceJD, setSelectedReferenceJD] =
    useState<ReferenceJD | null>(null);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [referenceJDToEdit, setReferenceJDToEdit] = useState<ReferenceJD | null>(null);

  // Fetch reference JDs from API
  const {
    data: referenceJDData,
    isLoading: isLoadingReferenceJDs,
    refetch: refetchReferenceJDs,
  } = useReferenceJDs();
  const createReferenceJD = useCreateReferenceJD();
  const updateReferenceJDMutation = useUpdateReferenceJD();
  const deleteReferenceJDMutation = useDeleteReferenceJD();

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

  const expireJobMutation = useExpireJob();
  const deleteJobMutation = useDeleteJob();

  const handleEditJob = useCallback((job: Job) => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setSelectedJob(null);
      setJobToEdit(job);
      setPostJobMode(null); // Let user choose mode (agent or manual)
      setIsPostJobModalOpen(true);
    }, 300);
  }, []);

  const handleExpireJob = useCallback(
    async (job: Job) => {
      // Use job_id (UUID string) instead of id (parsed integer) for API calls
      const jobId = job.job_id || job.id;
      if (!jobId) return;

      try {
        await expireJobMutation.mutateAsync(String(jobId));
        setIsDetailOpen(false);
        setTimeout(() => {
          setSelectedJob(null);
        }, 300);
        refetchJobs();
      } catch (error) {
        console.error("Failed to expire job:", error);
      }
    },
    [expireJobMutation, refetchJobs],
  );

  const handleDeleteJob = useCallback(
    async (job: Job) => {
      // Use job_id (UUID string) instead of id (parsed integer) for API calls
      const jobId = job.job_id || job.id;
      if (!jobId) return;

      if (!confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
        return;
      }

      try {
        await deleteJobMutation.mutateAsync(String(jobId));
        setIsDetailOpen(false);
        setTimeout(() => {
          setSelectedJob(null);
        }, 300);
        refetchJobs();
        // Toast notification will be handled by the mutation hook
      } catch (error) {
        console.error("Failed to delete job:", error);
      }
    },
    [deleteJobMutation, refetchJobs],
  );

  const handlePostNewJob = useCallback(() => {
    setPostJobMode(null);
    setIsPostJobModalOpen(true);
  }, []);

  const handleClosePostJobModal = useCallback(() => {
    setIsPostJobModalOpen(false);
    setTimeout(() => {
      setPostJobMode(null);
      setJobToEdit(null);
      setInitialReferenceJdId(undefined);
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
          job_summary?: string;
          job_responsibilities?: string[];
          required_qualifications?: string[];
          preferred?: string[];
          compensation_and_benefits?: string[];
          nice_to_have?: string[];
          benefits?: string[];
        };

        const referenceJDData = ReferenceJDService.convertJobToReferenceJD({
          job_summary: jobData.job_summary,
          description: job.description,
          job_responsibilities: jobData.job_responsibilities,
          required_qualifications: jobData.required_qualifications,
          requirements: job.requirements,
          preferred: jobData.preferred,
          nice_to_have: jobData.nice_to_have || job.nice_to_have,
          compensation_and_benefits: jobData.compensation_and_benefits,
          benefits: jobData.benefits || job.benefits,
          department: job.department,
        });

        await createReferenceJD.mutateAsync(referenceJDData);
        refetchReferenceJDs();
      } catch (error) {
        console.error("Error converting job to reference JD:", error);
      }
    },
    [createReferenceJD, refetchReferenceJDs],
  );

  const handleUseTemplate = useCallback((jd: ReferenceJD) => {
    setIsReferenceModalOpen(false);
    setTimeout(() => {
      setInitialReferenceJdId(jd.id);
      setPostJobMode("agent");
      setIsPostJobModalOpen(true);
    }, 300);
  }, []);

  const handleEditReferenceJD = useCallback((jd: ReferenceJD) => {
    setIsReferenceModalOpen(false);
    setTimeout(() => {
      setReferenceJDToEdit(jd);
      setIsEditModalOpen(true);
    }, 300);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      setReferenceJDToEdit(null);
    }, 300);
    refetchReferenceJDs();
  }, [refetchReferenceJDs]);

  const handleSaveReferenceJD = useCallback(
    async (id: string, data: CreateReferenceJDRequest) => {
      await updateReferenceJDMutation.mutateAsync({ id, data });
    },
    [updateReferenceJDMutation],
  );

  const handleDeleteReferenceJD = useCallback(
    async (jd: ReferenceJD) => {
      if (
        !confirm(
          `Are you sure you want to delete this reference JD? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        await deleteReferenceJDMutation.mutateAsync(jd.id);
        setIsReferenceModalOpen(false);
        setTimeout(() => {
          setSelectedReferenceJD(null);
        }, 300);
        refetchReferenceJDs();
      } catch (error) {
        console.error("Failed to delete reference JD:", error);
      }
    },
    [deleteReferenceJDMutation, refetchReferenceJDs],
  );

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
                  {activeTab === "expired" ? (
                    <h3 className="text-xl font-bold text-gray-900">
                      No job has expired
                    </h3>
                  ) : (
                    <>
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
                    </>
                  )}
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
        onExpire={handleExpireJob}
        onDelete={handleDeleteJob}
      />

      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={handleClosePostJobModal}
        initialMode={postJobMode || undefined}
        jobToEdit={jobToEdit || undefined}
        initialReferenceJdId={initialReferenceJdId}
      />

      <ReferenceJDModal
        isOpen={isReferenceModalOpen}
        onClose={handleCloseReferenceModal}
        jd={selectedReferenceJD}
        onUseTemplate={handleUseTemplate}
        onDelete={handleDeleteReferenceJD}
        onEdit={handleEditReferenceJD}
      />

      <ReferenceJDEditModal
        jd={referenceJDToEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveReferenceJD}
      />
    </AppShell>
  );
}
