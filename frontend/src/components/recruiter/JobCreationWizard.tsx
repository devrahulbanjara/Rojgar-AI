'use client'

import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wand2,
  Building2,
  DollarSign,
  FileText,
  Loader2,
  RotateCcw,
  Briefcase,
  Pencil,
  X as XIcon,
  Bot,
  MapPin,
  Globe,
  Clock,
  Users,
  Target,
  Award,
  Gift,
  Calendar,
  Zap,
  ClipboardList,
  ListChecks,
  Coins,
  Sparkles,
  Plus,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useCreateJob, useGenerateJobDraft, useUpdateJob } from '../../hooks/queries/useJobs'
import { useReferenceJDs } from '../../hooks/queries/useReferenceJDs'
import { ActionButton } from '../ui'
import { SelectDropdown } from '../ui/select-dropdown'
import { toast } from 'sonner'
import type { CreateJobRequest, Job } from '../../types/job'

interface JobCreationWizardProps {
  mode?: 'agent' | 'manual'
  onBack: () => void
  onComplete: () => void
  jobToEdit?: Job
  initialReferenceJdId?: string
}

const getSteps = () => {
  return [
    { id: 1, title: 'Basic Info', icon: Building2 },
    { id: 2, title: 'Job Details', icon: FileText },
    { id: 3, title: 'Requirements', icon: Briefcase },
    { id: 4, title: 'Compensation', icon: DollarSign },
  ]
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-4 bg-background-subtle rounded animate-pulse', className)}
      style={{
        background:
          'linear-gradient(90deg, hsl(var(--background-subtle)) 25%, hsl(var(--background-subtle)) 50%, hsl(var(--background-subtle)) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

const revisionSuggestions = [
  'Change the salary in Nepali Rupees (NPR)',
  'Add more technical skills and technologies related to this field.',
  'Make the tone more professional and formal.',
  'Include a bit more details about our company.',
  "Expand the 'What We Offer' section with more benefits",
  'Make the job description more concise and focused',
  'Add more details about day-to-day responsibilities',
  'Include more information about growth opportunities',
  'Make the requirements less strict, more flexible',
]

export function JobCreationWizard({
  mode = 'agent',
  onBack,
  onComplete,
  jobToEdit,
  initialReferenceJdId,
}: JobCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false)
  const [revisionText, setRevisionText] = useState('')
  const [activeTab, setActiveTab] = useState<'agent' | 'manual'>(mode)
  const [editingField, setEditingField] = useState<{
    field: string
    index: number
  } | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (jobToEdit) {
      setCurrentStep(1)
    }
  }, [jobToEdit])

  const createJobMutation = useCreateJob()
  const updateJobMutation = useUpdateJob()
  const generateDraftMutation = useGenerateJobDraft()

  const steps = getSteps()

  const getContentStep = (step: number): number => {
    return step
  }

  const handleSuggestionClick = (suggestion: string) => {
    setRevisionText(suggestion)
  }

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    level: '',
    keywords: '',
    reference_jd_id: initialReferenceJdId || '',
    description: '',
    jobResponsibilities: [''],
    locationCity: '',
    locationCountry: '',
    locationType: '',
    employmentType: '',
    requiredSkillsAndExperience: [''],
    niceToHave: [''],
    salaryMin: '',
    salaryMax: '',
    currency: 'NPR',
    benefits: [''],
    applicationDeadline: '',
    autoShortlist: false,
  })

  useEffect(() => {
    if (initialReferenceJdId) {
      setFormData(prev => ({
        ...prev,
        reference_jd_id: initialReferenceJdId,
      }))
    }
  }, [initialReferenceJdId])

  const { data: referenceJDsData, isLoading: isLoadingReferenceJDs } = useReferenceJDs()

  useEffect(() => {
    if (initialReferenceJdId && activeTab !== 'agent') {
      setActiveTab('agent')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReferenceJdId])

  useEffect(() => {
    if (jobToEdit) {
      const existingRequirements =
        jobToEdit.requirements && jobToEdit.requirements.length > 0
          ? jobToEdit.requirements.join(', ')
          : ''

      setFormData({
        title: jobToEdit.title || '',
        department: jobToEdit.department || '',
        level: jobToEdit.level || '',
        keywords: existingRequirements,

        reference_jd_id: '',
        description: jobToEdit.description || '',
        jobResponsibilities: (() => {
          interface JobWithExtras extends Job {
            job_responsibilities?: string[]
          }
          const jobWithExtras = jobToEdit as JobWithExtras
          return jobWithExtras.job_responsibilities && jobWithExtras.job_responsibilities.length > 0
            ? jobWithExtras.job_responsibilities
            : ['']
        })(),
        locationCity: jobToEdit.location_city || '',
        locationCountry: jobToEdit.location_country || '',
        locationType: jobToEdit.location_type || '',
        employmentType: jobToEdit.employment_type || '',
        requiredSkillsAndExperience:
          jobToEdit.requirements && jobToEdit.requirements.length > 0
            ? jobToEdit.requirements
            : [''],
        niceToHave:
          jobToEdit.nice_to_have && jobToEdit.nice_to_have.length > 0
            ? jobToEdit.nice_to_have
            : [''],
        salaryMin: jobToEdit.salary_min?.toString() || '',
        salaryMax: jobToEdit.salary_max?.toString() || '',
        currency: jobToEdit.salary_currency || 'NPR',
        benefits: jobToEdit.benefits && jobToEdit.benefits.length > 0 ? jobToEdit.benefits : [''],
        applicationDeadline: jobToEdit.application_deadline || '',
        autoShortlist: jobToEdit.auto_shortlist ?? false,
      })
    }
  }, [jobToEdit])

  const handleGenerate = async () => {
    if (!formData.title || !formData.keywords || !formData.reference_jd_id) {
      toast.error('Missing information', {
        description:
          'Please provide a job title, requirements, and select a reference JD to generate a description.',
      })
      return
    }

    setIsGenerating(true)

    try {
      const result = await generateDraftMutation.mutateAsync({
        title: formData.title,
        raw_requirements: formData.keywords,
        reference_jd_id: formData.reference_jd_id,
      })

      setIsGenerating(false)
      setIsGenerated(true)

      const description = result.job_summary || result.description || ''
      const jobResponsibilities = result.job_responsibilities || []
      const requiredSkills =
        result.required_qualifications || result.requiredSkillsAndExperience || []
      const niceToHave = result.preferred || result.niceToHave || []
      const benefits = result.compensation_and_benefits || result.benefits || []

      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description,
        jobResponsibilities:
          jobResponsibilities.length > 0 ? jobResponsibilities : prev.jobResponsibilities,
        requiredSkillsAndExperience:
          requiredSkills.length > 0 ? requiredSkills : prev.requiredSkillsAndExperience,
        niceToHave: niceToHave.length > 0 ? niceToHave : prev.niceToHave,
        benefits: benefits.length > 0 ? benefits : prev.benefits,
      }))

      toast.success('Job description generated!', {
        description: 'AI-generated content has been filled in. Review and edit as needed.',
        duration: 4000,
      })
    } catch (err) {
      setIsGenerating(false)
      const error = err as {
        data?: { detail?: string; message?: string }
        message?: string
      }
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        'Failed to generate job description.'
      toast.error('Generation failed', {
        description: errorMessage,
      })
    }
  }

  const handleRevision = async () => {
    if (!revisionText.trim()) return

    setIsGenerating(true)
    setShowRevisionPrompt(false)

    try {
      const currentDraft = {
        job_summary: formData.description || '',
        job_responsibilities: formData.jobResponsibilities.filter(item => item.trim() !== ''),
        required_qualifications: formData.requiredSkillsAndExperience.filter(
          item => item.trim() !== ''
        ),
        preferred: formData.niceToHave.filter(item => item.trim() !== ''),
        compensation_and_benefits: formData.benefits.filter(item => item.trim() !== ''),
      }

      const result = await generateDraftMutation.mutateAsync({
        title: formData.title,
        raw_requirements: `${formData.keywords}\n\nRevision Request: ${revisionText}`,
        reference_jd_id: formData.reference_jd_id,
        current_draft: currentDraft,
      })

      const description = result.job_summary || result.description || formData.description
      const jobResponsibilities = result.job_responsibilities || []
      const requiredSkills =
        result.required_qualifications || result.requiredSkillsAndExperience || []
      const niceToHave = result.preferred || result.niceToHave || []
      const benefits = result.compensation_and_benefits || result.benefits || []

      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description,
        jobResponsibilities:
          jobResponsibilities.length > 0 ? jobResponsibilities : prev.jobResponsibilities,
        requiredSkillsAndExperience:
          requiredSkills.length > 0 ? requiredSkills : prev.requiredSkillsAndExperience,
        niceToHave: niceToHave.length > 0 ? niceToHave : prev.niceToHave,
        benefits: benefits.length > 0 ? benefits : prev.benefits,
      }))

      setIsGenerating(false)
      setRevisionText('')

      toast.success('Job description revised!', {
        description: 'The AI has updated the content based on your feedback.',
        duration: 4000,
      })
    } catch (err) {
      setIsGenerating(false)
      const error = err as {
        data?: { detail?: string; message?: string }
        message?: string
      }
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        'Failed to revise job description.'
      toast.error('Revision failed', {
        description: errorMessage,
      })
    }
  }

  const prepareJobData = (): CreateJobRequest => {
    const filteredRequiredSkills = formData.requiredSkillsAndExperience.filter(
      item => item.trim() !== ''
    )
    const filteredNiceToHave = formData.niceToHave.filter(item => item.trim() !== '')
    const filteredBenefits = formData.benefits.filter(item => item.trim() !== '')

    const salaryMin = formData.salaryMin ? parseInt(formData.salaryMin, 10) : undefined
    const salaryMax = formData.salaryMax ? parseInt(formData.salaryMax, 10) : undefined

    const filteredJobResponsibilities = formData.jobResponsibilities.filter(
      item => item.trim() !== ''
    )

    return {
      title: formData.title.trim(),
      department: formData.department.trim() || 'General',
      level: formData.level.trim() || 'Mid',

      job_summary: formData.description.trim() || '',
      job_responsibilities: filteredJobResponsibilities,
      required_qualifications: filteredRequiredSkills.length > 0 ? filteredRequiredSkills : [],
      preferred: filteredNiceToHave.length > 0 ? filteredNiceToHave : [],
      compensation_and_benefits: filteredBenefits.length > 0 ? filteredBenefits : [],

      location_city: formData.locationCity.trim() || undefined,
      location_country: formData.locationCountry.trim() || undefined,
      location_type: formData.locationType || 'On-site',
      employment_type: formData.employmentType.trim() || 'Full-time',
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: formData.currency || 'NPR',
      application_deadline: formData.applicationDeadline || undefined,
      auto_shortlist: formData.autoShortlist,
      status: 'active',
      raw_requirements: formData.keywords.trim() || undefined,
    } as CreateJobRequest
  }

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('Job title is required', {
        description: 'Please enter a job title to save as draft.',
      })
      return
    }

    const jobData = { ...prepareJobData(), status: 'draft' as const }

    try {
      if (jobToEdit) {
        await updateJobMutation.mutateAsync({
          id: jobToEdit.job_id || jobToEdit.id.toString(),
          data: { ...jobData, id: jobToEdit.job_id || jobToEdit.id.toString(), status: 'draft' },
        })
        toast.success('Draft updated successfully!', {
          description: `${formData.title} has been saved as a draft.`,
          duration: 4000,
        })
      } else {
        await createJobMutation.mutateAsync(jobData)
        toast.success('Draft saved successfully!', {
          description: `${formData.title} has been saved as a draft.`,
          duration: 4000,
        })
      }
      setTimeout(() => {
        onComplete()
      }, 500)
    } catch (err) {
      let errorMessage = jobToEdit
        ? 'Failed to update draft. Please try again.'
        : 'Failed to save draft. Please try again.'
      const error = err as {
        data?: { detail?: string; message?: string }
        message?: string
      }

      if (error) {
        if (error.data) {
          errorMessage = error.data.detail || error.data.message || error.message || errorMessage
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      toast.error(jobToEdit ? 'Failed to update draft' : 'Failed to save draft', {
        description: errorMessage,
        duration: 5000,
      })
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Job title is required', {
        description: 'Please enter a job title to continue.',
      })
      return
    }
    if (!formData.description.trim()) {
      toast.error('Job description is required', {
        description: 'Please provide a description for this role.',
      })
      return
    }
    const filteredRequiredSkills = formData.requiredSkillsAndExperience.filter(
      item => item.trim() !== ''
    )
    if (filteredRequiredSkills.length === 0) {
      toast.error('Required skills missing', {
        description: 'Please add at least one required skill or experience.',
      })
      return
    }

    const jobData = { ...prepareJobData(), status: 'active' as const }

    try {
      if (jobToEdit) {
        await updateJobMutation.mutateAsync({
          id: jobToEdit.job_id || jobToEdit.id.toString(),
          data: { ...jobData, id: jobToEdit.job_id || jobToEdit.id.toString(), status: 'active' },
        })
        toast.success('Job published successfully!', {
          description: `${formData.title} has been published and is now live.`,
          duration: 4000,
        })
      } else {
        await createJobMutation.mutateAsync(jobData)
        toast.success('Job created successfully!', {
          description: `${formData.title} has been published and is now live.`,
          duration: 4000,
        })
      }
      onComplete()
    } catch (err) {
      const error = err as {
        data?: { detail?: string; message?: string }
        message?: string
      }
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        (jobToEdit
          ? 'Failed to publish job. Please try again.'
          : 'Failed to create job. Please try again.')
      toast.error(jobToEdit ? 'Failed to publish job' : 'Failed to create job', {
        description: errorMessage,
        duration: 5000,
      })
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      onBack()
    }
  }

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateArrayField = (field: string, index: number, value: string) => {
    setFormData(prev => {
      const arr = [...(prev[field as keyof typeof prev] as string[])]
      arr[index] = value
      return { ...prev, [field]: arr }
    })
  }

  const addArrayItem = (field: string) => {
    setFormData(prev => {
      const arr = [...(prev[field as keyof typeof prev] as string[]), '']
      return { ...prev, [field]: arr }
    })
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => {
      const arr = (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
      return { ...prev, [field]: arr.length ? arr : [''] }
    })
    if (editingField?.field === field && editingField.index === index) {
      setEditingField(null)
    }
  }

  const startEditing = (field: string, index: number, currentValue: string) => {
    setEditingField({ field, index })
    setEditValue(currentValue)
  }

  const saveEdit = () => {
    if (editingField) {
      updateArrayField(editingField.field, editingField.index, editValue)
      setEditingField(null)
      setEditValue('')
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  return (
    <div className="flex flex-col h-[70vh]">
      {}
      <div className="flex-shrink-0 px-8 py-5 border-b border-border-default bg-background-surface">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm',
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 text-white shadow-emerald-500/20'
                        : isActive
                          ? 'bg-gradient-to-r from-blue-600 to-primary-600 dark:from-blue-500 dark:to-primary-500 text-white shadow-blue-500/30 scale-110'
                          : 'bg-background-subtle text-text-muted'
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold hidden sm:block transition-colors duration-200',
                      isActive
                        ? 'text-primary-600'
                        : isCompleted
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-text-muted'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-1 mx-4 rounded-full transition-all duration-500',
                      currentStep > step.id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600'
                        : 'bg-background-subtle'
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {}
        {currentStep === 1 && (
          <div className="space-y-8">
            {}
            {!isGenerated && (
              <div className="bg-background-surface border border-border-default rounded-xl shadow-sm overflow-hidden">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('agent')}
                    className={cn(
                      'flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative',
                      activeTab === 'agent'
                        ? 'text-primary-700 dark:text-primary-400 border-b-[3px] border-primary-600'
                        : 'text-text-secondary hover:text-text-primary border-b-[3px] border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span>Agent Mode</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className={cn(
                      'flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative',
                      activeTab === 'manual'
                        ? 'text-primary-700 border-b-[3px] border-primary-600'
                        : 'text-text-secondary hover:text-text-primary border-b-[3px] border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Manual Mode</span>
                    </div>
                  </button>
                </div>

                {}
                {activeTab === 'agent' && (
                  <div className="px-8 py-6 space-y-6">
                    {/* AI Generation Card */}
                    <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                      <div className="px-6 py-5 border-b border-border-subtle flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-text-primary">AI Job Generation</h4>
                          <p className="text-sm text-text-tertiary mt-0.5">
                            Provide details and let AI generate a complete job description.
                          </p>
                        </div>
                      </div>
                      <div className="px-6 py-5 space-y-5">
                        {/* Job Title */}
                        <div>
                          <label className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-text-tertiary" />
                            Job Title <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={e => updateField('title', e.target.value)}
                            placeholder="e.g. Senior ML Engineer"
                            className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary hover:border-border-strong text-text-primary placeholder:text-text-muted transition-all text-base"
                          />
                        </div>

                        {/* Reference JD */}
                        <div>
                          <label className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-text-tertiary" />
                            Reference Job Description <span className="text-error">*</span>
                          </label>
                          <SelectDropdown
                            value={formData.reference_jd_id}
                            onChange={value => updateField('reference_jd_id', value)}
                            placeholder="Select a reference JD..."
                            disabled={isLoadingReferenceJDs}
                            options={
                              isLoadingReferenceJDs
                                ? [{ value: '', label: 'Loading reference JDs...', disabled: true }]
                                : referenceJDsData?.reference_jds &&
                                    referenceJDsData.reference_jds.length > 0
                                  ? referenceJDsData.reference_jds.map(refJD => {
                                      const jobSummary =
                                        refJD.job_summary || refJD.role_overview || ''
                                      return {
                                        value: refJD.id,
                                        label: refJD.department
                                          ? `${refJD.department} - ${jobSummary.slice(0, 50)}...`
                                          : jobSummary.slice(0, 80),
                                      }
                                    })
                                  : [
                                      {
                                        value: '',
                                        label: 'No reference JDs available',
                                        disabled: true,
                                      },
                                    ]
                            }
                          />
                          <p className="text-xs text-text-tertiary mt-2">
                            {referenceJDsData?.reference_jds &&
                            referenceJDsData.reference_jds.length > 0
                              ? 'Select a reference JD to guide the AI in generating a similar job description.'
                              : 'Create reference JDs in your organization to use them as templates for AI generation.'}
                          </p>
                        </div>

                        {/* Keywords & Requirements */}
                        <div>
                          <label className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-text-tertiary" />
                            Keywords & Requirements <span className="text-error">*</span>
                          </label>
                          <textarea
                            value={formData.keywords || ''}
                            onChange={e => updateField('keywords', e.target.value)}
                            placeholder={
                              jobToEdit
                                ? "Describe what you'd like to change or improve..."
                                : 'e.g. FastAPI, AWS, PyTorch, MLOps, 5 years experience...'
                            }
                            rows={4}
                            className="w-full px-4 py-3 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary hover:border-border-strong text-text-primary placeholder:text-text-muted transition-all resize-none text-base"
                          />
                        </div>

                        {}
                        <button
                          onClick={handleGenerate}
                          disabled={
                            isGenerating ||
                            generateDraftMutation.isPending ||
                            !formData.title.trim() ||
                            !formData.keywords.trim() ||
                            !formData.reference_jd_id
                          }
                          className={cn(
                            'group relative w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg overflow-hidden',
                            !isGenerating &&
                              !generateDraftMutation.isPending &&
                              formData.title.trim() &&
                              formData.keywords.trim() &&
                              formData.reference_jd_id
                              ? 'bg-gradient-to-r from-ai-600 to-primary-600 dark:from-ai-500 dark:to-primary-500 text-white shadow-ai-500/25 hover:from-ai-700 hover:to-primary-700 dark:hover:from-ai-600 dark:hover:to-primary-600 hover:shadow-ai-500/40 hover:-translate-y-0.5'
                              : 'bg-background-subtle text-text-muted cursor-not-allowed'
                          )}
                        >
                          {!isGenerating &&
                            !generateDraftMutation.isPending &&
                            formData.title.trim() &&
                            formData.keywords.trim() &&
                            formData.reference_jd_id && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            )}
                          <div className="relative flex items-center gap-2">
                            {isGenerating || generateDraftMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                                <span>{jobToEdit ? 'Revise with AI' : 'Generate with AI'}</span>
                              </>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Mode */}
                {activeTab === 'manual' && (
                  <div className="px-8 py-6 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                      <div className="px-6 py-5 border-b border-border-subtle flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-text-primary">Basic Information</h4>
                          <p className="text-sm text-text-tertiary mt-0.5">
                            Enter the core details for this job posting.
                          </p>
                        </div>
                      </div>
                      <div className="px-6 py-5 space-y-5">
                        {/* Job Title */}
                        <div>
                          <label className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-text-tertiary" />
                            Job Title <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={e => updateField('title', e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                            className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary hover:border-border-strong text-text-primary placeholder:text-text-muted transition-all text-base"
                          />
                        </div>

                        {/* Department & Level */}
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-text-tertiary" />
                              Department <span className="text-error">*</span>
                            </label>
                            <SelectDropdown
                              value={formData.department}
                              onChange={value => updateField('department', value)}
                              placeholder="Select department..."
                              options={[
                                { value: 'Engineering', label: 'Engineering' },
                                { value: 'Design', label: 'Design' },
                                { value: 'Product', label: 'Product' },
                                { value: 'Marketing', label: 'Marketing' },
                                { value: 'Sales', label: 'Sales' },
                                { value: 'Operations', label: 'Operations' },
                              ]}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                              <Users className="w-4 h-4 text-text-tertiary" />
                              Level <span className="text-error">*</span>
                            </label>
                            <SelectDropdown
                              value={formData.level}
                              onChange={value => updateField('level', value)}
                              placeholder="Select level..."
                              options={[
                                { value: 'Junior', label: 'Junior' },
                                { value: 'Mid', label: 'Mid-Level' },
                                { value: 'Senior', label: 'Senior' },
                                { value: 'Lead', label: 'Lead' },
                                { value: 'Principal', label: 'Principal' },
                              ]}
                            />
                          </div>
                        </div>

                        {/* Job Summary */}
                        <div>
                          <label className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-text-tertiary" />
                            Job Summary <span className="text-error">*</span>
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={e => updateField('description', e.target.value)}
                            rows={Math.max(4, Math.ceil(formData.description.length / 80))}
                            placeholder="Summarize what this role is about..."
                            className="w-full px-4 py-3 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-border-strong resize-y text-base leading-relaxed text-text-primary placeholder:text-text-muted min-h-[100px] max-h-[300px] overflow-y-auto transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Job Responsibilities Card */}
                    <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                      <div className="px-6 py-5 border-b border-border-subtle flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-text-primary">
                            Job Responsibilities
                          </h4>
                          <p className="text-sm text-text-tertiary mt-0.5">
                            Add key responsibilities and duties for this role.
                          </p>
                        </div>
                      </div>
                      <div className="px-6 py-5 space-y-3">
                        {formData.jobResponsibilities.map((item, index) => {
                          const isEditing =
                            editingField?.field === 'jobResponsibilities' &&
                            editingField.index === index
                          return (
                            <div key={index} className="group">
                              {isEditing ? (
                                <div className="bg-background-subtle rounded-xl p-4 border-2 border-primary-500 shadow-sm">
                                  <textarea
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                    className="w-full px-4 py-3 bg-background-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-all duration-200 resize-none min-h-[80px]"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end mt-3">
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-background-surface border border-border-default hover:border-border-strong rounded-lg transition-all duration-200"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm hover:border-ai-200 dark:hover:border-ai-800 bg-background-subtle border-border-default">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ai-100 dark:bg-ai-900/50 flex items-center justify-center mt-0.5">
                                    <span className="text-xs font-semibold text-ai-600 dark:text-ai-400">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <textarea
                                      value={item}
                                      onChange={e =>
                                        updateArrayField(
                                          'jobResponsibilities',
                                          index,
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g. Design and implement scalable backend services"
                                      rows={Math.max(1, Math.ceil(item.length / 70))}
                                      className="w-full bg-transparent border-none focus:outline-none text-base leading-relaxed text-text-primary placeholder:text-text-muted resize-none"
                                    />
                                  </div>
                                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditing('jobResponsibilities', index, item)
                                      }
                                      className="p-2 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all duration-200"
                                      aria-label="Edit responsibility"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {formData.jobResponsibilities.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeArrayItem('jobResponsibilities', index)
                                        }
                                        className="p-2 text-text-muted hover:text-error-500 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg transition-all duration-200"
                                        aria-label="Remove responsibility"
                                      >
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => addArrayItem('jobResponsibilities')}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-ai-600 dark:text-ai-400 hover:text-ai-700 dark:hover:text-ai-300 hover:bg-ai-50 dark:hover:bg-ai-950/30 rounded-xl transition-all duration-200 w-full justify-center border-2 border-dashed border-ai-200 dark:border-ai-800 hover:border-ai-400 dark:hover:border-ai-600"
                        >
                          <Plus className="w-4 h-4" />
                          Add Responsibility
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {}
        {isGenerating && (
          <div className="space-y-4 animate-pulse">
            <div className="bg-background-surface rounded-lg p-5 border border-border-default">
              <SkeletonLine className="w-28 h-4 mb-3" />
              <SkeletonLine className="w-full h-9 mb-2" />
              <SkeletonLine className="w-3/4 h-9" />
            </div>
            <div className="bg-background-surface rounded-lg p-5 border border-border-default">
              <SkeletonLine className="w-36 h-4 mb-3" />
              <SkeletonLine className="w-full h-20" />
            </div>
            <div className="bg-background-surface rounded-lg p-5 border border-border-default">
              <SkeletonLine className="w-32 h-4 mb-3" />
              <div className="flex gap-2">
                <SkeletonLine className="w-20 h-7 rounded-full" />
                <SkeletonLine className="w-24 h-7 rounded-full" />
                <SkeletonLine className="w-16 h-7 rounded-full" />
              </div>
            </div>
            <p className="text-center text-ai-500 text-sm font-medium">
              AI is generating your job posting...
            </p>
          </div>
        )}

        {}
        {!isGenerating && (
          <>
            {}
            {currentStep === 1 && isGenerated && (
              <div className="space-y-8">
                {}
                {isGenerated && (
                  <div className="bg-gradient-to-r from-success-50 to-success-100 dark:from-success-950/30 dark:to-success-900/30 border border-success-200 dark:border-success-800 rounded-xl px-8 py-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-background-surface flex items-center justify-center flex-shrink-0 shadow-sm border border-success-200 dark:border-success-800">
                      <Check className="w-6 h-6 text-success-600 dark:text-success-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-success-900 dark:text-success-100 mb-1">
                        Job Description Generated
                      </h4>
                      <p className="text-sm text-success-700 dark:text-success-300 leading-relaxed">
                        We&apos;ve created a professional job description based on your
                        requirements. Review the highlighted fields below and make any edits you
                        need.
                      </p>
                    </div>
                  </div>
                )}
                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h4 className="text-xl font-bold text-text-primary">Basic Information</h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-text-tertiary" />
                        Job Title <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => updateField('title', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className={cn(
                          'w-full px-4 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                          'text-base text-text-primary placeholder:text-text-muted',
                          'transition-colors duration-200',
                          isGenerated &&
                            formData.title &&
                            'bg-primary-50/50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-text-tertiary" />
                          Department <span className="text-error">*</span>
                        </label>
                        <SelectDropdown
                          value={formData.department}
                          onChange={value => updateField('department', value)}
                          placeholder="Select department..."
                          className={cn(
                            isGenerated &&
                              formData.department &&
                              '[&>button]:!bg-primary-50/50 dark:[&>button]:!bg-primary-950/30 [&>button]:border-primary-200 dark:[&>button]:border-primary-800'
                          )}
                          options={[
                            { value: 'Engineering', label: 'Engineering' },
                            { value: 'Design', label: 'Design' },
                            { value: 'Product', label: 'Product' },
                            { value: 'Marketing', label: 'Marketing' },
                            { value: 'Sales', label: 'Sales' },
                            { value: 'Operations', label: 'Operations' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-text-tertiary" />
                          Level <span className="text-error">*</span>
                        </label>
                        <SelectDropdown
                          value={formData.level}
                          onChange={value => updateField('level', value)}
                          placeholder="Select level..."
                          className={cn(
                            isGenerated &&
                              formData.level &&
                              '[&>button]:!bg-primary-50/50 dark:[&>button]:!bg-primary-950/30 [&>button]:border-primary-200 dark:[&>button]:border-primary-800'
                          )}
                          options={[
                            { value: 'Junior', label: 'Junior' },
                            { value: 'Mid', label: 'Mid-Level' },
                            { value: 'Senior', label: 'Senior' },
                            { value: 'Lead', label: 'Lead' },
                            { value: 'Principal', label: 'Principal' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Job Summary */}
                    <div>
                      <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-text-tertiary" />
                        Job Summary <span className="text-error">*</span>
                      </label>
                      <p className="text-sm text-text-tertiary mb-3">
                        Brief 2-3 sentence summary about this position.
                      </p>
                      <textarea
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                        rows={Math.max(4, Math.ceil(formData.description.length / 80))}
                        placeholder="Summarize what this role is about..."
                        className={cn(
                          'w-full px-4 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-y',
                          'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                          'min-h-[100px] max-h-[300px] overflow-y-auto',
                          isGenerated &&
                            formData.description &&
                            'bg-primary-50/50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
                        )}
                      />
                    </div>

                    {/* Job Responsibilities */}
                    <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                      <div className="px-6 py-5 border-b border-border-subtle flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-text-primary">
                            Job Responsibilities
                          </h4>
                          <p className="text-sm text-text-tertiary mt-0.5">
                            Key responsibilities and duties for this role.
                          </p>
                        </div>
                      </div>
                      <div className="px-6 py-5 space-y-3">
                        {formData.jobResponsibilities.map((item, index) => {
                          const isEditing =
                            editingField?.field === 'jobResponsibilities' &&
                            editingField.index === index
                          return (
                            <div key={index} className="group">
                              {isEditing ? (
                                <div className="bg-background-subtle rounded-xl p-4 border-2 border-ai-500 shadow-sm">
                                  <textarea
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                    className="w-full px-4 py-3 bg-background-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-ai-500/20 focus:border-ai-500 text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-all duration-200 resize-none min-h-[80px]"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end mt-3">
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-background-surface border border-border-default hover:border-border-strong rounded-lg transition-all duration-200"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      className="px-4 py-2 text-sm font-medium text-white bg-ai-600 hover:bg-ai-700 rounded-lg transition-all duration-200 shadow-sm"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={cn(
                                    'flex items-start gap-3 p-4 rounded-xl border transition-all duration-200',
                                    'hover:shadow-sm hover:border-ai-200 dark:hover:border-ai-800',
                                    isGenerated && item
                                      ? 'bg-ai-50/50 dark:bg-ai-950/30 border-ai-200 dark:border-ai-800'
                                      : 'bg-background-subtle border-border-default'
                                  )}
                                >
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ai-100 dark:bg-ai-900/50 flex items-center justify-center mt-0.5">
                                    <span className="text-xs font-semibold text-ai-600 dark:text-ai-400">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <textarea
                                      value={item}
                                      onChange={e =>
                                        updateArrayField(
                                          'jobResponsibilities',
                                          index,
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g. Design and implement scalable backend services"
                                      rows={Math.max(1, Math.ceil(item.length / 70))}
                                      className="w-full bg-transparent border-none focus:outline-none text-base leading-relaxed text-text-primary placeholder:text-text-muted resize-none"
                                    />
                                  </div>
                                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditing('jobResponsibilities', index, item)
                                      }
                                      className="p-2 text-text-muted hover:text-ai-600 dark:hover:text-ai-400 hover:bg-ai-50 dark:hover:bg-ai-900/30 rounded-lg transition-all duration-200"
                                      aria-label="Edit responsibility"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {formData.jobResponsibilities.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeArrayItem('jobResponsibilities', index)
                                        }
                                        className="p-2 text-text-muted hover:text-error-500 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg transition-all duration-200"
                                        aria-label="Remove responsibility"
                                      >
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => addArrayItem('jobResponsibilities')}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-ai-600 dark:text-ai-400 hover:text-ai-700 dark:hover:text-ai-300 hover:bg-ai-50 dark:hover:bg-ai-950/30 rounded-xl transition-all duration-200 w-full justify-center border-2 border-dashed border-ai-200 dark:border-ai-800 hover:border-ai-400 dark:hover:border-ai-600"
                        >
                          <Plus className="w-4 h-4" />
                          Add Responsibility
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Job Details */}
            {getContentStep(currentStep) === 2 && (
              <div className="space-y-8">
                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h4 className="text-xl font-bold text-text-primary">Location & Employment</h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-text-tertiary" />
                          City <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.locationCity}
                          onChange={e => updateField('locationCity', e.target.value)}
                          placeholder="e.g. Kathmandu"
                          className={cn(
                            'w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-border-strong',
                            'text-base text-text-primary placeholder:text-text-muted transition-all duration-200',
                            isGenerated &&
                              formData.locationCity &&
                              'bg-primary-50/50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
                          )}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-text-tertiary" />
                          Country <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.locationCountry}
                          onChange={e => updateField('locationCountry', e.target.value)}
                          placeholder="e.g. Nepal"
                          className={cn(
                            'w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-border-strong',
                            'text-base text-text-primary placeholder:text-text-muted transition-all duration-200',
                            isGenerated &&
                              formData.locationCountry &&
                              'bg-primary-50/50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-text-tertiary" />
                        Location Type <span className="text-error">*</span>
                      </label>
                      <SelectDropdown
                        value={formData.locationType}
                        onChange={value => updateField('locationType', value)}
                        placeholder="Select type..."
                        className={cn(
                          isGenerated &&
                            formData.locationType &&
                            '[&>button]:!bg-primary-50/50 dark:[&>button]:!bg-primary-950/30 [&>button]:border-primary-200 dark:[&>button]:border-primary-800'
                        )}
                        options={[
                          { value: 'Remote', label: 'Remote' },
                          { value: 'Hybrid', label: 'Hybrid' },
                          { value: 'On-site', label: 'On-site' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-text-tertiary" />
                        Employment Type <span className="text-error">*</span>
                      </label>
                      <SelectDropdown
                        value={formData.employmentType}
                        onChange={value => updateField('employmentType', value)}
                        placeholder="Select type..."
                        className={cn(
                          isGenerated &&
                            formData.employmentType &&
                            '[&>button]:!bg-primary-50/50 dark:[&>button]:!bg-primary-950/30 [&>button]:border-primary-200 dark:[&>button]:border-primary-800'
                        )}
                        options={[
                          { value: 'Full-time', label: 'Full-time' },
                          { value: 'Part-time', label: 'Part-time' },
                          { value: 'Contract', label: 'Contract' },
                          { value: 'Internship', label: 'Internship' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Requirements */}
            {getContentStep(currentStep) === 3 && (
              <div className="space-y-8">
                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center">
                      <ListChecks className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-text-primary">
                        Required Qualifications
                      </h4>
                      <p className="text-sm text-text-tertiary mt-0.5">
                        Add requirements, skills, and education here.
                      </p>
                    </div>
                  </div>
                  <div className="px-8 py-6 space-y-3">
                    {formData.requiredSkillsAndExperience.map((item, index) => {
                      const isEditing =
                        editingField?.field === 'requiredSkillsAndExperience' &&
                        editingField.index === index
                      return (
                        <div key={index} className="group">
                          {isEditing ? (
                            <div className="bg-background-subtle rounded-xl p-4 border-2 border-primary-500 shadow-sm">
                              <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="e.g. Strong experience with Python for backend development"
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className="w-full px-4 py-3 bg-background-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-all duration-200 resize-none min-h-[80px]"
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end mt-3">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-background-surface border border-border-default hover:border-border-strong rounded-lg transition-all duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'flex items-start gap-3 p-4 rounded-xl border transition-all duration-200',
                                'hover:shadow-sm hover:border-primary-200 dark:hover:border-primary-800',
                                isGenerated && item
                                  ? 'bg-ai-50/50 dark:bg-ai-950/30 border-ai-200 dark:border-ai-800'
                                  : 'bg-background-subtle border-border-default'
                              )}
                            >
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ai-100 dark:bg-ai-900/50 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-ai-600 dark:text-ai-400">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <textarea
                                  value={item}
                                  onChange={e =>
                                    updateArrayField(
                                      'requiredSkillsAndExperience',
                                      index,
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. Strong experience with Python for backend development"
                                  rows={Math.max(1, Math.ceil(item.length / 70))}
                                  className="w-full bg-transparent border-none focus:outline-none text-base leading-relaxed text-text-primary placeholder:text-text-muted resize-none"
                                />
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEditing('requiredSkillsAndExperience', index, item)
                                  }
                                  className="p-2 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all duration-200"
                                  aria-label="Edit requirement"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {formData.requiredSkillsAndExperience.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeArrayItem('requiredSkillsAndExperience', index)
                                    }
                                    className="p-2 text-text-muted hover:text-error-500 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg transition-all duration-200"
                                    aria-label="Remove requirement"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <button
                      onClick={() => addArrayItem('requiredSkillsAndExperience')}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-xl transition-all duration-200 w-full justify-center border-2 border-dashed border-primary-200 dark:border-primary-800 hover:border-primary-400 dark:hover:border-primary-600"
                    >
                      <Plus className="w-4 h-4" />
                      Add Requirement
                    </button>
                  </div>
                </div>

                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-success-600 dark:text-success-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-text-primary">Nice to Have</h4>
                      <p className="text-sm text-text-tertiary mt-0.5">
                        Optional experiences and qualities that would be beneficial.
                      </p>
                    </div>
                  </div>
                  <div className="px-8 py-6 space-y-3">
                    {formData.niceToHave.map((item, index) => {
                      const isEditing =
                        editingField?.field === 'niceToHave' && editingField.index === index
                      return (
                        <div key={index} className="group">
                          {isEditing ? (
                            <div className="bg-background-subtle rounded-xl p-4 border-2 border-success-500 shadow-sm">
                              <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="e.g. Experience with Kubernetes and container orchestration"
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className="w-full px-4 py-3 bg-background-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500/20 focus:border-success-500 text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-all duration-200 resize-none min-h-[80px]"
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end mt-3">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-background-surface border border-border-default hover:border-border-strong rounded-lg transition-all duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-4 py-2 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg transition-all duration-200 shadow-sm"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'flex items-start gap-3 p-4 rounded-xl border transition-all duration-200',
                                'hover:shadow-sm hover:border-success-200 dark:hover:border-success-800',
                                isGenerated && item
                                  ? 'bg-success-50/50 dark:bg-success-950/30 border-success-200 dark:border-success-800'
                                  : 'bg-background-subtle border-border-default'
                              )}
                            >
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success-100 dark:bg-success-900/50 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-success-600 dark:text-success-400">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <textarea
                                  value={item}
                                  onChange={e =>
                                    updateArrayField('niceToHave', index, e.target.value)
                                  }
                                  placeholder="e.g. Experience with Kubernetes and container orchestration"
                                  rows={Math.max(1, Math.ceil(item.length / 70))}
                                  className="w-full bg-transparent border-none focus:outline-none text-base leading-relaxed text-text-primary placeholder:text-text-muted resize-none"
                                />
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() => startEditing('niceToHave', index, item)}
                                  className="p-2 text-text-muted hover:text-success-600 dark:hover:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-all duration-200"
                                  aria-label="Edit nice to have"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {formData.niceToHave.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeArrayItem('niceToHave', index)}
                                    className="p-2 text-text-muted hover:text-error-500 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg transition-all duration-200"
                                    aria-label="Remove nice to have"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <button
                      onClick={() => addArrayItem('niceToHave')}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300 hover:bg-success-50 dark:hover:bg-success-950/30 rounded-xl transition-all duration-200 w-full justify-center border-2 border-dashed border-success-200 dark:border-success-800 hover:border-success-400 dark:hover:border-success-600"
                    >
                      <Plus className="w-4 h-4" />
                      Add Nice to Have
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Compensation */}
            {getContentStep(currentStep) === 4 && (
              <div className="space-y-8">
                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-950/30 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                    </div>
                    <h4 className="text-xl font-bold text-text-primary">Salary & Timeline</h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-text-tertiary" />
                          Min Salary
                        </label>
                        <input
                          type="number"
                          value={formData.salaryMin}
                          onChange={e => updateField('salaryMin', e.target.value)}
                          placeholder="80000"
                          className={cn(
                            'w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-border-strong',
                            'text-base text-text-primary placeholder:text-text-muted transition-all duration-200'
                          )}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-text-tertiary" />
                          Max Salary
                        </label>
                        <input
                          type="number"
                          value={formData.salaryMax}
                          onChange={e => updateField('salaryMax', e.target.value)}
                          placeholder="120000"
                          className={cn(
                            'w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-border-strong',
                            'text-base text-text-primary placeholder:text-text-muted transition-all duration-200'
                          )}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                          <Coins className="w-4 h-4 text-text-tertiary" />
                          Currency
                        </label>
                        <SelectDropdown
                          value={formData.currency}
                          onChange={value => updateField('currency', value)}
                          placeholder="Select currency..."
                          options={[
                            { value: 'INR', label: 'INR' },
                            { value: 'USD', label: 'USD' },
                            { value: 'NPR', label: 'NPR' },
                          ]}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-tertiary" />
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={e => updateField('applicationDeadline', e.target.value)}
                        className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-border-strong text-base text-text-primary transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-success-600 dark:text-success-400" />
                    </div>
                    <h4 className="text-xl font-bold text-text-primary">Benefits & Perks</h4>
                  </div>
                  <div className="px-8 py-6 space-y-3">
                    {formData.benefits.map((benefit, index) => {
                      const isEditing =
                        editingField?.field === 'benefits' && editingField.index === index
                      return (
                        <div key={index} className="group">
                          {isEditing ? (
                            <div className="bg-background-subtle rounded-xl p-4 border-2 border-success-500 shadow-sm">
                              <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="e.g. Flexible work hours and remote work options"
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className="w-full px-4 py-3 bg-background-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500/20 focus:border-success-500 text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-all duration-200 resize-none min-h-[80px]"
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end mt-3">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-background-surface border border-border-default hover:border-border-strong rounded-lg transition-all duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-4 py-2 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg transition-all duration-200 shadow-sm"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'flex items-start gap-3 p-4 rounded-xl border transition-all duration-200',
                                'hover:shadow-sm hover:border-success-200 dark:hover:border-success-800',
                                isGenerated && benefit
                                  ? 'bg-success-50/50 dark:bg-success-950/30 border-success-200 dark:border-success-800'
                                  : 'bg-background-subtle border-border-default'
                              )}
                            >
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success-100 dark:bg-success-900/50 flex items-center justify-center mt-0.5">
                                <Gift className="w-3.5 h-3.5 text-success-600 dark:text-success-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <textarea
                                  value={benefit}
                                  onChange={e =>
                                    updateArrayField('benefits', index, e.target.value)
                                  }
                                  placeholder="e.g. Flexible work hours and remote work options"
                                  rows={Math.max(1, Math.ceil(benefit.length / 70))}
                                  className="w-full bg-transparent border-none focus:outline-none text-base leading-relaxed text-text-primary placeholder:text-text-muted resize-none"
                                />
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() => startEditing('benefits', index, benefit)}
                                  className="p-2 text-text-muted hover:text-success-600 dark:hover:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-all duration-200"
                                  aria-label="Edit benefit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {formData.benefits.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeArrayItem('benefits', index)}
                                    className="p-2 text-text-muted hover:text-error-500 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg transition-all duration-200"
                                    aria-label="Remove benefit"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <button
                      onClick={() => addArrayItem('benefits')}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300 hover:bg-success-50 dark:hover:bg-success-950/30 rounded-xl transition-all duration-200 w-full justify-center border-2 border-dashed border-success-200 dark:border-success-800 hover:border-success-400 dark:hover:border-success-600"
                    >
                      <Plus className="w-4 h-4" />
                      Add Benefit
                    </button>
                  </div>
                </div>

                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                    </div>
                    <h4 className="text-xl font-bold text-text-primary">AI Shortlisting</h4>
                  </div>
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-text-secondary leading-relaxed">
                          When enabled, candidates will be automatically shortlisted when this job
                          expires. This helps streamline your recruitment process by identifying top
                          candidates using AI.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-6">
                        <input
                          type="checkbox"
                          checked={formData.autoShortlist}
                          onChange={e => updateField('autoShortlist', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-background-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background-surface after:border-border-strong after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {}
      {!isGenerating && (
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 bg-background-surface border-t border-border-default shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <ActionButton onClick={handlePrev} variant="ghost" size="md">
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </ActionButton>

          <div className="flex items-center gap-3">
            {currentStep === steps.length ? (
              <div className="flex gap-3">
                {(jobToEdit || isGenerated) && (
                  <ActionButton
                    onClick={() => setShowRevisionPrompt(true)}
                    variant="outline"
                    size="md"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Revise with AI
                  </ActionButton>
                )}
                <ActionButton
                  onClick={handleSaveDraft}
                  variant="outline"
                  size="md"
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                  loading={createJobMutation.isPending || updateJobMutation.isPending}
                >
                  {!(createJobMutation.isPending || updateJobMutation.isPending) &&
                    (jobToEdit ? 'Save as Draft' : 'Save Draft')}
                </ActionButton>
                <ActionButton
                  onClick={handleSubmit}
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                  loading={createJobMutation.isPending || updateJobMutation.isPending}
                  variant="primary"
                  size="md"
                >
                  {!(createJobMutation.isPending || updateJobMutation.isPending) && (
                    <>
                      {jobToEdit && jobToEdit.status === 'Draft'
                        ? 'Publish Job'
                        : jobToEdit
                          ? 'Update & Publish'
                          : 'Publish Job'}
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </ActionButton>
              </div>
            ) : (
              <div className="flex gap-3">
                {jobToEdit && (
                  <ActionButton
                    onClick={() => setShowRevisionPrompt(true)}
                    variant="outline"
                    size="md"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Revise with AI
                  </ActionButton>
                )}
                <ActionButton
                  onClick={handleSaveDraft}
                  variant="outline"
                  size="md"
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                  loading={createJobMutation.isPending || updateJobMutation.isPending}
                >
                  {!(createJobMutation.isPending || updateJobMutation.isPending) &&
                    (jobToEdit ? 'Save as Draft' : 'Save Draft')}
                </ActionButton>
                <ActionButton onClick={handleNext} variant="primary" size="md">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </ActionButton>
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {showRevisionPrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRevisionPrompt(false)}
          />

          {}
          <div className="relative bg-background-surface rounded-[2rem] shadow-2xl w-full max-w-lg border border-border-default/50 overflow-hidden animate-in zoom-in-95 duration-200">
            {}
            <div className="bg-background-surface px-10 py-8 border-b border-border-subtle">
              <h3 className="text-3xl font-bold text-text-primary leading-tight tracking-tight">
                Request AI Revision
              </h3>
              <p className="text-text-tertiary mt-2 font-medium text-lg">
                Tell the AI what you&apos;d like to change or improve
              </p>
            </div>

            {}
            <div className="px-10 py-8 space-y-8">
              {}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-4">
                  Quick Suggestions
                </label>
                <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto pr-2">
                  {revisionSuggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        'px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                        'border border-border-default bg-background-surface text-text-secondary',
                        'hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-700 dark:hover:text-primary-300',
                        'cursor-pointer active:scale-95'
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-3">
                  Or Type Your Own Revision Instructions
                </label>
                <textarea
                  value={revisionText}
                  onChange={e => setRevisionText(e.target.value)}
                  placeholder="e.g., Make the requirements more specific, add more technical details, adjust the tone to be more formal..."
                  rows={5}
                  maxLength={500}
                  className={cn(
                    'w-full px-4 py-3 border border-border-default rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                    'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                    'resize-y min-h-[120px] transition-colors duration-200'
                  )}
                />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-text-tertiary">
                    Be specific about what you want changed
                  </p>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      revisionText.length > 450 ? 'text-warning-600' : 'text-text-muted'
                    )}
                  >
                    {revisionText.length}/500
                  </span>
                </div>
              </div>
            </div>

            {}
            <div className="px-10 py-6 bg-background-surface border-t border-border-subtle flex justify-end gap-3">
              <ActionButton
                onClick={() => setShowRevisionPrompt(false)}
                variant="outline"
                size="md"
              >
                Cancel
              </ActionButton>
              <ActionButton
                onClick={handleRevision}
                disabled={!revisionText.trim() || generateDraftMutation.isPending}
                loading={generateDraftMutation.isPending}
                variant="primary"
                size="md"
              >
                {!generateDraftMutation.isPending && (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Revise
                  </>
                )}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
