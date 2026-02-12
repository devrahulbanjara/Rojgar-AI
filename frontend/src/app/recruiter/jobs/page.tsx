'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Plus, FolderOpen, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, SkeletonLoader } from '../../../components/common'
import { SkeletonReferenceJDCard } from '../../../components/common/SkeletonLoader'
import {
  JobsTable,
  ReferenceJDsTable,
  JobDetailModal,
  PostJobModal,
  ReferenceJDModal,
  ReferenceJDEditModal,
  SkeletonJobTableRow,
} from '../../../components/recruiter'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  ActionButton,
} from '../../../components/ui'
import type { Job, JobStatus } from '../../../types/job'
import { useJobsByCompany, useExpireJob, useDeleteJob } from '../../../hooks/queries/useJobs'
import { useAuth } from '../../../hooks/useAuth'
import {
  useReferenceJDs,
  useCreateReferenceJD,
  useUpdateReferenceJD,
  useDeleteReferenceJD,
} from '../../../hooks/queries/useReferenceJDs'
import {
  ReferenceJD,
  CreateReferenceJDRequest,
  ReferenceJDService,
} from '../../../services/referenceJDService'
import { useDeleteConfirm } from '../../../components/ui/delete-confirm-dialog'

type TabType = 'active' | 'drafts' | 'expired' | 'reference-jds'

