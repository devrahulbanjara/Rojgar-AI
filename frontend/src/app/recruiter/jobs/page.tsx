'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer } from '../../../components/common';
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

// Mock data for demonstration - Enhanced with better descriptions and statuses
const mockJobs: Job[] = [
    {
        id: 1,
        company_id: 1,
        company: { id: 1, name: 'ConvexHire' },
        title: 'Senior Frontend Engineer',
        department: 'Engineering',
        level: 'Senior',
        location: 'San Francisco, CA',
        location_type: 'Hybrid',
        employment_type: 'Full-time',
        salary_min: 150000,
        salary_max: 200000,
        salary_currency: 'USD',
        description: 'We are looking for a Senior Frontend Engineer to join our team and help build the next generation of recruitment tools.',
        requirements: ['5+ years React experience', 'TypeScript proficiency', 'System design skills'],
        skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'GraphQL'],
        benefits: ['Health insurance', '401k matching', 'Unlimited PTO', 'Remote work options'],
        posted_date: '2025-12-10',
        application_deadline: '2025-01-15',
        status: 'Active' as JobStatus,
        is_remote: false,
        is_featured: true,
        applicant_count: 47,
        views_count: 342,
        created_by: 'admin',
        created_at: '2025-12-10T10:00:00Z',
        updated_at: '2025-12-10T10:00:00Z',
    },
    {
        id: 2,
        company_id: 1,
        company: { id: 1, name: 'ConvexHire' },
        title: 'Product Designer',
        department: 'Design',
        level: 'Mid',
        location: 'New York, NY',
        location_type: 'Remote',
        employment_type: 'Full-time',
        salary_min: 120000,
        salary_max: 160000,
        salary_currency: 'USD',
        description: 'Join our design team to create beautiful and intuitive user experiences for our recruitment platform.',
        requirements: ['3+ years design experience', 'Figma expertise', 'Portfolio required'],
        skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'User Research'],
        benefits: ['Health insurance', 'Stock options', 'Learning budget', 'Gym membership'],
        posted_date: '2025-12-08',
        application_deadline: '2025-01-20',
        status: 'Active' as JobStatus,
        is_remote: true,
        is_featured: false,
        applicant_count: 28,
        views_count: 189,
        created_by: 'admin',
        created_at: '2025-12-08T10:00:00Z',
        updated_at: '2025-12-08T10:00:00Z',
    },
    {
        id: 3,
        company_id: 1,
        company: { id: 1, name: 'ConvexHire' },
        title: 'Backend Engineer',
        department: 'Engineering',
        level: 'Senior',
        location: 'Austin, TX',
        location_type: 'On-site',
        employment_type: 'Full-time',
        salary_min: 140000,
        salary_max: 180000,
        salary_currency: 'USD',
        description: 'Build scalable backend services and APIs that power our recruitment platform.',
        requirements: ['5+ years Python/Node.js', 'Database design', 'API development'],
        skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
        benefits: ['Health insurance', '401k', 'Flexible hours', 'Team events'],
        posted_date: '2025-12-05',
        application_deadline: '2025-01-10',
        status: 'Active' as JobStatus,
        is_remote: false,
        is_featured: true,
        applicant_count: 35,
        views_count: 256,
        created_by: 'admin',
        created_at: '2025-12-05T10:00:00Z',
        updated_at: '2025-12-05T10:00:00Z',
    },
    {
        id: 5,
        company_id: 1,
        company: { id: 1, name: 'ConvexHire' },
        title: 'Data Analyst',
        department: 'Analytics',
        level: 'Junior',
        location: 'Remote',
        location_type: 'Remote',
        employment_type: 'Full-time',
        salary_min: 80000,
        salary_max: 100000,
        salary_currency: 'USD',
        description: 'Analyze recruitment data and provide insights to improve our platform.',
        requirements: ['1+ years analytics experience', 'SQL proficiency', 'Data visualization'],
        skills: ['SQL', 'Python', 'Tableau', 'Excel', 'Statistics'],
        benefits: ['Health insurance', 'Learning stipend', 'Mentorship program'],
        posted_date: '2025-11-28',
        application_deadline: '2024-12-31',
        status: 'Draft' as JobStatus,
        is_remote: true,
        is_featured: false,
        applicant_count: 0,
        views_count: 0,
        created_by: 'admin',
        created_at: '2025-11-28T10:00:00Z',
        updated_at: '2025-11-28T10:00:00Z',
    },
    {
        id: 6,
        company_id: 1,
        company: { id: 1, name: 'ConvexHire' },
        title: 'Customer Success Manager',
        department: 'Customer Success',
        level: 'Mid',
        location: 'Chicago, IL',
        location_type: 'Hybrid',
        employment_type: 'Full-time',
        salary_min: 90000,
        salary_max: 120000,
        salary_currency: 'USD',
        description: 'Ensure our customers achieve their recruitment goals using our platform.',
        requirements: ['2+ years customer success', 'SaaS experience', 'Excellent communication'],
        skills: ['Customer Relations', 'SaaS', 'Communication', 'Problem Solving'],
        benefits: ['Health insurance', 'Commission', 'Travel opportunities'],
        posted_date: '2025-11-25',
        application_deadline: '2024-12-28',
        status: 'Draft' as JobStatus,
        is_remote: false,
        is_featured: false,
        applicant_count: 0,
        views_count: 0,
        created_by: 'admin',
        created_at: '2025-11-25T10:00:00Z',
        updated_at: '2025-11-25T10:00:00Z',
    },
];

type TabType = 'active' | 'drafts' | 'reference-jds';

export default function RecruiterJobsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('active');

    // Components State
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
    const [postJobMode, setPostJobMode] = useState<'agent' | 'manual' | null>(null);

    const [selectedReferenceJD, setSelectedReferenceJD] = useState<ReferenceJD | null>(null);
    const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

    // Filter jobs based on active tab
    const filteredJobs = useMemo(() => {
        return mockJobs.filter((job) => {
            if (activeTab === 'active') {
                return job.status === 'Active';
            }
            if (activeTab === 'drafts') {
                return job.status === 'Draft';
            }
            return false;
        });
    }, [activeTab]);

    const activeCount = useMemo(() => mockJobs.filter((j) => j.status === 'Active').length, []);
    const draftCount = useMemo(() => mockJobs.filter((j) => j.status === 'Draft').length, []);

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
    }, []);

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
                        {activeTab === 'reference-jds' ? (
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
                            /* Jobs Grid (Active & Drafts) */
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {filteredJobs.map((job) => (
                                    <RecruiterJobCard
                                        key={job.id}
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
