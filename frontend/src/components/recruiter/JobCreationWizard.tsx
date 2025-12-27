/**
 * JobCreationWizard - Multi-step job creation form
 * Supports both Agent mode (AI-assisted) and Manual mode
 */

'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCreateJob, useGenerateJobDraft } from '../../hooks/queries/useJobs';
import { toast } from 'sonner';
import type { CreateJobRequest, JobLevel, LocationType, EmploymentType } from '../../types/job';

interface JobCreationWizardProps {
    mode: 'agent' | 'manual';
    onBack: () => void;
    onComplete: () => void;
}

// Wizard steps - different order for agent vs manual mode
const getSteps = (mode: 'agent' | 'manual') => {
    if (mode === 'agent') {
        return [
            { id: 1, title: 'Basic Info', icon: Building2 },
            { id: 2, title: 'Requirements', icon: Briefcase },
            { id: 3, title: 'Compensation', icon: DollarSign },
            { id: 4, title: 'Job Details', icon: FileText },
        ];
    }
    return [
        { id: 1, title: 'Basic Info', icon: Building2 },
        { id: 2, title: 'Job Details', icon: FileText },
        { id: 3, title: 'Requirements', icon: Briefcase },
        { id: 4, title: 'Compensation', icon: DollarSign },
    ];
};

// Skeleton loader component
function SkeletonLine({ className }: { className?: string }) {
    return (
        <div
            className={cn('h-4 bg-slate-100 rounded animate-pulse', className)}
            style={{
                background: 'linear-gradient(90deg, #F1F5F9 25%, #F8FAFC 50%, #F1F5F9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
            }}
        />
    );
}

// Pre-built revision suggestions
const revisionSuggestions = [
    "Make the requirements more specific and detailed",
    "Add more technical skills and technologies",
    "Make the tone more professional and formal",
    "Add more information about the company culture",
    "Expand the 'What We Offer' section with more benefits",
    "Make the job description more concise and focused",
    "Add more details about day-to-day responsibilities",
    "Include more information about growth opportunities",
    "Make the requirements less strict, more flexible",
    "Add more context about the team and work environment",
];

