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
            className={cn('h-4 bg-[#E5E7EB] rounded animate-pulse', className)}
            style={{
                background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
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
        location: '',
        locationType: '',
        employmentType: '',
        // Requirements
        requirements: [''],
        skills: [''],
        // Compensation
        salaryMin: '',
        salaryMax: '',
        currency: 'USD',
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
            requirements: [
                '5+ years of professional software development experience',
                'Strong proficiency in Python, TypeScript, or similar languages',
                'Experience with modern web frameworks (React, Next.js, FastAPI)',
                'Solid understanding of database design and SQL',
                'Excellent problem-solving and communication skills',
                'Bachelor\'s degree in Computer Science or equivalent experience',
            ],
            skills: [
                'Python',
                'TypeScript',
                'React',
                'Node.js',
                'PostgreSQL',
                'AWS',
                'Docker',
                'System Design',
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
            location: 'San Francisco, CA',
            locationType: 'Remote',
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

    // Handle next step
    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
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
        <div className="flex flex-col h-full">
            {/* Progress Steps */}
            <div className="px-8 py-6 border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                                            isCompleted
                                                ? 'bg-[#10B981] text-white'
                                                : isActive
                                                    ? 'bg-[#3B82F6] text-white'
                                                    : 'bg-[#F3F4F6] text-[#9CA3AF]'
                                        )}
                                    >
                                        {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span
                                        className={cn(
                                            'text-sm font-medium hidden sm:block',
                                            isActive ? 'text-[#111827]' : 'text-[#9CA3AF]'
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            'flex-1 h-0.5 mx-4',
                                            currentStep > step.id ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'
                                        )}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {/* Agent Mode: AI Generation */}
                {mode === 'agent' && currentStep === 1 && !isGenerated && (
                    <div className="mb-8">
                        <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-500" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">AI Job Generator</h4>
                                        <p className="text-sm text-blue-600 font-medium">Powered by Advanced Agentic Models</p>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-6 leading-relaxed max-w-2xl">
                                    Provide a job title, select a reference JD for structure, and add keywords. Our AI will generate a professional job description.
                                </p>

                                <div className="space-y-5">
                                    {/* Job Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Job Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => updateField('title', e.target.value)}
                                            placeholder="e.g. Senior ML Engineer"
                                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 transition-all shadow-sm"
                                        />
                                    </div>

                                    {/* Reference JD Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Reference JD (Structure Pattern) <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.referenceJD}
                                            onChange={(e) => updateField('referenceJD', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 transition-all shadow-sm appearance-none cursor-pointer"
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
                                        <p className="mt-2 text-xs text-gray-500">
                                            This determines the structure and format of the generated JD.
                                        </p>
                                    </div>

                                    {/* Keywords */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Keywords & Requirements <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.keywords || ''}
                                            onChange={(e) => updateField('keywords', e.target.value)}
                                            placeholder="e.g. FastAPI, AWS, PyTorch, MLOps, 5 years experience, remote first, competitive salary..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-sm"
                                        />
                                        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-blue-500" />
                                            Be specific about technologies, experience level, and key requirements.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className={cn(
                                            'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg',
                                            !isGenerating
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:-translate-y-0.5'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                        )}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Generating Job Description...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate Job Description
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Skeleton */}
                {isGenerating && (
                    <div className="space-y-6 animate-pulse">
                        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                            <SkeletonLine className="w-32 h-5 mb-4" />
                            <SkeletonLine className="w-full h-10 mb-3" />
                            <SkeletonLine className="w-3/4 h-10" />
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                            <SkeletonLine className="w-40 h-5 mb-4" />
                            <SkeletonLine className="w-full h-24" />
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                            <SkeletonLine className="w-36 h-5 mb-4" />
                            <div className="flex gap-2">
                                <SkeletonLine className="w-24 h-8 rounded-full" />
                                <SkeletonLine className="w-28 h-8 rounded-full" />
                                <SkeletonLine className="w-20 h-8 rounded-full" />
                            </div>
                        </div>
                        <p className="text-center text-[#3B82F6] font-medium animate-pulse">
                            AI is generating your job posting...
                        </p>
                    </div>
                )}

                {/* Form Steps */}
                {!isGenerating && (
                    <>
                        {/* Step 1: Basic Info - Only show in Manual Mode OR after Agent Mode generation */}
                        {currentStep === 1 && (mode === 'manual' || isGenerated) && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-[#111827] mb-6">
                                        <Building2 className="w-5 h-5 text-[#3B82F6]" />
                                        Basic Information
                                    </h4>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-[#374151] mb-2">
                                                Job Title *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => updateField('title', e.target.value)}
                                                placeholder="e.g. Senior Software Engineer"
                                                className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                                    Department *
                                                </label>
                                                <select
                                                    value={formData.department}
                                                    onChange={(e) => updateField('department', e.target.value)}
                                                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] bg-white"
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
                                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                                    Level *
                                                </label>
                                                <select
                                                    value={formData.level}
                                                    onChange={(e) => updateField('level', e.target.value)}
                                                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] bg-white"
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

                                        {/* About the Role - shown after generation */}
                                        <div>
                                            <label className="block text-sm font-medium text-[#374151] mb-2">
                                                <FileText className="w-4 h-4 inline mr-1" />
                                                About the Role *
                                            </label>
                                            <p className="text-xs text-gray-500 mb-2">
                                                Brief 2-3 sentence summary about this position.
                                            </p>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => updateField('description', e.target.value)}
                                                rows={3}
                                                placeholder="Summarize what this role is about and why it's exciting..."
                                                className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Job Details */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-[#111827] mb-6">
                                        <FileText className="w-5 h-5 text-[#3B82F6]" />
                                        Job Details
                                    </h4>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                                    <MapPin className="w-4 h-4 inline mr-1" />
                                                    Location *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={(e) => updateField('location', e.target.value)}
                                                    placeholder="e.g. San Francisco, CA"
                                                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                                    Location Type *
                                                </label>
                                                <select
                                                    value={formData.locationType}
                                                    onChange={(e) => updateField('locationType', e.target.value)}
                                                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] bg-white"
                                                >
                                                    <option value="">Select type...</option>
                                                    <option value="Remote">Remote</option>
                                                    <option value="Hybrid">Hybrid</option>
                                                    <option value="On-site">On-site</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#374151] mb-2">
                                                Employment Type *
                                            </label>
                                            <select
                                                value={formData.employmentType}
                                                onChange={(e) => updateField('employmentType', e.target.value)}
                                                className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] bg-white"
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

                        {/* Step 3: Requirements */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                {/* Requirements */}
                                <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-[#111827] mb-6">
                                        <Briefcase className="w-5 h-5 text-[#3B82F6]" />
                                        Requirements
                                    </h4>
                                    <div className="space-y-3">
                                        {formData.requirements.map((req, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={req}
                                                    onChange={(e) => updateArrayField('requirements', index, e.target.value)}
                                                    placeholder="Add a requirement..."
                                                    className="flex-1 px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                                                />
                                                {formData.requirements.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('requirements', index)}
                                                        className="px-3 text-[#EF4444] hover:bg-[#FEE2E2] rounded-xl transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addArrayItem('requirements')}
                                            className="text-sm text-[#3B82F6] font-medium hover:underline"
                                        >
                                            + Add another requirement
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                                    <h4 className="text-lg font-semibold text-[#111827] mb-6">Skills</h4>
                                    <div className="space-y-3">
                                        {formData.skills.map((skill, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={skill}
                                                    onChange={(e) => updateArrayField('skills', index, e.target.value)}
                                                    placeholder="Add a skill..."
                                                    className="flex-1 px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                                                />
                                                {formData.skills.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('skills', index)}
                                                        className="px-3 text-[#EF4444] hover:bg-[#FEE2E2] rounded-xl transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addArrayItem('skills')}
                                            className="text-sm text-[#3B82F6] font-medium hover:underline"
                                        >
                                            + Add another skill
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Compensation */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-[#111827] mb-6">
                                        <DollarSign className="w-5 h-5 text-[#3B82F6]" />
                                        Compensation
                                    </h4>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                                    Min Salary
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.salaryMin}
                                                    onChange={(e) => updateField('salaryMin', e.target.value)}
                                                    placeholder="80000"
                                                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                                    Max Salary
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.salaryMax}
                                                    onChange={(e) => updateField('salaryMax', e.target.value)}
                                                    placeholder="120000"
                                                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                                    Currency
                                                </label>
                                                <select
                                                    value={formData.currency}
                                                    onChange={(e) => updateField('currency', e.target.value)}
                                                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] bg-white"
                                                >
                                                    <option value="USD">USD</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="GBP">GBP</option>
                                                    <option value="CAD">CAD</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#374151] mb-2">
                                                Application Deadline
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.applicationDeadline}
                                                onChange={(e) => updateField('applicationDeadline', e.target.value)}
                                                className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                                    <h4 className="text-lg font-semibold text-[#111827] mb-6">Benefits</h4>
                                    <div className="space-y-3">
                                        {formData.benefits.map((benefit, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={benefit}
                                                    onChange={(e) => updateArrayField('benefits', index, e.target.value)}
                                                    placeholder="Add a benefit..."
                                                    className="flex-1 px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                                                />
                                                {formData.benefits.length > 1 && (
                                                    <button
                                                        onClick={() => removeArrayItem('benefits', index)}
                                                        className="px-3 text-[#EF4444] hover:bg-[#FEE2E2] rounded-xl transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addArrayItem('benefits')}
                                            className="text-sm text-[#3B82F6] font-medium hover:underline"
                                        >
                                            + Add another benefit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer Actions */}
            {!isGenerating && (
                <div className="sticky bottom-0 flex items-center justify-between px-8 py-6 bg-white border-t border-[#E5E7EB]">
                    <button
                        onClick={handlePrev}
                        className="flex items-center gap-2 px-5 py-3 text-[#374151] font-medium hover:bg-[#F3F4F6] rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Agent Mode: Revision Button - Available on all steps after generation */}
                        {mode === 'agent' && isGenerated && (
                            <button
                                onClick={() => setShowRevisionPrompt(true)}
                                className="flex items-center gap-2 px-5 py-3 border-2 border-[#E5E7EB] text-[#374151] font-medium rounded-xl hover:bg-[#F9FAFB] transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Request Revision
                            </button>
                        )}

                        {/* Save Draft / Publish */}
                        {currentStep === steps.length ? (
                            <div className="flex gap-3">
                                <button className="px-5 py-3 border-2 border-[#E5E7EB] text-[#374151] font-medium rounded-xl hover:bg-[#F9FAFB] transition-colors">
                                    Save as Draft
                                </button>
                                <button
                                    onClick={onComplete}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#3B82F6] text-white font-medium rounded-xl hover:bg-[#2563EB] transition-colors"
                                    style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}
                                >
                                    Publish Job
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-3 bg-[#3B82F6] text-white font-medium rounded-xl hover:bg-[#2563EB] transition-colors"
                                style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
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
                    <div className="relative bg-white rounded-2xl p-6 w-[500px] max-w-[95vw] shadow-2xl">
                        <h4 className="text-lg font-semibold text-[#111827] mb-4">Request Revision</h4>
                        <textarea
                            value={revisionText}
                            onChange={(e) => setRevisionText(e.target.value)}
                            placeholder="Tell AI what to revise..."
                            rows={4}
                            className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] resize-none mb-2"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-[#9CA3AF]">{revisionText.length}/500</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowRevisionPrompt(false)}
                                    className="px-4 py-2 text-[#6B7280] font-medium hover:bg-[#F3F4F6] rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRevision}
                                    disabled={!revisionText.trim()}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                                        revisionText.trim()
                                            ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                                            : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                                    )}
                                >
                                    <Sparkles className="w-4 h-4" />
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
