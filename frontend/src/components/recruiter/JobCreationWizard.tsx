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
    MapPin,
    DollarSign,
    FileText,
    Loader2,
    RotateCcw,
    Briefcase,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCreateJob } from '../../hooks/queries/useJobs';
import { toast } from 'sonner';

interface JobCreationWizardProps {
    mode: 'agent' | 'manual';
    onBack: () => void;
    onComplete: () => void;
}

// Wizard steps
const steps = [
    { id: 1, title: 'Basic Info', icon: Building2 },
    { id: 2, title: 'Job Details', icon: FileText },
    { id: 3, title: 'Requirements', icon: Briefcase },
    { id: 4, title: 'Compensation', icon: DollarSign },
];

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

export function JobCreationWizard({ mode, onBack, onComplete }: JobCreationWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
    const [revisionText, setRevisionText] = useState('');
    
    const createJobMutation = useCreateJob();

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

    // Simulate AI generation
    const handleGenerate = async () => {
        setIsGenerating(true);
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsGenerating(false);
        setIsGenerated(true);

        // Auto-fill ALL fields with comprehensive static data
        setFormData((prev) => ({
            ...prev,
            title: prev.title || 'Senior Software Engineer',
            department: 'Engineering',
            level: 'Senior',
            description: 'We are seeking a talented engineer to join our growing team and build high-impact features for our platform. You will work closely with cross-functional teams to solve challenging problems at scale.',
            requiredSkillsAndExperience: [
                'Strong experience with Python for backend development',
                'Hands-on experience with FastAPI for building and maintaining APIs',
                'Working knowledge of PyTorch and modern machine learning workflows',
                'Experience with LLM orchestration frameworks such as LangGraph or LangChain',
                'Ability to design and manage data pipelines and model inference workflows',
                'Understanding of production concerns like logging, monitoring, and performance optimization',
                '5+ years of professional software development experience',
                'Strong proficiency in TypeScript and React for frontend development',
                'Experience with PostgreSQL and database design',
                'Familiarity with AWS cloud services and Docker containerization',
            ],
            niceToHave: [
                'Experience with Kubernetes and container orchestration',
                'Knowledge of GraphQL and API design best practices',
                'Contributions to open-source projects',
                'Experience with CI/CD pipelines and DevOps practices',
            ],
            benefits: [
                'Competitive salary and equity package',
                'Comprehensive health, dental, and vision insurance',
                '401(k) with company matching',
                'Unlimited PTO and flexible work arrangements',
                'Remote-first culture with optional office access',
                'Annual learning and development budget',
                'Home office setup stipend',
                'Regular team offsites and events',
            ],
            locationCity: 'Kathmandu',
            locationCountry: 'Nepal',
            locationType: 'On-site',
            employmentType: 'Full-time',
            salaryMin: '150000',
            salaryMax: '200000',
            applicationDeadline: '2025-02-01',
        }));
    };

    // Handle revision request
    const handleRevision = async () => {
        if (!revisionText.trim()) return;
        setShowRevisionPrompt(false);
        setIsGenerating(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsGenerating(false);
        setRevisionText('');
    };

    // Helper function to prepare job data
    const prepareJobData = (status: 'active' | 'draft' = 'active') => {
        // Filter out empty strings from arrays
        const filteredRequiredSkills = formData.requiredSkillsAndExperience.filter(item => item.trim() !== '');
        const filteredNiceToHave = formData.niceToHave.filter(item => item.trim() !== '');
        const filteredBenefits = formData.benefits.filter(item => item.trim() !== '');
        
        return {
            title: formData.title.trim(),
            department: formData.department.trim() || undefined,
            level: formData.level.trim() || undefined,
            description: formData.description.trim() || '', // Allow empty for drafts
            requiredSkillsAndExperience: filteredRequiredSkills.length > 0 ? filteredRequiredSkills : [''], // At least one empty string for drafts
            niceToHave: filteredNiceToHave.length > 0 ? filteredNiceToHave : undefined,
            benefits: filteredBenefits.length > 0 ? filteredBenefits : undefined,
            locationCity: formData.locationCity.trim() || undefined,
            locationCountry: formData.locationCountry.trim() || undefined,
            locationType: formData.locationType || 'On-site',
            employmentType: formData.employmentType.trim() || undefined,
            salaryMin: formData.salaryMin ? parseInt(formData.salaryMin, 10) : undefined,
            salaryMax: formData.salaryMax ? parseInt(formData.salaryMax, 10) : undefined,
            currency: formData.currency || 'NPR',
            applicationDeadline: formData.applicationDeadline || undefined,
            status: status,
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
            const result = await createJobMutation.mutateAsync(jobData as any);
            toast.success('Draft saved successfully!', {
                description: `${formData.title} has been saved as a draft.`,
                duration: 4000,
            });
            // Small delay to ensure toast is visible before closing modal
            setTimeout(() => {
                onComplete();
            }, 500);
        } catch (error: any) {
            // Extract error message from various possible error formats
            let errorMessage = 'Failed to save draft. Please try again.';
            
            if (error) {
                // ApiError format (from apiClient)
                if (error.data) {
                    errorMessage = error.data.detail || error.data.message || error.message || errorMessage;
                }
                // Axios-like error format
                else if (error.response?.data) {
                    errorMessage = error.response.data.detail || error.response.data.message || errorMessage;
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
            await createJobMutation.mutateAsync(jobData as any);
            toast.success('Job created successfully!', {
                description: `${formData.title} has been published and is now live.`,
                duration: 4000,
            });
            onComplete();
        } catch (error: any) {
            // Handle ApiError from apiClient
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
                            disabled={isGenerating}
                            className={cn(
                                'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-200 text-sm',
                                !isGenerating
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            )}
                        >
                            {isGenerating ? (
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
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-5 border border-slate-200">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-4">
                                        <Building2 className="w-4 h-4 text-indigo-500" />
                                        Basic Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Job Title *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => updateField('title', e.target.value)}
                                                placeholder="e.g. Senior Software Engineer"
                                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Department *
                                                </label>
                                                <select
                                                    value={formData.department}
                                                    onChange={(e) => updateField('department', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
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
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Level *
                                                </label>
                                                <select
                                                    value={formData.level}
                                                    onChange={(e) => updateField('level', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
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
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                About the Role *
                                            </label>
                                            <p className="text-xs text-slate-400 mb-1.5">
                                                Brief 2-3 sentence summary about this position.
                                            </p>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => updateField('description', e.target.value)}
                                                rows={3}
                                                placeholder="Summarize what this role is about..."
                                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Job Details */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-5 border border-slate-200">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-4">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                        Job Details
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.locationCity}
                                                    onChange={(e) => updateField('locationCity', e.target.value)}
                                                    placeholder="e.g. "
                                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Country *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.locationCountry}
                                                    onChange={(e) => updateField('locationCountry', e.target.value)}
                                                    placeholder="e.g. Nepal"
                                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Location Type *
                                                </label>
                                                <select
                                                    value={formData.locationType}
                                                    onChange={(e) => updateField('locationType', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
                                                >
                                                    <option value="">Select type...</option>
                                                    <option value="Remote">Remote</option>
                                                    <option value="Hybrid">Hybrid</option>
                                                    <option value="On-site">On-site</option>
                                                </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Employment Type *
                                            </label>
                                            <select
                                                value={formData.employmentType}
                                                onChange={(e) => updateField('employmentType', e.target.value)}
                                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
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

                        {/* Step 3: Requirements and Skills */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-5 border border-slate-200">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-4">
                                        <Briefcase className="w-4 h-4 text-indigo-500" />
                                        Required Skills and Experience
                                    </h4>
                                    <p className="text-xs text-slate-400 mb-4">
                                        Add requirements, skills, and experience needed for this role. Mix requirements (e.g., "5+ years of Python experience") and skills (e.g., "Python", "FastAPI") together.
                                    </p>
                                    <div className="space-y-2.5">
                                        {formData.requiredSkillsAndExperience.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateArrayField('requiredSkillsAndExperience', index, e.target.value)}
                                                    placeholder="e.g. Strong experience with Python for backend development"
                                                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                                />
                                                {formData.requiredSkillsAndExperience.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('requiredSkillsAndExperience', index)}
                                                        className="px-2.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors text-sm cursor-pointer"
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

                                <div className="bg-white rounded-lg p-5 border border-slate-200">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-4">
                                        <Briefcase className="w-4 h-4 text-indigo-500" />
                                        Nice to Have
                                    </h4>
                                    <p className="text-xs text-slate-400 mb-4">
                                        Optional qualifications that would be beneficial but not required for this role.
                                    </p>
                                    <div className="space-y-2.5">
                                        {formData.niceToHave.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateArrayField('niceToHave', index, e.target.value)}
                                                    placeholder="e.g. Experience with Kubernetes and container orchestration"
                                                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                                />
                                                {formData.niceToHave.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('niceToHave', index)}
                                                        className="px-2.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors text-sm cursor-pointer"
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

                        {/* Step 4: Compensation */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-5 border border-slate-200">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-4">
                                        <DollarSign className="w-4 h-4 text-indigo-500" />
                                        Compensation
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Min Salary
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.salaryMin}
                                                    onChange={(e) => updateField('salaryMin', e.target.value)}
                                                    placeholder="80000"
                                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Max Salary
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.salaryMax}
                                                    onChange={(e) => updateField('salaryMax', e.target.value)}
                                                    placeholder="120000"
                                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Currency
                                                </label>
                                                <select
                                                    value={formData.currency}
                                                    onChange={(e) => updateField('currency', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
                                                >
                                                    <option value="INR">INR</option>
                                                    <option value="USD">USD</option>
                                                    <option value="NPR">NPR</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Application Deadline
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.applicationDeadline}
                                                onChange={(e) => updateField('applicationDeadline', e.target.value)}
                                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-5 border border-slate-200">
                                    <h4 className="text-sm font-medium text-slate-800 mb-4">What We Offer</h4>
                                    <div className="space-y-2.5">
                                        {formData.benefits.map((benefit, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={benefit}
                                                    onChange={(e) => updateArrayField('benefits', index, e.target.value)}
                                                    placeholder="Add what we offer..."
                                                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                                />
                                                {formData.benefits.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('benefits', index)}
                                                        className="px-2.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors text-sm cursor-pointer"
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
                <div className="fixed inset-0 z-[110] flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/30"
                        onClick={() => setShowRevisionPrompt(false)}
                    />
                    <div className="relative bg-white rounded-xl p-5 w-[420px] max-w-[95vw] shadow-xl">
                        <h4 className="text-sm font-medium text-slate-800 mb-3">Request Revision</h4>
                        <textarea
                            value={revisionText}
                            onChange={(e) => setRevisionText(e.target.value)}
                            placeholder="Tell AI what to revise..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm mb-2"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">{revisionText.length}/500</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowRevisionPrompt(false)}
                                    className="px-3 py-1.5 text-slate-500 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRevision}
                                    disabled={!revisionText.trim()}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                        revisionText.trim()
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    )}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Revise
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