function RecruiterJobsLoadingContent({ activeTab }: { activeTab: TabType }) {
  if (activeTab === 'reference-jds') {
    return (
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonReferenceJDCard key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full bg-background-surface border border-border-default rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-background-subtle/60 border-b border-border-default">
          <tr>
            {Array.from({ length: 6 }).map((_, index) => (
              <th key={index} className="py-4 px-6 text-left">
                <SkeletonLoader variant="rectangular" width={84} height={12} className="rounded-sm" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonJobTableRow key={index} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecruiterJobsPageSkeleton() {
  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          <div className="space-y-2">
            <SkeletonLoader variant="text" width="28%" height={34} />
            <SkeletonLoader variant="text" width="42%" height={16} />
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-default/60 pb-1">
              <div className="flex items-center gap-8 pb-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonLoader
                    key={index}
                    variant="rectangular"
                    width={102}
                    height={16}
                    className="rounded-sm"
                  />
                ))}
              </div>
              <div className="pb-3 min-w-fit">
                <SkeletonLoader variant="rectangular" width={124} height={38} className="rounded-lg" />
              </div>
            </div>

            <RecruiterJobsLoadingContent activeTab="active" />
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}

const mapJobStatus = (status: string): JobStatus => {
  const statusMap: Record<string, JobStatus> = {
    active: 'Active',
    draft: 'Draft',
    expired: 'Expired',
    closed: 'Expired',
    inactive: 'Expired',
  }
  return statusMap[status.toLowerCase()] || 'Draft'
}

interface BackendJobResponse {
  job_id?: string | number
  id?: string | number
  company_id?: string | number
  organization_id?: string | number
  company?: {
    id?: string | number
    name?: string
    logo?: string
    website?: string
    description?: string
    location?: string
    industry?: string
    founded_year?: number
  }
  organization?: {
    id?: string | number
    name?: string
    logo?: string
    website?: string
    description?: string
    location?: string
    industry?: string
    founded_year?: number
  }
  company_name?: string
  title?: string
  department?: string
  level?: string
  location?: string
  location_city?: string
  location_country?: string
  location_type?: string
  employment_type?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_range?: { min: number; max: number; currency: string }
  job_summary?: string
  job_responsibilities?: string[]
  required_qualifications?: string[]
  preferred?: string[]
  compensation_and_benefits?: string[]
  description?: string
  role_overview?: string
  requirements?: string[]
  required_skills_experience?: string[]
  nice_to_have?: string[]
  benefits?: string[]
  posted_date?: string
  created_at?: string
  application_deadline?: string
  status?: string
  is_remote?: boolean
  is_featured?: boolean
  applicant_count?: number
  views_count?: number
  created_by?: string
  updated_at?: string
  stats?: {
    applicant_count?: number
    views_count?: number
  }
}

const transformJob = (job: BackendJobResponse): Job => {
  const requirements =
    job.required_qualifications || job.requirements || job.required_skills_experience || []
  const preferred = job.preferred || job.nice_to_have || []
  const benefits = job.compensation_and_benefits || job.benefits || []
  const description = job.job_summary || job.description || job.role_overview || ''
  const skills: string[] = []

  const transformedJob = {
    id: parseInt(String(job.job_id || job.id || 0)) || 0,
    job_id: String(job.job_id || job.id || ''),
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
                0
              )
            ) || 0,
          name:
            job.organization?.name || job.company?.name || job.company_name || 'Unknown Company',
          logo: job.organization?.logo || job.company?.logo,
          website: job.organization?.website || job.company?.website,
          description: job.organization?.description || job.company?.description,
          location: job.organization?.location || job.company?.location,
          industry: job.organization?.industry || job.company?.industry,
          founded_year: job.organization?.founded_year || job.company?.founded_year,
        }
        : undefined,
    title: job.title || '',
    department: job.department || '',
    level: (job.level || 'Mid') as Job['level'],
    location: (() => {
      const city = job.location_city?.trim()
      const country = job.location_country?.trim()

      if (city && city.length > 0 && country && country.length > 0) {
        return `${city}, ${country}`
      }
      if (city && city.length > 0) {
        return city
      }
      if (country && country.length > 0) {
        return country
      }

      const jobLocation = (job.location || '').trim()
      const locationType = (job.location_type || '').toLowerCase()
      const jobLocationLower = jobLocation.toLowerCase()

      const locationTypeKeywords = ['remote', 'hybrid', 'on-site', 'onsite']
      const isLocationType = locationTypeKeywords.includes(jobLocationLower)

      if (jobLocation && !isLocationType && jobLocationLower !== locationType) {
        if (jobLocation.includes(',')) {
          return jobLocation
        }

        return jobLocation
      }

      return 'Not specified'
    })(),
    location_city: job.location_city || undefined,
    location_country: job.location_country || undefined,
    location_type: (job.location_type || 'On-site') as Job['location_type'],
    employment_type: (job.employment_type || 'Full-time') as Job['employment_type'],
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: job.salary_currency || 'NPR',
    salary_range: job.salary_range,
    description,
    requirements: Array.isArray(requirements) ? requirements : [],
    skills: skills.length > 0 ? skills : requirements,
    nice_to_have: Array.isArray(preferred) ? preferred : [],
    benefits: Array.isArray(benefits) ? benefits : [],
    posted_date: job.posted_date || job.created_at || new Date().toISOString(),

    job_responsibilities: job.job_responsibilities || [],
    application_deadline: job.application_deadline || '',
    status: mapJobStatus(job.status || 'draft'),
    is_remote: job.is_remote || job.location_type === 'Remote',
    is_featured: job.is_featured || false,
    applicant_count: job.applicant_count || job.stats?.applicant_count || 0,
    views_count: job.views_count || job.stats?.views_count || 0,
    created_by: job.created_by || 'system',
    created_at: job.created_at || new Date().toISOString(),
    updated_at: job.updated_at || new Date().toISOString(),
  } as Job & { job_responsibilities?: string[] }

  return transformedJob
}

