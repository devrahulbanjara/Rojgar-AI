'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer, LoadingSpinner } from '../../../components/common';
import {
    RecruiterJobCard,
    JobTabSwitcher,
    JobDetailModal,
    PostJobModal,
    ReferenceJDCard,
    ReferenceJDModal,
} from '../../../components/recruiter';
import { referenceJDs, ReferenceJD } from '../../../constants/referenceJDs';
import type { Job, JobStatus } from '../../../types/job';
import { useJobsByCompany } from '../../../hooks/queries/useJobs';
import { useAuth } from '../../../hooks/useAuth';

type TabType = 'active' | 'drafts' | 'reference-jds';

// Helper function to map backend status to frontend JobStatus
const mapJobStatus = (status: string): JobStatus => {
    const statusMap: Record<string, JobStatus> = {
        'active': 'Active',
        'draft': 'Draft',
        'expired': 'Closed',
        'closed': 'Closed',
        'inactive': 'Inactive',
    };
    return statusMap[status.toLowerCase()] || 'Draft';
};

// Backend job response type (partial, as backend may return various formats)
interface BackendJobResponse {
    job_id?: string | number;
    id?: string | number;
    company_id?: string | number;
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

// Helper function to transform backend job to frontend Job format
const transformJob = (job: BackendJobResponse): Job => {
    // Extract requirements and skills from required_skills_experience
    const requirements = job.requirements || job.required_skills_experience || [];
    const skills: string[] = []; // Backend doesn't separate skills, so we'll use requirements for both

    return {
        id: parseInt(String(job.job_id || job.id || 0)) || 0,
        company_id: parseInt(String(job.company_id || 0)) || 0,
        company: job.company ? {
            id: parseInt(String(job.company.id || job.company_id || 0)) || 0,
            name: job.company_name || job.company?.name || 'Unknown Company',
            logo: job.company?.logo,
            website: job.company?.website,
            description: job.company?.description,
            location: job.company?.location,
            industry: job.company?.industry,
            founded_year: job.company?.founded_year,
        } : undefined,
        title: job.title || '',
        department: job.department || '',
        level: (job.level || 'Mid') as Job['level'],
        location: job.location || `${job.location_city || ''}, ${job.location_country || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'Not specified',
        location_type: (job.location_type || 'On-site') as Job['location_type'],
        employment_type: (job.employment_type || 'Full-time') as Job['employment_type'],
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency || 'NPR',
        salary_range: job.salary_range,
        description: job.description || job.role_overview || '',
        requirements: Array.isArray(requirements) ? requirements : [],
        skills: skills.length > 0 ? skills : requirements, // Use requirements as skills if no separate skills field
        nice_to_have: job.nice_to_have || [],
        benefits: job.benefits || [],
        posted_date: job.posted_date || job.created_at || new Date().toISOString(),
        application_deadline: job.application_deadline || '',
        status: mapJobStatus(job.status || 'draft'),
        is_remote: job.is_remote || job.location_type === 'Remote',
        is_featured: job.is_featured || false,
        applicant_count: job.applicant_count || job.stats?.applicant_count || 0,
        views_count: job.views_count || job.stats?.views_count || 0,
        created_by: job.created_by || 'system',
        created_at: job.created_at || new Date().toISOString(),
        updated_at: job.updated_at || new Date().toISOString(),
    };
};

export default function RecruiterJobsPage() {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('active');

    // Components State
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
    const [postJobMode, setPostJobMode] = useState<'agent' | 'manual' | null>(null);

    const [selectedReferenceJD, setSelectedReferenceJD] = useState<ReferenceJD | null>(null);
    const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

    // Get user_id from user object (before any conditional returns)
    const userId = user?.id || null;

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            window.location.href = '/login';
        }
    }, [isAuthenticated, isAuthLoading]);

    // Fetch jobs by user_id (must be called before any conditional returns)
    const { data: jobsData, isLoading: isLoadingJobs, refetch: refetchJobs } = useJobsByCompany(
        userId || '',
        { page: 1, limit: 100 }
    );

    // Transform and filter jobs based on active tab
    const allJobs = useMemo(() => {
        if (!jobsData?.jobs) return [];
        return jobsData.jobs.map((job, index) => {
            const transformed = transformJob(job);
            // Ensure unique ID - use negative index as fallback if ID is missing or 0
            // This prevents duplicate keys while maintaining number type
            if (!transformed.id || transformed.id === 0) {
                transformed.id = -(index + 1); // Use negative numbers to avoid conflicts
            }
            return transformed;
        });
    }, [jobsData]);

    const filteredJobs = useMemo(() => {
        return allJobs.filter((job) => {
            if (activeTab === 'active') {
                return job.status === 'Active';
            }
            if (activeTab === 'drafts') {
                return job.status === 'Draft';
            }
            return false;
        });
    }, [allJobs, activeTab]);

    const activeCount = useMemo(() => allJobs.filter((j) => j.status === 'Active').length, [allJobs]);
    const draftCount = useMemo(() => allJobs.filter((j) => j.status === 'Draft').length, [allJobs]);

    // Handlers
    const handleJobClick = useCallback((job: Job) => {
        setSelectedJob(job);
        setIsDetailOpen(true);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setIsDetailOpen(false);
        setTimeout(() => setSelectedJob(null), 300);
    }, []);

    const handlePostNewJob = useCallback(() => {
        setPostJobMode(null);
        setIsPostJobModalOpen(true);
    }, []);

    const handleClosePostJobModal = useCallback(() => {
        setIsPostJobModalOpen(false);
        setTimeout(() => setPostJobMode(null), 300);
        // Refetch jobs after creating a new one
        refetchJobs();
    }, [refetchJobs]);

    // Reference JD Handlers
    const handleReferenceClick = useCallback((jd: ReferenceJD) => {
        setSelectedReferenceJD(jd);
        setIsReferenceModalOpen(true);
    }, []);

    const handleCloseReferenceModal = useCallback(() => {
        setIsReferenceModalOpen(false);
        setTimeout(() => setSelectedReferenceJD(null), 300);
    }, []);

    const handleUseTemplate = useCallback((jd: ReferenceJD) => {
        // Here we would typically set the AI prompt context
        // For now, we'll close the reference modal and open the post job modal
        // Ideally, we would pass the jd.keywords to the JobCreationWizard via state or context

        // Copy keywords to clipboard as a temporary convenience
        if (navigator.clipboard) {
            navigator.clipboard.writeText(jd.keywords);
            // toast.success('Pattern keywords copied!');
        }

        setIsReferenceModalOpen(false);
        setTimeout(() => {
            setPostJobMode('agent');
            setIsPostJobModalOpen(true);
        }, 300);
    }, []);

    // Show loading state while checking authentication
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
            <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
                <div className="space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight">
                                Jobs
                            </h1>
                            <p className="text-base text-[#475569] mt-2">
                                Manage your job postings and track applicants
                            </p>
                        </div>
                        <button
                            onClick={handlePostNewJob}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            Post New Job
                        </button>
                    </div>

                    {/* Tab Switcher */}
                    <div>
                        <JobTabSwitcher
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            activeCount={activeCount}
                            draftCount={draftCount}
                        />
                    </div>

                    {/* Content Area */}
                    <AnimatedContainer direction="up" delay={0.2}>
                        {isLoadingJobs ? (
                            <div className="flex items-center justify-center py-16">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : activeTab === 'reference-jds' ? (
                            /* Reference JDs Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {referenceJDs.map((jd) => (
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
                            /* Jobs Grid (Active & Drafts) - 4 columns like candidate */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredJobs.map((job, index) => (
                                    <RecruiterJobCard
                                        key={`job-${job.id}-${index}`}
                                        job={job}
                                        onClick={() => handleJobClick(job)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {activeTab !== 'reference-jds' && filteredJobs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FolderOpen className="w-7 h-7 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    No {activeTab === 'active' ? 'active' : 'draft'} jobs
                                </h3>
                                <p className="text-sm text-gray-500 max-w-sm mb-5">
                                    {activeTab === 'active'
                                        ? 'Create a new job posting to start receiving applications.'
                                        : 'Save a job as draft to continue editing later.'}
                                </p>
                                <button
                                    onClick={handlePostNewJob}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Job
                                </button>
                            </div>
                        )}
                    </AnimatedContainer>
                </div>
            </PageTransition>

            {/* Modals */}
            <JobDetailModal
                job={selectedJob}
                isOpen={isDetailOpen}
                onClose={handleCloseDetail}
            />

            <PostJobModal
                isOpen={isPostJobModalOpen}
                onClose={handleClosePostJobModal}
                initialMode={postJobMode}
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
