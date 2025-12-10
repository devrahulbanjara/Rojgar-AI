"use client";

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Dialog } from "@/components/ui/dialog"
import { JobFilters, JobFiltersState } from "@/components/recruiter/jobs/JobFilters"
import { JobCard, Job } from "@/components/recruiter/jobs/JobCard"
import { DraftJobCard } from "@/components/recruiter/jobs/DraftJobCard"
import { JobDetailView } from "@/components/recruiter/jobs/JobDetailView"
import { CreateJobWizard } from "@/components/recruiter/jobs/CreateJobWizard"
import { ReferenceTemplates } from "@/components/recruiter/jobs/ReferenceTemplates"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-media-query"
import { AppShell } from "@/components/layout/AppShell"
import { FileText } from "lucide-react"

// Dummy Data
const INITIAL_JOBS: Job[] = [
    {
        id: "1",
        title: "Senior Machine Learning Engineer",
        department: "Engineering",
        level: "Senior",
        status: "active",
        isFeatured: true,
        location: "San Francisco, CA",
        locationType: "hybrid",
        employmentType: "full-time",
        salaryMin: 180000,
        salaryMax: 260000,
        currency: "USD",
        description: "We are seeking an experienced ML Engineer to lead our core recommendation engine team. You will be responsible for designing and implementing scalable machine learning models.",
        skills: ["Python", "PyTorch", "AWS", "Kubernetes", "System Design"],
        postedAt: "2 days ago",
        deadline: "Oct 15",
        applicantsCount: 45,
        viewsCount: 342
    },
    {
        id: "2",
        title: "Product Designer",
        department: "Design",
        level: "Mid",
        status: "active",
        isFeatured: false,
        location: "Remote",
        locationType: "remote",
        employmentType: "contract",
        salaryMin: 90000,
        salaryMax: 130000,
        currency: "USD",
        description: "Join our creative team to shape the future of recruitment tools. You will work closely with product managers and engineers to deliver intuitive user experiences.",
        skills: ["Figma", "Prototyping", "Design Systems", "User Research"],
        postedAt: "5 days ago",
        deadline: "Oct 20",
        applicantsCount: 28,
        viewsCount: 156
    },
    {
        id: "3",
        title: "Marketing Manager",
        department: "Marketing",
        level: "Lead",
        status: "draft",
        isFeatured: false,
        location: "New York, NY",
        locationType: "on-site",
        employmentType: "full-time",
        currency: "USD",
        description: "Looking for a strategic marketing leader to drive brand awareness and lead generation.",
        skills: ["SEO", "Content Strategy", "Analytics", "Team Leadership"],
        postedAt: "1 week ago",
        applicantsCount: 0,
        viewsCount: 12
    },
    {
        id: "4",
        title: "Frontend Developer",
        department: "Engineering",
        level: "Junior",
        status: "closed",
        isFeatured: false,
        location: "London, UK",
        locationType: "hybrid",
        employmentType: "full-time",
        salaryMin: 50000,
        salaryMax: 75000,
        currency: "GBP",
        description: "Great opportunity for a junior developer to learn from a world-class team. Specialize in React and modern web technologies.",
        skills: ["React", "TypeScript", "Tailwind CSS"],
        postedAt: "2 weeks ago",
        applicantsCount: 156,
        viewsCount: 890
    }
]

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS)
    const [filters, setFilters] = useState<JobFiltersState>({
        search: "",
        status: "all",
        department: "all",
        level: "all",
        employmentType: "all",
        locationType: "all",
    })

    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isCreatingJob, setIsCreatingJob] = useState(false)
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    const [activeTab, setActiveTab] = useState<"published" | "drafts">("published")

    // Filter Logic
    const filteredJobs = jobs.filter(job => {
        // Tab Filter
        if (activeTab === "published" && job.status === "draft") return false;
        if (activeTab === "drafts" && job.status !== "draft") return false;

        // Search & Dropdown Filters (Only apply to Published for now, or both?)
        // Requirement 3 says: Tab 1 "Published" excludes draft.
        // Requirement 4 says: Tab 2 "Drafts" is a specific view.
        if (activeTab === "published") {
            if (filters.search && !job.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
            if (filters.status !== "all" && job.status !== filters.status) return false;
            if (filters.department !== "all" && job.department.toLowerCase() !== filters.department.toLowerCase()) return false;
            if (filters.level !== "all" && job.level.toLowerCase() !== filters.level.toLowerCase()) return false;
            if (filters.employmentType !== "all" && job.employmentType !== filters.employmentType) return false;
            if (filters.locationType !== "all" && job.locationType !== filters.locationType) return false;
        }

        return true;
    })

    const draftCount = jobs.filter(j => j.status === 'draft').length

    // Actions
    const handlePublishJob = (newJob: any) => {
        const job: Job = {
            id: Math.random().toString(36).substr(2, 9),
            title: newJob.title || "Untitled Role",
            department: newJob.department || "Engineering",
            level: "Senior",
            status: "active",
            isFeatured: true,
            location: newJob.location || "Remote",
            locationType: "remote",
            employmentType: "full-time",
            currency: "USD",
            salaryMin: Number(newJob.salaryMin) || 120000,
            salaryMax: Number(newJob.salaryMax) || 180000,
            description: newJob.description || "No description provided.",
            skills: ["AI", "React", "System Design"],
            postedAt: "Just now",
            applicantsCount: 0,
            viewsCount: 0
        }
        setJobs([job, ...jobs])
        setIsCreatingJob(false)
        setActiveTab("published")
    }

    const handleCardAction = (action: string, jobId: string) => {
        console.log("Action:", action, jobId)
        if (action === 'delete') {
            setJobs(jobs.filter(j => j.id !== jobId))
        }
        if (action === 'close') {
            setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'closed' } : j))
        }
        if (action === 'activate') {
            setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'active' } : j))
        }
        if (action === 'duplicate') {
            const jobToDup = jobs.find(j => j.id === jobId)
            if (jobToDup) {
                setJobs([{ ...jobToDup, id: Math.random().toString(), title: `${jobToDup.title} (Copy)`, status: 'draft' }, ...jobs])
                setActiveTab("drafts") // Switch to drafts to see the copy
            }
        }
    }

    const handleDiscardDraft = (id: string) => {
        setJobs(jobs.filter(j => j.id !== id))
    }

    const handleResumeDraft = (job: Job) => {
        console.log("Resuming draft", job)
        // In real app, pass data to wizard
        setIsCreatingJob(true)
    }

    const selectedJob = jobs.find(j => j.id === selectedJobId)

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                        <div className="space-y-1.5">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">Job Listings</h1>
                            <p className="text-muted-foreground/80 font-medium">Manage your job postings and track applicant engagement</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsTemplatesOpen(true)}>
                                View Reference Templates
                            </Button>
                            <Button
                                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-500/20"
                                onClick={() => setIsCreatingJob(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Create New Job
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-border/50 flex space-x-6">
                        <button
                            onClick={() => setActiveTab("published")}
                            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "published"
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground/80"
                                }`}
                        >
                            Published & Closed
                        </button>
                        <button
                            onClick={() => setActiveTab("drafts")}
                            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === "drafts"
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground/80"
                                }`}
                        >
                            Drafts
                            {draftCount > 0 && (
                                <Badge variant="secondary" className="px-1.5 py-0.5 h-auto text-[10px]">
                                    {draftCount}
                                </Badge>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === "published" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <JobFilters filters={filters} onFilterChange={setFilters} />

                        {filteredJobs.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {filteredJobs.map(job => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onClick={() => setSelectedJobId(job.id)}
                                        onAction={handleCardAction}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-white border border-dashed">
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-3">
                                    <Plus className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-medium">No jobs found</h3>
                                <p className="text-muted-foreground max-w-sm mt-1 text-sm">
                                    No active or closed jobs match your filters.
                                </p>
                                <Button variant="link" onClick={() => setFilters({
                                    search: "",
                                    status: "all",
                                    department: "all",
                                    level: "all",
                                    employmentType: "all",
                                    locationType: "all",
                                })} className="mt-2 text-primary">
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "drafts" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {filteredJobs.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {filteredJobs.map(job => (
                                    <DraftJobCard
                                        key={job.id}
                                        job={job}
                                        onResume={handleResumeDraft}
                                        onDiscard={handleDiscardDraft}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-white border border-dashed">
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-3">
                                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-medium">No pending drafts</h3>
                                <p className="text-muted-foreground max-w-sm mt-1 text-sm">
                                    Start a fresh job posting to get started.
                                </p>
                                <Button
                                    className="mt-4"
                                    variant="outline"
                                    onClick={() => setIsCreatingJob(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Create New Job
                                </Button>
                            </div>
                        )}
                    </div>
                )}


                {/* Detail View - Responsive Modal/Sheet */}
                {isDesktop ? (
                    <Dialog
                        isOpen={!!selectedJobId}
                        onClose={() => setSelectedJobId(null)}
                        className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col bg-transparent shadow-2xl"
                    >
                        {selectedJob && (
                            <JobDetailView
                                job={selectedJob}
                                onClose={() => setSelectedJobId(null)}
                                onEdit={() => { }}
                            />
                        )}
                    </Dialog>
                ) : (
                    <Sheet open={!!selectedJobId} onOpenChange={(open) => !open && setSelectedJobId(null)}>
                        <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-2xl">
                            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1" /> {/* Grab Handle */}
                            {selectedJob && (
                                <JobDetailView
                                    job={selectedJob}
                                    onClose={() => setSelectedJobId(null)}
                                    onEdit={() => { }}
                                />
                            )}
                        </SheetContent>
                    </Sheet>
                )}

                {/* Create Job Wizard */}
                {isCreatingJob && (
                    <CreateJobWizard
                        onClose={() => setIsCreatingJob(false)}
                        onPublish={handlePublishJob}
                    />
                )}

                {/* Templates Modal */}
                <ReferenceTemplates
                    isOpen={isTemplatesOpen}
                    onClose={() => setIsTemplatesOpen(false)}
                    onSelect={(template) => {
                        console.log("Selected template:", template)
                        setIsTemplatesOpen(false)
                        setIsCreatingJob(true)
                        // Ideally pre-fill wizard here
                    }}
                />
            </div>
        </AppShell>
    )
}