export default function RecruiterJobsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<TabType>('active')

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false)
  const [postJobMode, setPostJobMode] = useState<'agent' | 'manual' | null>(null)
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null)
  const [initialReferenceJdId, setInitialReferenceJdId] = useState<string | undefined>(undefined)

  const [selectedReferenceJD, setSelectedReferenceJD] = useState<ReferenceJD | null>(null)
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [referenceJDToEdit, setReferenceJDToEdit] = useState<ReferenceJD | null>(null)

  const { confirm, Dialog } = useDeleteConfirm()

  const {
    data: referenceJDData,
    isLoading: isLoadingReferenceJDs,
    refetch: refetchReferenceJDs,
  } = useReferenceJDs(isAuthenticated && !isAuthLoading)
  const createReferenceJD = useCreateReferenceJD()
  const updateReferenceJDMutation = useUpdateReferenceJD()
  const deleteReferenceJDMutation = useDeleteReferenceJD()

  const userId = user?.id || null
  const organizationId = user?.organization_id || null

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/signin'
    }
  }, [isAuthenticated, isAuthLoading])

  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useJobsByCompany(
    userId || '',
    { organizationId: organizationId || undefined, page: 1, limit: 100 },
    isAuthenticated && !isAuthLoading
  )

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && pathname === '/recruiter/jobs') {
      refetchJobs()
      refetchReferenceJDs()
    }
  }, [isAuthenticated, isAuthLoading, pathname, refetchJobs, refetchReferenceJDs])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/recruiter/jobs') {
        refetchJobs()
        refetchReferenceJDs()
      }
    }

    const handleFocus = () => {
      if (pathname === '/recruiter/jobs') {
        refetchJobs()
        refetchReferenceJDs()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [pathname, refetchJobs, refetchReferenceJDs])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        refetchJobs()
        refetchReferenceJDs()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [refetchJobs, refetchReferenceJDs])

  const allJobs = useMemo(() => {
    if (!jobsData?.jobs) return []
    return jobsData.jobs.map((job, index) => {
      const transformed = transformJob(job)
      if (!transformed.id || transformed.id === 0) {
        transformed.id = -(index + 1)
      }
      return transformed
    })
  }, [jobsData])

  const filteredJobs = useMemo(() => {
    const filtered = allJobs.filter(job => {
      if (activeTab === 'active') {
        return job.status === 'Active'
      }
      if (activeTab === 'drafts') {
        return job.status === 'Draft'
      }
      if (activeTab === 'expired') {
        return job.status === 'Expired'
      }
      return false
    })

    return filtered.sort((a, b) => {
      const dateA = new Date(a.posted_date || a.created_at).getTime()
      const dateB = new Date(b.posted_date || b.created_at).getTime()
      return dateB - dateA
    })
  }, [allJobs, activeTab])

  const activeCount = useMemo(() => allJobs.filter(j => j.status === 'Active').length, [allJobs])
  const draftCount = useMemo(() => allJobs.filter(j => j.status === 'Draft').length, [allJobs])
  const expiredCount = useMemo(
    () => allJobs.filter(j => j.status === 'Expired').length,
    [allJobs]
  )
  const referenceJDCount = useMemo(
    () => referenceJDData?.reference_jds?.length || 0,
    [referenceJDData]
  )

  const handleJobClick = useCallback((job: Job) => {
    setSelectedJob(job)
    setIsDetailOpen(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false)
    setTimeout(() => setSelectedJob(null), 300)
  }, [])

  const expireJobMutation = useExpireJob()
  const deleteJobMutation = useDeleteJob()

  const handleEditJob = useCallback((job: Job) => {
    setIsDetailOpen(false)
    setTimeout(() => {
      setSelectedJob(null)
      setJobToEdit(job)
      setIsPostJobModalOpen(true)
    }, 300)
  }, [])

  const handleExpireJob = useCallback(
    async (job: Job) => {
      const jobId = job.job_id || job.id
      if (!jobId) return

      try {
        await expireJobMutation.mutateAsync(String(jobId))
        toast.success('Job Expired Successfully', {
          description: `"${job.title}" has been moved to expired jobs`,
          duration: 4000,
        })
        setIsDetailOpen(false)
        setTimeout(() => {
          setSelectedJob(null)
        }, 300)
        refetchJobs()
      } catch (error) {
        console.error('Failed to expire job:', error)
        toast.error('Failed to Expire Job', {
          description: 'An error occurred while expiring the job. Please try again.',
          duration: 4000,
        })
      }
    },
    [expireJobMutation, refetchJobs]
  )

  const handleDeleteJob = useCallback(
    async (job: Job) => {
      const jobId = job.job_id || job.id
      if (!jobId) {
        toast.error('Invalid Job ID', {
          description: 'Unable to identify the job to delete',
          duration: 4000,
        })
        return
      }

      await confirm({
        title: 'Delete Job Posting',
        description: "You're about to permanently delete",
        itemName: job.title,
        additionalInfo:
          job.applicant_count > 0
            ? `This job has ${job.applicant_count} application${job.applicant_count > 1 ? 's' : ''}`
            : undefined,
        onConfirm: async () => {
          try {
            await deleteJobMutation.mutateAsync(String(jobId))
            setIsDetailOpen(false)
            setTimeout(() => {
              setSelectedJob(null)
            }, 300)
            refetchJobs()
            toast.success('Job Deleted Successfully', {
              description: `"${job.title}" has been removed`,
              duration: 4000,
            })
          } catch (error) {
            console.error('Failed to delete job:', error)
            const errorMessage =
              error instanceof Error && error.message.includes('CORS')
                ? 'Unable to delete job due to server configuration. Please contact support.'
                : 'An error occurred while deleting the job. Please try again.'
            toast.error('Failed to Delete Job', {
              description: errorMessage,
              duration: 4000,
            })
          }
        },
      })
    },
    [confirm, deleteJobMutation, refetchJobs]
  )

  const handleDeleteReferenceJD = useCallback(
    async (jd: ReferenceJD) => {
      await confirm({
        title: 'Delete Reference JD',
        description: "You're about to permanently delete",
        itemName: jd.department ? `${jd.department} Template` : 'this reference template',
        onConfirm: async () => {
          try {
            await deleteReferenceJDMutation.mutateAsync(jd.id)
            setIsReferenceModalOpen(false)
            setTimeout(() => {
              setSelectedReferenceJD(null)
            }, 300)
            refetchReferenceJDs()
          } catch (error) {
            console.error('Failed to delete reference JD:', error)
          }
        },
      })
    },
    [confirm, deleteReferenceJDMutation, refetchReferenceJDs]
  )

  const handlePostNewJob = useCallback(() => {
    setPostJobMode(null)
    setIsPostJobModalOpen(true)
  }, [])

  const handleClosePostJobModal = useCallback(() => {
    setIsPostJobModalOpen(false)
    setTimeout(() => {
      setJobToEdit(null)
      setInitialReferenceJdId(undefined)
    }, 300)
    refetchJobs()
  }, [refetchJobs])

  const handleReferenceClick = useCallback((jd: ReferenceJD) => {
    setSelectedReferenceJD(jd)
    setIsReferenceModalOpen(true)
  }, [])

  const handleCloseReferenceModal = useCallback(() => {
    setIsReferenceModalOpen(false)
    setTimeout(() => setSelectedReferenceJD(null), 300)
  }, [])

  const handleConvertToReferenceJD = useCallback(
    async (job: Job) => {
      try {
        interface JobWithExtras extends Job {
          job_responsibilities?: string[]
          job_summary?: string
          preferred?: string[]
          compensation_and_benefits?: string[]
        }
        const jobWithExtras = job as JobWithExtras
        const jobResponsibilities = jobWithExtras.job_responsibilities || []

        const referenceJDData = ReferenceJDService.convertJobToReferenceJD({
          job_summary: jobWithExtras.job_summary,
          description: job.description,
          job_responsibilities: jobResponsibilities,
          required_qualifications: job.requirements || [],
          preferred: jobWithExtras.preferred || job.nice_to_have || [],
          nice_to_have: job.nice_to_have || [],
          compensation_and_benefits: jobWithExtras.compensation_and_benefits || job.benefits || [],
          benefits: job.benefits || [],
          department: job.department,
        })

        await createReferenceJD.mutateAsync(referenceJDData)
        refetchReferenceJDs()
        toast.success('Template Saved Successfully', {
          description: `"${job.title}" has been saved as a reference template`,
          duration: 4000,
        })
      } catch (error) {
        console.error('Error converting job to reference JD:', error)
        toast.error('Failed to Save Template', {
          description: 'An error occurred while saving the template. Please try again.',
          duration: 4000,
        })
      }
    },
    [createReferenceJD, refetchReferenceJDs]
  )

  const handleUseTemplate = useCallback((jd: ReferenceJD) => {
    setIsReferenceModalOpen(false)
    setTimeout(() => {
      setInitialReferenceJdId(jd.id)
      setPostJobMode('agent')
      setIsPostJobModalOpen(true)
    }, 300)
  }, [])

  const handleEditReferenceJD = useCallback((jd: ReferenceJD) => {
    setIsReferenceModalOpen(false)
    setTimeout(() => {
      setReferenceJDToEdit(jd)
      setIsEditModalOpen(true)
    }, 300)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false)
    setTimeout(() => {
      setReferenceJDToEdit(null)
    }, 300)
    refetchReferenceJDs()
  }, [refetchReferenceJDs])

  const handleSaveReferenceJD = useCallback(
    async (id: string, data: CreateReferenceJDRequest) => {
      await updateReferenceJDMutation.mutateAsync({ id, data })
    },
    [updateReferenceJDMutation]
  )

  if (isAuthLoading) {
    return <RecruiterJobsPageSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          {/* Page Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">Jobs</h1>
              <p className="text-text-secondary text-sm">
                Manage your job postings and track applicants
              </p>
            </div>
          </AnimatedContainer>

          {/* Content */}
          <div className="space-y-8">
            {/* Tabs with Post New Job Button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-default/60 pb-1">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
                <TabsList className="bg-transparent border-none rounded-none w-full justify-start h-auto p-0 gap-8">
                  <TabsTrigger
                    value="active"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-4 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                  >
                    Active Jobs
                    <span className="ml-2 text-[10px] bg-background-subtle px-1.5 py-0.5 rounded-full text-text-tertiary">
                      {activeCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="drafts"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-4 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                  >
                    Drafts
                    <span className="ml-2 text-[10px] bg-background-subtle px-1.5 py-0.5 rounded-full text-text-tertiary">
                      {draftCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="expired"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-4 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                  >
                    Expired
                    <span className="ml-2 text-[10px] bg-background-subtle px-1.5 py-0.5 rounded-full text-text-tertiary">
                      {expiredCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="reference-jds"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-4 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                  >
                    Reference JDs
                    <span className="ml-2 text-[10px] bg-background-subtle px-1.5 py-0.5 rounded-full text-text-tertiary">
                      {referenceJDCount}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="pb-3 min-w-fit">
                <ActionButton onClick={handlePostNewJob} variant="primary" size="md">
                  <Plus className="w-4 h-4" />
                  Post New Job
                </ActionButton>
              </div>
            </div>

            <AnimatedContainer direction="up" delay={0.2}>
              {isLoadingJobs || (activeTab === 'reference-jds' && isLoadingReferenceJDs) ? (
                <RecruiterJobsLoadingContent activeTab={activeTab} />
              ) : activeTab === 'reference-jds' ? (
                referenceJDData?.reference_jds && referenceJDData.reference_jds.length > 0 ? (
                  <ReferenceJDsTable
                    jds={referenceJDData.reference_jds}
                    onJDClick={handleReferenceClick}
                    onEdit={handleEditReferenceJD}
                    onDelete={handleDeleteReferenceJD}
                    onUseTemplate={handleUseTemplate}
                  />
                ) : !isLoadingReferenceJDs && (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center border border-ai-100 dark:border-ai-900/30 mb-8">
                      <Briefcase className="w-8 h-8 text-ai-500" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">No reference JDs yet</h3>
                    <p className="text-[15px] text-text-tertiary font-medium mt-3 max-w-sm text-center leading-relaxed">
                      Convert your existing job postings to templates or create new ones to streamline your hiring process.
                    </p>
                  </div>
                )
              ) : filteredJobs.length > 0 ? (
                <JobsTable
                  jobs={filteredJobs}
                  onJobClick={handleJobClick}
                  onEdit={handleEditJob}
                  onExpire={handleExpireJob}
                  onDelete={handleDeleteJob}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center border border-primary-100 dark:border-primary-900/30 mb-8">
                    <FolderOpen className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">
                    No {activeTab === 'active' ? 'active' : activeTab === 'drafts' ? 'draft' : 'expired'} jobs found
                  </h3>
                  <p className="text-[15px] text-text-tertiary font-medium mt-3 max-w-sm text-center leading-relaxed">
                    {activeTab === 'active'
                      ? 'Create a new job posting to start receiving applications and finding top talent.'
                      : activeTab === 'drafts'
                        ? 'Save your job listings as drafts to finish them later.'
                        : 'Expired or closed jobs will appear here for your records.'}
                  </p>
                  {activeTab !== 'expired' && (
                    <ActionButton onClick={handlePostNewJob} variant="primary" size="md" className="mt-8">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Job
                    </ActionButton>
                  )}
                </div>
              )}
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>

      { }
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onEdit={handleEditJob}
        onExpire={handleExpireJob}
        onDelete={handleDeleteJob}
        onConvertToReferenceJD={handleConvertToReferenceJD}
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

      <Dialog />
    </AppShell>
  )
}