export function JobCreationWizard({ mode, onBack, onComplete }: JobCreationWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
    const [revisionText, setRevisionText] = useState('');

    const createJobMutation = useCreateJob();
    const generateDraftMutation = useGenerateJobDraft();

    // Get steps based on mode
    const steps = getSteps(mode);

    // Helper function to get the actual content step based on mode and current step
    const getContentStep = (step: number): number => {
        if (mode === 'agent') {
            // Agent mode: 1=Basic, 2=Requirements, 3=Compensation, 4=Job Details
            const agentMapping: { [key: number]: number } = {
                1: 1, // Basic Info
                2: 3, // Requirements
                3: 4, // Compensation
                4: 2, // Job Details
            };
            return agentMapping[step] || step;
        }
        // Manual mode: keep original order
        return step;
    };

    // Handle clicking a suggestion
    const handleSuggestionClick = (suggestion: string) => {
        setRevisionText(suggestion);
    };

    // Form state
    const [formData, setFormData] = useState({
        // Basic Info
        title: '',
        department: '',
        level: '',
        keywords: '',
        referenceJD: '',
        // Job Details
        description: '',
        locationCity: '',
        locationCountry: '',
        locationType: '',
        employmentType: '',
        // Requirements and Skills (combined)
        requiredSkillsAndExperience: [''],
        niceToHave: [''],
        // Compensation
        salaryMin: '',
        salaryMax: '',
        currency: 'NPR',
        benefits: [''],
        applicationDeadline: '',
    });

    // Handle AI generation
    const handleGenerate = async () => {
        if (!formData.title || !formData.keywords) {
            toast.error('Missing information', {
                description: 'Please provide a job title and requirements to generate a description.',
            });
            return;
        }

        setIsGenerating(true);

        try {
            // Call API to generate job draft (does not save to database)
            const result = await generateDraftMutation.mutateAsync({
                title: formData.title,
                raw_requirements: formData.keywords,
                reference_jd: formData.referenceJD || undefined,
            });

            setIsGenerating(false);
            setIsGenerated(true);

            // Auto-fill form with generated data
            setFormData((prev) => ({
                ...prev,
                title: result.title || prev.title,
                description: result.description || '',
                requiredSkillsAndExperience: result.requiredSkillsAndExperience.length > 0
                    ? result.requiredSkillsAndExperience
                    : prev.requiredSkillsAndExperience,
                niceToHave: result.niceToHave.length > 0
                    ? result.niceToHave
                    : prev.niceToHave,
                benefits: result.benefits.length > 0
                    ? result.benefits
                    : prev.benefits,
                // Keep user's other preferences (location, salary, etc.)
            }));

            toast.success('Job description generated!', {
                description: 'AI-generated content has been filled in. Review and edit as needed.',
                duration: 4000,
            });

        } catch (err) {
            setIsGenerating(false);
            const error = err as { data?: { detail?: string; message?: string }; message?: string };
            const errorMessage = error?.data?.detail || error?.data?.message || error?.message || 'Failed to generate job description.';
            toast.error('Generation failed', {
                description: errorMessage,
            });
        }
    };

    // Handle revision request
    const handleRevision = async () => {
        if (!revisionText.trim()) return;

        setIsGenerating(true);
        setShowRevisionPrompt(false);

        try {
            // Call API to regenerate with revision feedback
            const result = await generateDraftMutation.mutateAsync({
                title: formData.title,
                raw_requirements: `${formData.keywords}\n\nRevision Request: ${revisionText}`,
                reference_jd: formData.referenceJD || undefined,
            });

            // Update form with revised content
            setFormData((prev) => ({
                ...prev,
                title: result.title || prev.title,
                description: result.description || prev.description,
                requiredSkillsAndExperience: result.requiredSkillsAndExperience.length > 0
                    ? result.requiredSkillsAndExperience
                    : prev.requiredSkillsAndExperience,
                niceToHave: result.niceToHave.length > 0
                    ? result.niceToHave
                    : prev.niceToHave,
                benefits: result.benefits.length > 0
                    ? result.benefits
                    : prev.benefits,
            }));

            setIsGenerating(false);
            setRevisionText('');

            toast.success('Job description revised!', {
                description: 'The AI has updated the content based on your feedback.',
                duration: 4000,
            });
        } catch (err) {
            setIsGenerating(false);
            const error = err as { data?: { detail?: string; message?: string }; message?: string };
            const errorMessage = error?.data?.detail || error?.data?.message || error?.message || 'Failed to revise job description.';
            toast.error('Revision failed', {
                description: errorMessage,
            });
        }
    };

    // Helper function to prepare job data
    const prepareJobData = (): CreateJobRequest => {
        // Filter out empty strings from arrays
        const filteredRequiredSkills = formData.requiredSkillsAndExperience.filter(item => item.trim() !== '');
        const filteredNiceToHave = formData.niceToHave.filter(item => item.trim() !== '');

        const salaryMin = formData.salaryMin ? parseInt(formData.salaryMin, 10) : 0;
        const salaryMax = formData.salaryMax ? parseInt(formData.salaryMax, 10) : 0;

        return {
            title: formData.title.trim(),
            company: 'Current Company', // TODO: Get from user context/company
            department: formData.department.trim() || 'General',
            level: (formData.level.trim() || 'Mid') as JobLevel,
            description: formData.description.trim() || '', // Allow empty for drafts
            requiredSkillsAndExperience: filteredRequiredSkills.length > 0 ? filteredRequiredSkills : [''], // At least one empty string for drafts
            niceToHave: filteredNiceToHave.length > 0 ? filteredNiceToHave : undefined,
            locationCity: formData.locationCity.trim() || '',
            locationCountry: formData.locationCountry.trim() || '',
            locationType: (formData.locationType || 'On-site') as LocationType,
            employmentType: (formData.employmentType.trim() || 'Full-time') as EmploymentType,
            salaryRange: {
                min: salaryMin,
                max: salaryMax,
                currency: formData.currency || 'NPR',
            },
            deadline: formData.applicationDeadline ? new Date(formData.applicationDeadline) : undefined,
            mode: mode,
        };
    };

    // Handle save as draft
    const handleSaveDraft = async () => {
        // Minimal validation for draft - only title is required
        if (!formData.title.trim()) {
            toast.error('Job title is required', {
                description: 'Please enter a job title to save as draft.',
            });
            return;
        }

        const jobData = prepareJobData('draft');

        try {
            await createJobMutation.mutateAsync(jobData);
            toast.success('Draft saved successfully!', {
                description: `${formData.title} has been saved as a draft.`,
                duration: 4000,
            });
            // Small delay to ensure toast is visible before closing modal
            setTimeout(() => {
                onComplete();
            }, 500);
        } catch (err) {
            // Extract error message from various possible error formats
            let errorMessage = 'Failed to save draft. Please try again.';
            const error = err as { data?: { detail?: string; message?: string }; message?: string };

            if (error) {
                // ApiError format (from apiClient)
                if (error.data) {
                    errorMessage = error.data.detail || error.data.message || error.message || errorMessage;
                }
                // Direct error message
                else if (error.message) {
                    errorMessage = error.message;
                }
            }

            toast.error('Failed to save draft', {
                description: errorMessage,
                duration: 5000,
            });
        }
    };

    // Handle form submission (publish)
    const handleSubmit = async () => {
        // Validate required fields for publishing
        if (!formData.title.trim()) {
            toast.error('Job title is required', {
                description: 'Please enter a job title to continue.',
            });
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Job description is required', {
                description: 'Please provide a description for this role.',
            });
            return;
        }
        const filteredRequiredSkills = formData.requiredSkillsAndExperience.filter(item => item.trim() !== '');
        if (filteredRequiredSkills.length === 0) {
            toast.error('Required skills missing', {
                description: 'Please add at least one required skill or experience.',
            });
            return;
        }

        const jobData = prepareJobData('active');

        try {
            await createJobMutation.mutateAsync(jobData);
            toast.success('Job created successfully!', {
                description: `${formData.title} has been published and is now live.`,
                duration: 4000,
            });
            onComplete();
        } catch (err) {
            // Handle ApiError from apiClient
            const error = err as { data?: { detail?: string; message?: string }; message?: string };
            const errorMessage = error?.data?.detail || error?.data?.message || error?.message || 'Failed to create job. Please try again.';
            toast.error('Failed to create job', {
                description: errorMessage,
                duration: 5000,
            });
        }
    };

    // Handle next step
    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    // Handle previous step
    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            onBack();
        }
    };

    // Update form field
    const updateField = (field: string, value: string | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Update array field
    const updateArrayField = (field: string, index: number, value: string) => {
        setFormData((prev) => {
            const arr = [...(prev[field as keyof typeof prev] as string[])];
            arr[index] = value;
            return { ...prev, [field]: arr };
        });
    };

    // Add to array field
    const addArrayItem = (field: string) => {
        setFormData((prev) => {
            const arr = [...(prev[field as keyof typeof prev] as string[]), ''];
            return { ...prev, [field]: arr };
        });
    };

    // Remove from array field
    const removeArrayItem = (field: string, index: number) => {
        setFormData((prev) => {
            const arr = (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index);
            return { ...prev, [field]: arr.length ? arr : [''] };
        });
    };

    return (
        <div className="flex flex-col h-[70vh]">
            {/* Progress Steps - Fixed Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                                            isCompleted
                                                ? 'bg-emerald-500 text-white'
                                                : isActive
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 text-slate-400'
                                        )}
                                    >
                                        {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-medium hidden sm:block',
                                            isActive ? 'text-slate-800' : 'text-slate-400'
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            'flex-1 h-px mx-3',
                                            currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                                        )}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Agent Mode: AI Generation */}
                {mode === 'agent' && currentStep === 1 && !isGenerated && (
                    <div className="space-y-5">
                        {/* Clean Form Card */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
                            {/* Job Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Job Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                    placeholder="e.g. Senior ML Engineer"
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition-all text-sm"
                                />
                            </div>

                            {/* Reference JD Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Reference JD (Structure) <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={formData.referenceJD}
                                    onChange={(e) => updateField('referenceJD', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all appearance-none cursor-pointer text-sm"
                                >
                                    <option value="">Select a reference JD...</option>
                                    <option value="eng-backend-senior">Senior Backend Engineer</option>
                                    <option value="eng-ml-senior">Senior ML Engineer</option>
                                    <option value="eng-frontend-senior">Senior Frontend Engineer</option>
                                    <option value="eng-devops-mid">DevOps Engineer</option>
                                    <option value="product-manager-senior">Senior Product Manager</option>
                                    <option value="design-product-senior">Senior Product Designer</option>
                                    <option value="marketing-growth-senior">Senior Growth Marketing Manager</option>
                                    <option value="data-scientist-senior">Senior Data Scientist</option>
                                    <option value="sales-enterprise-senior">Senior Enterprise Sales Executive</option>
                                </select>
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Determines the structure of the generated JD
                                </p>
                            </div>

                            {/* Keywords */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Keywords & Requirements <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={formData.keywords || ''}
                                    onChange={(e) => updateField('keywords', e.target.value)}
                                    placeholder="e.g. FastAPI, AWS, PyTorch, MLOps, 5 years experience..."
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition-all resize-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Generate Button - Inside form flow, not at bottom */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || generateDraftMutation.isPending}
                            className={cn(
                                'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-200 text-sm',
                                !isGenerating && !generateDraftMutation.isPending
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            )}
                        >
                            {(isGenerating || generateDraftMutation.isPending) ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Job Description
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Loading Skeleton */}
                {isGenerating && (
                    <div className="space-y-4 animate-pulse">
                        <div className="bg-white rounded-lg p-5 border border-slate-200">
                            <SkeletonLine className="w-28 h-4 mb-3" />
                            <SkeletonLine className="w-full h-9 mb-2" />
                            <SkeletonLine className="w-3/4 h-9" />
                        </div>
                        <div className="bg-white rounded-lg p-5 border border-slate-200">
                            <SkeletonLine className="w-36 h-4 mb-3" />
                            <SkeletonLine className="w-full h-20" />
                        </div>
                        <div className="bg-white rounded-lg p-5 border border-slate-200">
                            <SkeletonLine className="w-32 h-4 mb-3" />
                            <div className="flex gap-2">
                                <SkeletonLine className="w-20 h-7 rounded-full" />
                                <SkeletonLine className="w-24 h-7 rounded-full" />
                                <SkeletonLine className="w-16 h-7 rounded-full" />
                            </div>
                        </div>
                        <p className="text-center text-indigo-500 text-sm font-medium">
                            AI is generating your job posting...
                        </p>
                    </div>
                )}

                {/* Form Steps */}
                {!isGenerating && (
                    <>
                        {/* Step 1: Basic Info - Only show in Manual Mode OR after Agent Mode generation */}
                        {currentStep === 1 && (mode === 'manual' || isGenerated) && (
                            <div className="space-y-5">
                                {/* AI Generated Indicator */}
                                {mode === 'agent' && isGenerated && (
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <Sparkles className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-indigo-900 mb-1">
                                                AI-Generated Content
                                            </p>
                                            <p className="text-xs text-indigo-700">
                                                Review and edit the generated content below. Fields with AI-generated content are highlighted.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-5">
                                        <Building2 className="w-4 h-4 text-indigo-500" />
                                        Basic Information
                                    </h4>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Job Title *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => updateField('title', e.target.value)}
                                                placeholder="e.g. Senior Software Engineer"
                                                className={cn(
                                                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                    "text-base text-slate-800 placeholder:text-slate-400",
                                                    "transition-colors duration-200",
                                                    isGenerated && formData.title && "bg-indigo-50/50 border-indigo-200"
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Department *
                                                </label>
                                                <select
                                                    value={formData.department}
                                                    onChange={(e) => updateField('department', e.target.value)}
                                                    className={cn(
                                                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white",
                                                        "text-base text-slate-800 transition-colors duration-200",
                                                        isGenerated && formData.department && "bg-indigo-50/50 border-indigo-200"
                                                    )}
                                                >
                                                    <option value="">Select department...</option>
                                                    <option value="Engineering">Engineering</option>
                                                    <option value="Design">Design</option>
                                                    <option value="Product">Product</option>
                                                    <option value="Marketing">Marketing</option>
                                                    <option value="Sales">Sales</option>
                                                    <option value="Operations">Operations</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Level *
                                                </label>
                                                <select
                                                    value={formData.level}
                                                    onChange={(e) => updateField('level', e.target.value)}
                                                    className={cn(
                                                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white",
                                                        "text-base text-slate-800 transition-colors duration-200",
                                                        isGenerated && formData.level && "bg-indigo-50/50 border-indigo-200"
                                                    )}
                                                >
                                                    <option value="">Select level...</option>
                                                    <option value="Junior">Junior</option>
                                                    <option value="Mid">Mid-Level</option>
                                                    <option value="Senior">Senior</option>
                                                    <option value="Lead">Lead</option>
                                                    <option value="Principal">Principal</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* About the Role */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                About the Role *
                                            </label>
                                            <p className="text-xs text-slate-500 mb-3">
                                                Brief 2-3 sentence summary about this position.
                                            </p>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => updateField('description', e.target.value)}
                                                rows={Math.max(4, Math.ceil(formData.description.length / 80))}
                                                placeholder="Summarize what this role is about..."
                                                className={cn(
                                                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y",
                                                    "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                                    "min-h-[100px] max-h-[300px] overflow-y-auto",
                                                    isGenerated && formData.description && "bg-indigo-50/50 border-indigo-200"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Job Details (Step 4 in agent mode) */}
                        {getContentStep(currentStep) === 2 && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-5 border border-slate-200">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-4">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                        Job Details
                                    </h4>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.locationCity}
                                                    onChange={(e) => updateField('locationCity', e.target.value)}
                                                    placeholder="e.g. "
                                                    className={cn(
                                                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                        "text-base text-slate-800 placeholder:text-slate-400 transition-colors duration-200",
                                                        isGenerated && formData.locationCity && "bg-indigo-50/50 border-indigo-200"
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Country *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.locationCountry}
                                                    onChange={(e) => updateField('locationCountry', e.target.value)}
                                                    placeholder="e.g. Nepal"
                                                    className={cn(
                                                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                        "text-base text-slate-800 placeholder:text-slate-400 transition-colors duration-200",
                                                        isGenerated && formData.locationCountry && "bg-indigo-50/50 border-indigo-200"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Location Type *
                                            </label>
                                            <select
                                                value={formData.locationType}
                                                onChange={(e) => updateField('locationType', e.target.value)}
                                                className={cn(
                                                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white",
                                                    "text-base text-slate-800 transition-colors duration-200",
                                                    isGenerated && formData.locationType && "bg-indigo-50/50 border-indigo-200"
                                                )}
                                            >
                                                <option value="">Select type...</option>
                                                <option value="Remote">Remote</option>
                                                <option value="Hybrid">Hybrid</option>
                                                <option value="On-site">On-site</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Employment Type *
                                            </label>
                                            <select
                                                value={formData.employmentType}
                                                onChange={(e) => updateField('employmentType', e.target.value)}
                                                className={cn(
                                                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white",
                                                    "text-base text-slate-800 transition-colors duration-200",
                                                    isGenerated && formData.employmentType && "bg-indigo-50/50 border-indigo-200"
                                                )}
                                            >
                                                <option value="">Select type...</option>
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Internship">Internship</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Requirements and Skills (Step 2 in agent mode) */}
                        {getContentStep(currentStep) === 3 && (
                            <div className="space-y-5">
                                <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-5">
                                        <Briefcase className="w-4 h-4 text-indigo-500" />
                                        Required Skills and Experience
                                    </h4>
                                    <p className="text-xs text-slate-500 mb-5">
                                        Add requirements, skills, and experience needed for this role. Mix requirements (e.g., &quot;5+ years of Python experience&quot;) and skills (e.g., &quot;Python&quot;, &quot;FastAPI&quot;) together.
                                    </p>
                                    <div className="space-y-3">
                                        {formData.requiredSkillsAndExperience.map((item, index) => (
                                            <div key={index} className="flex gap-3 items-start">
                                                <div className="flex-1">
                                                    <textarea
                                                        value={item}
                                                        onChange={(e) => updateArrayField('requiredSkillsAndExperience', index, e.target.value)}
                                                        placeholder="e.g. Strong experience with Python for backend development"
                                                        rows={Math.max(2, Math.ceil(item.length / 60))}
                                                        className={cn(
                                                            "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                            "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                                            "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                                            "whitespace-pre-wrap break-words",
                                                            isGenerated && item && "bg-indigo-50/50 border-indigo-200"
                                                        )}
                                                    />
                                                </div>
                                                {formData.requiredSkillsAndExperience.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('requiredSkillsAndExperience', index)}
                                                        className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-base cursor-pointer font-medium flex-shrink-0 mt-1"
                                                        aria-label="Remove requirement"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addArrayItem('requiredSkillsAndExperience')}
                                            className="text-xs text-indigo-500 font-medium hover:underline cursor-pointer"
                                        >
                                            + Add requirement or skill
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-5">
                                        <Briefcase className="w-4 h-4 text-indigo-500" />
                                        Nice to Have
                                    </h4>
                                    <p className="text-xs text-slate-500 mb-5">
                                        Optional qualifications that would be beneficial but not required for this role.
                                    </p>
                                    <div className="space-y-3">
                                        {formData.niceToHave.map((item, index) => (
                                            <div key={index} className="flex gap-3 items-start">
                                                <div className="flex-1">
                                                    <textarea
                                                        value={item}
                                                        onChange={(e) => updateArrayField('niceToHave', index, e.target.value)}
                                                        placeholder="e.g. Experience with Kubernetes and container orchestration"
                                                        rows={Math.max(2, Math.ceil(item.length / 60))}
                                                        className={cn(
                                                            "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                            "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                                            "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                                            "whitespace-pre-wrap break-words",
                                                            isGenerated && item && "bg-indigo-50/50 border-indigo-200"
                                                        )}
                                                    />
                                                </div>
                                                {formData.niceToHave.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('niceToHave', index)}
                                                        className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-base cursor-pointer font-medium flex-shrink-0 mt-1"
                                                        aria-label="Remove nice to have"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addArrayItem('niceToHave')}
                                            className="text-xs text-indigo-500 font-medium hover:underline cursor-pointer"
                                        >
                                            + Add nice to have
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Compensation (Step 3 in agent mode) */}
                        {getContentStep(currentStep) === 4 && (
                            <div className="space-y-5">
                                <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-5">
                                        <DollarSign className="w-4 h-4 text-indigo-500" />
                                        Compensation
                                    </h4>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Min Salary
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.salaryMin}
                                                    onChange={(e) => updateField('salaryMin', e.target.value)}
                                                    placeholder="80000"
                                                    className={cn(
                                                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                        "text-base text-slate-800 placeholder:text-slate-400 transition-colors duration-200"
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Max Salary
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.salaryMax}
                                                    onChange={(e) => updateField('salaryMax', e.target.value)}
                                                    placeholder="120000"
                                                    className={cn(
                                                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                        "text-base text-slate-800 placeholder:text-slate-400 transition-colors duration-200"
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Currency
                                                </label>
                                                <select
                                                    value={formData.currency}
                                                    onChange={(e) => updateField('currency', e.target.value)}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-base text-slate-800 transition-colors duration-200"
                                                >
                                                    <option value="INR">INR</option>
                                                    <option value="USD">USD</option>
                                                    <option value="NPR">NPR</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Application Deadline
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.applicationDeadline}
                                                onChange={(e) => updateField('applicationDeadline', e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base text-slate-800 transition-colors duration-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                                    <h4 className="text-sm font-medium text-slate-800 mb-5">What We Offer</h4>
                                    <div className="space-y-3">
                                        {formData.benefits.map((benefit, index) => (
                                            <div key={index} className="flex gap-3 items-start">
                                                <div className="flex-1">
                                                    <textarea
                                                        value={benefit}
                                                        onChange={(e) => updateArrayField('benefits', index, e.target.value)}
                                                        placeholder="Add what we offer..."
                                                        rows={Math.max(2, Math.ceil(benefit.length / 60))}
                                                        className={cn(
                                                            "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                            "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                                            "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                                            "whitespace-pre-wrap break-words",
                                                            isGenerated && benefit && "bg-indigo-50/50 border-indigo-200"
                                                        )}
                                                    />
                                                </div>
                                                {formData.benefits.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('benefits', index)}
                                                        className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-base cursor-pointer font-medium flex-shrink-0 mt-1"
                                                        aria-label="Remove benefit"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addArrayItem('benefits')}
                                            className="text-xs text-indigo-500 font-medium hover:underline cursor-pointer"
                                        >
                                            + Add offering
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer Actions - Fixed */}
            {!isGenerating && (
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
                    <button
                        onClick={handlePrev}
                        className="flex items-center gap-1.5 px-4 py-2 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Agent Mode: Revision Button */}
                        {mode === 'agent' && isGenerated && (
                            <button
                                onClick={() => setShowRevisionPrompt(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 text-slate-500 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Revise
                            </button>
                        )}

                        {/* Save Draft / Publish */}
                        {currentStep === steps.length ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveDraft}
                                    className={cn(
                                        "px-4 py-2 text-slate-500 text-sm font-medium rounded-lg transition-colors",
                                        createJobMutation.isPending
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-slate-50"
                                    )}
                                    disabled={createJobMutation.isPending}
                                >
                                    {createJobMutation.isPending ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </span>
                                    ) : 'Save Draft'}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={createJobMutation.isPending}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm",
                                        createJobMutation.isPending
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-indigo-700"
                                    )}
                                >
                                    {createJobMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            Publish Job
                                            <Check className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Continue
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Revision Prompt Modal */}
            {showRevisionPrompt && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    {/* Backdrop with blur */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowRevisionPrompt(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/50 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Request AI Revision</h3>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Tell the AI what you&apos;d like to change or improve
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Quick Suggestions */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Quick Suggestions
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {revisionSuggestions.slice(0, 6).map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                                                "border border-slate-300 bg-white text-slate-700",
                                                "hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700",
                                                "cursor-pointer active:scale-95"
                                            )}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Or Type Your Own Revision Instructions
                                </label>
                                <textarea
                                    value={revisionText}
                                    onChange={(e) => setRevisionText(e.target.value)}
                                    placeholder="e.g., Make the requirements more specific, add more technical details, adjust the tone to be more formal..."
                                    rows={5}
                                    maxLength={500}
                                    className={cn(
                                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                        "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                        "resize-y min-h-[120px] transition-colors duration-200",
                                        "border-slate-300 hover:border-slate-400"
                                    )}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-slate-500">
                                        Be specific about what you want changed
                                    </p>
                                    <span className={cn(
                                        "text-xs font-medium",
                                        revisionText.length > 450 ? "text-amber-600" : "text-slate-400"
                                    )}>
                                        {revisionText.length}/500
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowRevisionPrompt(false)}
                                className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-white rounded-lg transition-colors duration-200 border border-slate-300 hover:border-slate-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRevision}
                                disabled={!revisionText.trim() || generateDraftMutation.isPending}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                    revisionText.trim() && !generateDraftMutation.isPending
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
    );
}
