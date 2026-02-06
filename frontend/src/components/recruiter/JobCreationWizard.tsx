'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Building2,
  DollarSign,
  FileText,
  Loader2,
  RotateCcw,
  Briefcase,
  Pencil,
  X as XIcon,
  ChevronDown,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useCreateJob, useGenerateJobDraft, useUpdateJob } from '../../hooks/queries/useJobs'
import { useReferenceJDs } from '../../hooks/queries/useReferenceJDs'
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

interface CustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder: string
  disabled?: boolean
  className?: string
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        onKeyDown={e => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        className={cn(
          'w-full h-12 pl-4 pr-10 py-3 border rounded-xl bg-background-surface text-left focus:outline-none text-base text-text-primary transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]',
          disabled
            ? 'opacity-50 cursor-not-allowed border-border-default'
            : isOpen
              ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md'
              : 'border-border-default hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-primary-50/30 hover:shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
        )}
      >
        <div className="flex items-center gap-3 h-full">
          {selectedOption ? (
            <span className="font-medium text-text-primary">{selectedOption.label}</span>
          ) : (
            <span className="text-text-tertiary">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-200',
            disabled
              ? 'text-text-muted'
              : isOpen
                ? 'rotate-180 text-primary-600'
                : 'text-text-muted group-hover:text-primary-500'
          )}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-background-surface border border-primary-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200 ring-1 ring-primary-100">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value)
                  setIsOpen(false)
                }
              }}
              className={cn(
                'w-full px-4 py-3 text-left focus:outline-none transition-all duration-200 flex items-center gap-3 text-base',
                option.disabled
                  ? 'text-text-muted cursor-not-allowed bg-background-subtle'
                  : 'text-text-primary hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-50 focus:bg-gradient-to-r focus:from-primary-50 focus:to-primary-50 transform hover:scale-[1.01] active:scale-[0.99] group'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="font-medium">{option.label}</span>
              {!option.disabled && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="w-2 h-2 bg-ai-500 rounded-full animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
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
                        ? 'text-primary-700 border-b-[3px] border-primary-600'
                        : 'text-text-secondary hover:text-text-primary border-b-[3px] border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
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
                    {}
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Job Title <span className="text-red-400 dark:text-red-300">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => updateField('title', e.target.value)}
                        placeholder="e.g. Senior ML Engineer"
                        className="w-full px-4 py-3 bg-background-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary text-text-primary placeholder:text-text-muted transition-all text-base"
                      />
                    </div>

                    {}
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Reference Job Description{' '}
                        <span className="text-red-400 dark:text-red-300">*</span>
                      </label>
                      <CustomDropdown
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
                                  const jobSummary = refJD.job_summary || refJD.role_overview || ''
                                  return {
                                    value: refJD.id,
                                    label: refJD.department
                                      ? `${refJD.department} - ${jobSummary.slice(0, 50)}...`
                                      : jobSummary.slice(0, 80),
                                  }
                                })
                              : [{ value: '', label: 'No reference JDs available', disabled: true }]
                        }
                      />
                      <p className="text-xs text-text-tertiary mt-2">
                        {referenceJDsData?.reference_jds &&
                        referenceJDsData.reference_jds.length > 0
                          ? 'Select a reference JD to guide the AI in generating a similar job description.'
                          : 'Create reference JDs in your organization to use them as templates for AI generation.'}
                      </p>
                    </div>

                    {}
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Keywords & Requirements{' '}
                        <span className="text-red-400 dark:text-red-300">*</span>
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
                        className="w-full px-4 py-3 bg-background-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary text-text-primary placeholder:text-text-muted transition-all resize-none text-base"
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
                        'group relative w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg overflow-hidden',
                        !isGenerating &&
                          !generateDraftMutation.isPending &&
                          formData.title.trim() &&
                          formData.keywords.trim() &&
                          formData.reference_jd_id
                          ? 'bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500 text-white shadow-primary-500/25 hover:from-primary-700 hover:to-blue-700 dark:hover:from-primary-600 dark:hover:to-blue-600 hover:shadow-primary-500/40 hover:-translate-y-0.5'
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
                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                            <span>{jobToEdit ? 'Revise with AI' : 'Generate with AI'}</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                )}

                {}
                {activeTab === 'manual' && (
                  <div className="px-8 py-6 space-y-6">
                    {}
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Job Title <span className="text-red-400 dark:text-red-300">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => updateField('title', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full px-4 py-3 bg-background-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary text-text-primary placeholder:text-text-muted transition-all text-base"
                      />
                    </div>

                    {}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          Department <span className="text-red-400 dark:text-red-300">*</span>
                        </label>
                        <CustomDropdown
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
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          Level <span className="text-error-400 dark:text-error-300">*</span>
                        </label>
                        <CustomDropdown
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

                    {}
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Job Summary <span className="text-error-400 dark:text-error-300">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                        rows={Math.max(4, Math.ceil(formData.description.length / 80))}
                        placeholder="Summarize what this role is about..."
                        className="w-full px-4 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-y text-base leading-relaxed text-text-primary placeholder:text-text-muted min-h-[100px] max-h-[300px] overflow-y-auto"
                      />
                    </div>

                    {}
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Job Responsibilities
                      </label>
                      <p className="text-sm text-text-tertiary mb-3">
                        Add key responsibilities and duties for this role.
                      </p>
                      <div className="space-y-4">
                        {formData.jobResponsibilities.map((item, index) => {
                          const isEditing =
                            editingField?.field === 'jobResponsibilities' &&
                            editingField.index === index
                          return (
                            <div key={index} className="relative">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                    className="w-full px-4 pr-14 py-3 border-2 border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="px-3 py-1.5 text-sm text-text-tertiary hover:text-text-primary hover:bg-background-subtle rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      className="px-3 py-1.5 text-sm text-text-inverse bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <textarea
                                    value={item}
                                    onChange={e =>
                                      updateArrayField('jobResponsibilities', index, e.target.value)
                                    }
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(item.length / 60))}
                                    className={cn(
                                      'w-full px-4 pr-14 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary',
                                      'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                                      'transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto',
                                      'whitespace-pre-wrap break-words',
                                      isGenerated &&
                                        item &&
                                        'bg-ai-50/50 dark:bg-ai-950/30 border-ai-200 dark:border-ai-800'
                                    )}
                                  />
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditing('jobResponsibilities', index, item)
                                      }
                                      className="absolute p-1.5 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded hover:bg-primary-50 dark:hover:bg-primary-900/30"
                                      style={{
                                        right: '40px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                      }}
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
                                        className="absolute p-1.5 text-text-muted hover:text-error-500 dark:hover:text-error-400 transition-colors rounded hover:bg-error-50 dark:hover:bg-error-950/30"
                                        style={{
                                          right: '12px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                        }}
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
                          className="text-sm text-primary-500 font-medium hover:underline cursor-pointer"
                        >
                          + Add responsibility
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
                  <div className="bg-gradient-to-r from-ai-50 to-ai-100 dark:from-ai-950/30 dark:to-ai-900/30 border border-ai-200 dark:border-ai-800 rounded-xl px-8 py-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-background-surface flex items-center justify-center flex-shrink-0 shadow-sm border border-ai-200">
                      <Sparkles className="w-5 h-5 text-ai-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-ai-900 dark:text-ai-100 mb-2">
                        AI Magic Applied!
                      </h4>
                      <p className="text-sm text-ai-700 dark:text-ai-300 leading-relaxed">
                        We&apos;ve generated a professional job description based on your
                        requirements. Review the highlighted fields below and make any edits you
                        need.
                      </p>
                    </div>
                  </div>
                )}
                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle">
                    <h4 className="text-xl font-bold text-text-primary">Basic Information</h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Job Title *
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
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          Department *
                        </label>
                        <CustomDropdown
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
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          Level *
                        </label>
                        <CustomDropdown
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

                    {}
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Job Summary *
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

                    {}
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Job Responsibilities
                      </label>
                      <p className="text-sm text-text-tertiary mb-3">
                        Add key responsibilities and duties for this role.
                      </p>
                      <div className="space-y-4">
                        {formData.jobResponsibilities.map((item, index) => {
                          const isEditing =
                            editingField?.field === 'jobResponsibilities' &&
                            editingField.index === index
                          return (
                            <div key={index} className="relative">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                    className="w-full px-4 pr-14 py-3 border-2 border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="px-3 py-1.5 text-sm text-text-tertiary hover:text-text-primary hover:bg-background-subtle rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      className="px-3 py-1.5 text-sm text-text-inverse bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <textarea
                                    value={item}
                                    onChange={e =>
                                      updateArrayField('jobResponsibilities', index, e.target.value)
                                    }
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(item.length / 60))}
                                    className={cn(
                                      'w-full px-4 pr-14 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary',
                                      'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                                      'transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto',
                                      'whitespace-pre-wrap break-words',
                                      isGenerated &&
                                        item &&
                                        'bg-ai-50/50 dark:bg-ai-950/30 border-ai-200 dark:border-ai-800'
                                    )}
                                  />
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditing('jobResponsibilities', index, item)
                                      }
                                      className="absolute p-1.5 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded hover:bg-primary-50 dark:hover:bg-primary-900/30"
                                      style={{
                                        right: '40px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                      }}
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
                                        className="absolute p-1.5 text-text-muted hover:text-error-500 dark:hover:text-error-400 transition-colors rounded hover:bg-error-50 dark:hover:bg-error-950/30"
                                        style={{
                                          right: '12px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                        }}
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
                          className="text-sm text-primary-500 font-medium hover:underline cursor-pointer"
                        >
                          + Add responsibility
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            {getContentStep(currentStep) === 2 && (
              <div className="space-y-8">
                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle">
                    <h4 className="text-xl font-bold text-text-primary">Job Details</h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.locationCity}
                          onChange={e => updateField('locationCity', e.target.value)}
                          placeholder="e.g. "
                          className={cn(
                            'w-full px-4 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                            'text-base text-text-primary placeholder:text-text-muted transition-colors duration-200',
                            isGenerated &&
                              formData.locationCity &&
                              'bg-primary-50/50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          Country *
                        </label>
                        <input
                          type="text"
                          value={formData.locationCountry}
                          onChange={e => updateField('locationCountry', e.target.value)}
                          placeholder="e.g. Nepal"
                          className={cn(
                            'w-full px-4 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                            'text-base text-text-primary placeholder:text-text-muted transition-colors duration-200',
                            isGenerated &&
                              formData.locationCountry &&
                              'bg-primary-50/50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Location Type *
                      </label>
                      <CustomDropdown
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
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Employment Type *
                      </label>
                      <CustomDropdown
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

            {}
            {getContentStep(currentStep) === 3 && (
              <div className="space-y-8">
                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle">
                    <h4 className="text-xl font-bold text-text-primary">Required Qualifications</h4>
                    <p className="text-sm text-text-tertiary mt-2">
                      Add requirements, skills, and education here.
                    </p>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    {formData.requiredSkillsAndExperience.map((item, index) => {
                      const isEditing =
                        editingField?.field === 'requiredSkillsAndExperience' &&
                        editingField.index === index
                      return (
                        <div key={index} className="relative">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="e.g. Strong experience with Python for backend development"
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className={cn(
                                  'w-full px-4 pr-14 py-3 border-2 border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                  'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                                  'transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto',
                                  'whitespace-pre-wrap break-words'
                                )}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
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
                                rows={Math.max(2, Math.ceil(item.length / 60))}
                                className={cn(
                                  'w-full px-4 pr-14 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary',
                                  'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                                  'transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto',
                                  'whitespace-pre-wrap break-words',
                                  isGenerated &&
                                    item &&
                                    'bg-ai-50/50 dark:bg-ai-950/30 border-ai-200 dark:border-ai-800'
                                )}
                              />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEditing('requiredSkillsAndExperience', index, item)
                                  }
                                  className="absolute p-1.5 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded hover:bg-primary-50 dark:hover:bg-primary-900/30"
                                  style={{
                                    right: '40px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                  }}
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
                                    className="absolute p-1.5 text-text-muted hover:text-error-500 dark:hover:text-error-400 transition-colors rounded hover:bg-error-50 dark:hover:bg-error-950/30"
                                    style={{
                                      right: '12px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                    }}
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
                      className="text-sm text-primary-500 font-medium hover:underline cursor-pointer"
                    >
                      + Add requirements
                    </button>
                  </div>
                </div>

                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle">
                    <h4 className="text-xl font-bold text-text-primary">Preferred</h4>
                    <p className="text-sm text-text-tertiary mt-2">
                      Optional experiences, qualities that would be beneficial but not strictly
                      required for this role.
                    </p>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    {formData.niceToHave.map((item, index) => {
                      const isEditing =
                        editingField?.field === 'niceToHave' && editingField.index === index
                      return (
                        <div key={index} className="relative">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="e.g. Experience with Kubernetes and container orchestration"
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className={cn(
                                  'w-full px-4 pr-14 py-3 border-2 border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                  'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                                  'transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto',
                                  'whitespace-pre-wrap break-words'
                                )}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <textarea
                                value={item}
                                onChange={e =>
                                  updateArrayField('niceToHave', index, e.target.value)
                                }
                                placeholder="e.g. Experience with Kubernetes and container orchestration"
                                rows={Math.max(2, Math.ceil(item.length / 60))}
                                className={cn(
                                  'w-full px-4 pr-14 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary',
                                  'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                                  'transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto',
                                  'whitespace-pre-wrap break-words',
                                  isGenerated &&
                                    item &&
                                    'bg-ai-50/50 dark:bg-ai-950/30 border-ai-200 dark:border-ai-800'
                                )}
                              />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <button
                                  type="button"
                                  onClick={() => startEditing('niceToHave', index, item)}
                                  className="absolute p-1.5 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded hover:bg-primary-50 dark:hover:bg-primary-900/30"
                                  style={{
                                    right: '40px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                  }}
                                  aria-label="Edit nice to have"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {formData.niceToHave.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeArrayItem('niceToHave', index)}
                                    className="absolute p-1.5 text-text-muted hover:text-error-500 dark:hover:text-error-400 transition-colors rounded hover:bg-error-50 dark:hover:bg-error-950/30"
                                    style={{
                                      right: '12px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                    }}
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
                      className="text-sm text-primary-500 font-medium hover:underline cursor-pointer"
                    >
                      + Add nice to have
                    </button>
                  </div>
                </div>
              </div>
            )}

            {}
            {getContentStep(currentStep) === 4 && (
              <div className="space-y-8">
                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle">
                    <h4 className="text-xl font-bold text-text-primary">Compensation</h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          Min Salary
                        </label>
                        <input
                          type="number"
                          value={formData.salaryMin}
                          onChange={e => updateField('salaryMin', e.target.value)}
                          placeholder="80000"
                          className={cn(
                            'w-full px-4 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                            'text-base text-text-primary placeholder:text-text-muted transition-colors duration-200'
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          Max Salary
                        </label>
                        <input
                          type="number"
                          value={formData.salaryMax}
                          onChange={e => updateField('salaryMax', e.target.value)}
                          placeholder="120000"
                          className={cn(
                            'w-full px-4 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                            'text-base text-text-primary placeholder:text-text-muted transition-colors duration-200'
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-3">
                          Currency
                        </label>
                        <CustomDropdown
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
                      <label className="block text-sm font-semibold text-text-secondary mb-3">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={e => updateField('applicationDeadline', e.target.value)}
                        className="w-full px-4 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-base text-text-primary transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle">
                    <h4 className="text-xl font-bold text-text-primary">Compensation & Benefits</h4>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    {formData.benefits.map((benefit, index) => {
                      const isEditing =
                        editingField?.field === 'benefits' && editingField.index === index
                      return (
                        <div key={index} className="relative">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                placeholder="Add what we offer..."
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className={cn(
                                  'w-full px-4 pr-14 py-3 border-2 border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                  'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                                  'transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto',
                                  'whitespace-pre-wrap break-words'
                                )}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <textarea
                                value={benefit}
                                onChange={e => updateArrayField('benefits', index, e.target.value)}
                                placeholder="Add what we offer..."
                                rows={Math.max(2, Math.ceil(benefit.length / 60))}
                                className={cn(
                                  'w-full px-4 pr-14 py-3 border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                                  'text-base leading-relaxed text-text-primary placeholder:text-text-muted',
                                  'transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto',
                                  'whitespace-pre-wrap break-words',
                                  isGenerated &&
                                    benefit &&
                                    'bg-primary-50/50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
                                )}
                              />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <button
                                  type="button"
                                  onClick={() => startEditing('benefits', index, benefit)}
                                  className="absolute p-1.5 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded hover:bg-primary-50 dark:hover:bg-primary-900/30"
                                  style={{
                                    right: '40px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                  }}
                                  aria-label="Edit benefit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {formData.benefits.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeArrayItem('benefits', index)}
                                    className="absolute p-1.5 text-text-muted hover:text-error-500 dark:hover:text-error-400 transition-colors rounded hover:bg-error-50 dark:hover:bg-error-950/30"
                                    style={{
                                      right: '12px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                    }}
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
                      className="text-sm text-primary-500 font-medium hover:underline cursor-pointer"
                    >
                      + Add offering
                    </button>
                  </div>
                </div>

                <div className="bg-background-surface rounded-xl border border-border-default shadow-sm">
                  <div className="px-8 py-6 border-b border-border-subtle">
                    <h4 className="text-xl font-bold text-text-primary">Automatic Shortlisting</h4>
                  </div>
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-text-tertiary leading-relaxed">
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
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 px-5 py-2.5 text-text-tertiary text-sm font-semibold hover:text-text-primary hover:bg-background-subtle rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {}
            {currentStep === steps.length ? (
              <div className="flex gap-3">
                {}
                {(jobToEdit || isGenerated) && (
                  <button
                    onClick={() => setShowRevisionPrompt(true)}
                    className="flex items-center gap-2 px-5 py-2.5 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-200 border border-transparent hover:border-primary-100 dark:hover:border-primary-900"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Revise with AI
                  </button>
                )}
                <button
                  onClick={handleSaveDraft}
                  className={cn(
                    'px-5 py-2.5 text-text-secondary text-sm font-semibold rounded-xl transition-all duration-200 border border-border-default',
                    createJobMutation.isPending || updateJobMutation.isPending
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-background-subtle hover:border-border-strong hover:text-text-primary'
                  )}
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                >
                  {createJobMutation.isPending || updateJobMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : jobToEdit ? (
                    'Save as Draft'
                  ) : (
                    'Save Draft'
                  )}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 btn-primary-gradient text-sm font-bold rounded-xl transition-all duration-300',
                    createJobMutation.isPending || updateJobMutation.isPending
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:-translate-y-0.5'
                  )}
                >
                  {createJobMutation.isPending || updateJobMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      {jobToEdit && jobToEdit.status === 'Draft'
                        ? 'Publish Job'
                        : jobToEdit
                          ? 'Update & Publish'
                          : 'Publish Job'}
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                {}
                {jobToEdit && (
                  <button
                    onClick={() => setShowRevisionPrompt(true)}
                    className="flex items-center gap-2 px-5 py-2.5 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-200 border border-transparent hover:border-primary-100 dark:hover:border-primary-900"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Revise with AI
                  </button>
                )}
                {}
                <button
                  onClick={handleSaveDraft}
                  className={cn(
                    'px-5 py-2.5 text-text-secondary text-sm font-semibold rounded-xl transition-all duration-200 border border-border-default',
                    createJobMutation.isPending || updateJobMutation.isPending
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-background-subtle hover:border-border-strong hover:text-text-primary'
                  )}
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                >
                  {createJobMutation.isPending || updateJobMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : jobToEdit ? (
                    'Save as Draft'
                  ) : (
                    'Save Draft'
                  )}
                </button>
                {}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 btn-primary-gradient text-sm font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
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
              <button
                onClick={() => setShowRevisionPrompt(false)}
                className="px-5 py-2.5 text-text-tertiary text-sm font-semibold hover:bg-background-subtle rounded-xl transition-all duration-200 border border-border-default hover:border-border-strong"
              >
                Cancel
              </button>
              <button
                onClick={handleRevision}
                disabled={!revisionText.trim() || generateDraftMutation.isPending}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300',
                  revisionText.trim() && !generateDraftMutation.isPending
                    ? 'btn-primary-gradient hover:-translate-y-0.5'
                    : 'bg-background-muted text-text-muted cursor-not-allowed'
                )}
              >
                {generateDraftMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Revising...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Revise
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
