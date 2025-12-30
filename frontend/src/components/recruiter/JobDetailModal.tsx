/**
 * JobDetailModal - Modern centered overlay modal for job details
 * Features blur backdrop, smooth animations, and recruiter-specific actions
 * Matches candidate design theme with recruiter fields
 */

'use client';

import React from 'react';
import {
    MapPin,
    Briefcase,
    Calendar,
    DollarSign,
    Users,
    Clock,
    CheckCircle2,
    Edit3,
    Archive,
    Building2,
    Sparkles,
    Eye,
    MapPinned,
    ClockIcon,
    TrendingUp,
} from 'lucide-react';
import type { Job } from '../../types/job';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface JobDetailModalProps {
    job: Job | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (job: Job) => void;
    onArchive?: (job: Job) => void;
}

// Format salary for display
function formatSalary(job: Job): string {
    const min = job.salary_range?.min ?? job.salary_min;
    const max = job.salary_range?.max ?? job.salary_max;
    const currency = job.salary_range?.currency ?? job.salary_currency ?? 'USD';

    if (!min && !max) return 'Competitive';

    const formatK = (n: number) => {
        if (n >= 1000) return `$${Math.round(n / 1000)}k`;
        return `$${n}`;
    };

    if (min && max) {
        return `${formatK(min)} - ${formatK(max)} ${currency}`;
    }
    if (min) return `From ${formatK(min)} ${currency}`;
    if (max) return `Up to ${formatK(max)} ${currency}`;
    return 'Competitive';
}

// Format posted date
function formatPostedDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Status badge styles matching candidate theme
const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Expired: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    Draft: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
    Inactive: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    Closed: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
};

export function JobDetailModal({
    job,
    isOpen,
    onClose,
    onEdit,
    onArchive,
}: JobDetailModalProps) {
    if (!job) return null;

    const status = job.status || 'Draft';
    const statusStyle = statusStyles[status] || statusStyles.Draft;

    // Calculate days since posted
    const daysSincePosted = job.posted_date || job.created_at
        ? Math.floor((Date.now() - new Date(job.posted_date || job.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[900px] mx-4 rounded-[20px]"
            showCloseButton={false}
        >
            <div className="max-h-[90vh] overflow-hidden w-full max-w-[900px] p-0 flex flex-col rounded-[20px] bg-white">
                {/* Enhanced Header with subtle background */}
                <div className="bg-gradient-to-b from-gray-50/80 to-white px-12 py-12 border-b border-gray-100 relative">
                    {/* Close Button - More prominent */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 group"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                    </button>

                    {/* Job Title & Department */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-200">
                                {job.department}
                            </span>
                            <span className={cn(
                                'px-3 py-1.5 text-sm font-semibold rounded-lg border',
                                statusStyle.bg, statusStyle.text, statusStyle.border
                            )}>
                                {status}
                            </span>
                        </div>
                        <h2 className="text-[28px] font-bold text-gray-900 leading-tight tracking-[0.3px]">
                            {job.title}
                        </h2>
                    </div>

                    {/* Enhanced Badges with icons */}
                    <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2 text-sm font-semibold rounded-full border-0 bg-purple-50 text-purple-700">
                            <ClockIcon className="w-4 h-4 inline mr-1.5" />
                            {job.employment_type}
                        </div>
                        <div className="px-4 py-2 text-sm font-semibold rounded-full border-0 bg-emerald-50 text-emerald-700">
                            <MapPinned className="w-4 h-4 inline mr-1.5" />
                            {job.location_type}
                        </div>
                        <div className="px-4 py-2 text-sm font-semibold rounded-full border-0 bg-blue-50 text-blue-700">
                            <Briefcase className="w-4 h-4 inline mr-1.5" />
                            {job.level}
                        </div>
                        {job.applicant_count > 0 && (
                            <div className="px-4 py-2 text-sm font-semibold rounded-full border-0 bg-orange-50 text-orange-700">
                                <TrendingUp className="w-4 h-4 inline mr-1.5" />
                                {job.applicant_count} applicants
                            </div>
                        )}
                        {job.views_count !== undefined && job.views_count > 0 && (
                            <div className="px-4 py-2 text-sm font-semibold rounded-full border-0 bg-indigo-50 text-indigo-700">
                                <Eye className="w-4 h-4 inline mr-1.5" />
                                {job.views_count} views
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-12 py-12">
                    {/* Key Information Grid with dividers */}
                    <div className="grid grid-cols-3 gap-10 mb-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">Location</p>
                                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {job.location}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 border-l border-gray-200 pl-8 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">Salary</p>
                                <p className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {formatSalary(job)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 border-l border-gray-200 pl-8 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">Posted</p>
                                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {formatPostedDate(job.posted_date || job.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 mb-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{job.applicant_count || 0}</p>
                                <p className="text-xs text-gray-600">Applicants</p>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{job.views_count || 0}</p>
                                <p className="text-xs text-gray-600">Views</p>
                            </div>
                        </div>
                        {job.application_deadline && (
                            <>
                                <div className="w-px h-10 bg-gray-200"></div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {formatPostedDate(job.application_deadline)}
                                        </p>
                                        <p className="text-xs text-gray-600">Deadline</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* About the Company - Enhanced */}
                    {job.company && (
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">About the Company</h3>
                            </div>
                            <div className="pl-14">
                                {job.company.description ? (
                                    <p className="text-[15px] text-gray-700 leading-relaxed">{job.company.description}</p>
                                ) : (
                                    <p className="text-[15px] text-gray-700 leading-relaxed">
                                        {job.company.name} is looking for talented individuals to join their team.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Role Overview - Enhanced */}
                    {job.description && (
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50">
                                    <Briefcase className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">Role Overview</h3>
                            </div>
                            <div className="pl-14">
                                <p className="text-[16px] text-gray-700 leading-[1.8] whitespace-pre-wrap">{job.description}</p>
                            </div>
                        </section>
                    )}

                    {/* Required Skills and Experience - Enhanced */}
                    {job.requirements && job.requirements.length > 0 && (
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-emerald-600 rounded-full"></div>
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">Required Skills and Experience</h3>
                            </div>
                            <div className="pl-14">
                                <ul className="space-y-3 list-disc list-inside">
                                    {job.requirements.map((req, index) => (
                                        <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* Nice to Have (Preferred) - Enhanced */}
                    {job.nice_to_have && job.nice_to_have.length > 0 && (
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-amber-600 rounded-full"></div>
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                </div>
                                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">Nice to Have (Preferred)</h3>
                            </div>
                            <div className="pl-14">
                                <ul className="space-y-3 list-disc list-inside">
                                    {job.nice_to_have.map((item, index) => (
                                        <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* What We Offer (Benefits) - Enhanced */}
                    {job.benefits && job.benefits.length > 0 && (
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-violet-600 rounded-full"></div>
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-50">
                                    <Sparkles className="w-5 h-5 text-violet-600" />
                                </div>
                                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">What We Offer</h3>
                            </div>
                            <div className="pl-14">
                                <ul className="space-y-3 list-disc list-inside">
                                    {job.benefits.map((benefit, index) => (
                                        <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}
                </div>

                {/* Sticky Footer with CTAs */}
                <div className="border-t border-gray-200 bg-white px-12 py-6 flex items-center justify-between gap-4 shadow-lg">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => onEdit?.(job)}
                        className="h-12 px-6 border-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        <Edit3 className="w-5 h-5 mr-2" />
                        Edit Job
                    </Button>
                    
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => onArchive?.(job)}
                        className="h-12 px-6 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        <Archive className="w-5 h-5 mr-2" />
                        Archive Job
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
