/**
 * JobDetailModal - Centered overlay modal for job details
 * Features blur backdrop, smooth animations, and sticky header/footer
 * Replaces JobDetailSlideOver
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
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Job } from '../../types/job';
import { Dialog } from '../../components/ui/dialog';

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

// Status badge styles
const statusStyles: Record<string, { bg: string; text: string }> = {
    Active: { bg: '#10B981', text: 'white' },
    Expired: { bg: '#EF4444', text: 'white' },
    Draft: { bg: '#6B7280', text: 'white' },
    Inactive: { bg: '#F59E0B', text: 'white' },
    Closed: { bg: '#EF4444', text: 'white' },
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

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0"
            showCloseButton={true}
        >
            {/* Sticky Header */}
            <div
                className="flex-shrink-0 px-8 py-6 bg-white/95 backdrop-blur border-b border-[#E5E7EB]"
            >
                <div className="flex-1 min-w-0 pr-8">
                    <h2 className="text-2xl font-semibold text-[#111827] mb-2 line-clamp-1">
                        {job.title}
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#3B82F6] text-sm font-medium rounded-md">
                            {job.department}
                        </span>
                        <span
                            className="px-3 py-1 text-xs font-medium rounded-full"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                            {status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 bg-white">
                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3 p-4 bg-[#F9FAFB] rounded-xl border border-transparent hover:border-[#E5E7EB] transition-colors">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#EFF6FF]">
                            <MapPin className="w-5 h-5 text-[#3B82F6]" />
                        </div>
                        <div>
                            <p className="text-xs text-[#6B7280]">Location</p>
                            <p className="text-sm font-medium text-[#111827]">{job.location}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[#F9FAFB] rounded-xl border border-transparent hover:border-[#E5E7EB] transition-colors">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#EFF6FF]">
                            <Briefcase className="w-5 h-5 text-[#3B82F6]" />
                        </div>
                        <div>
                            <p className="text-xs text-[#6B7280]">Employment</p>
                            <p className="text-sm font-medium text-[#111827]">{job.employment_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[#F9FAFB] rounded-xl border border-transparent hover:border-[#E5E7EB] transition-colors">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#EFF6FF]">
                            <DollarSign className="w-5 h-5 text-[#3B82F6]" />
                        </div>
                        <div>
                            <p className="text-xs text-[#6B7280]">Salary</p>
                            <p className="text-sm font-medium text-[#111827]">{formatSalary(job)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[#F9FAFB] rounded-xl border border-transparent hover:border-[#E5E7EB] transition-colors">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#EFF6FF]">
                            <Building2 className="w-5 h-5 text-[#3B82F6]" />
                        </div>
                        <div>
                            <p className="text-xs text-[#6B7280]">Level</p>
                            <p className="text-sm font-medium text-[#111827]">{job.level}</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mb-8 pb-8 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                        <Users className="w-4 h-4" />
                        <span><strong className="text-[#111827]">{job.applicant_count}</strong> applicants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                        <Clock className="w-4 h-4" />
                        <span>Posted {formatPostedDate(job.posted_date || job.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                        <Calendar className="w-4 h-4" />
                        <span>Deadline: {formatPostedDate(job.application_deadline)}</span>
                    </div>
                </div>

                {/* Role Overview */}
                <section className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#EFF6FF]">
                            <Briefcase className="w-4 h-4 text-[#3B82F6]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#111827]">Role Overview</h3>
                    </div>
                    <p className="text-[15px] text-[#374151] leading-relaxed">{job.description}</p>
                </section>

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FEF3C7]">
                                <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#111827]">Requirements</h3>
                        </div>
                        <ul className="space-y-3">
                            {job.requirements.map((req, index) => (
                                <li key={index} className="flex items-start gap-3 text-[15px] text-[#374151]">
                                    <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                                    <span>{req}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#DBEAFE]">
                                <Briefcase className="w-4 h-4 text-[#3B82F6]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#111827]">Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-[#F3F4F6] text-[#374151] text-sm font-medium rounded-lg hover:bg-[#E5E7EB] transition-colors"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#D1FAE5]">
                                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#111827]">Benefits & Perks</h3>
                        </div>
                        <ul className="space-y-3">
                            {job.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-center gap-3 text-[15px] text-[#374151]">
                                    <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            {/* Sticky Footer */}
            <div
                className="flex items-center gap-3 px-8 py-6 bg-white border-t border-[#E5E7EB] mt-auto"
            >
                <button
                    onClick={() => onEdit?.(job)}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-[#E5E7EB] text-[#374151] font-medium rounded-xl hover:bg-[#F9FAFB] transition-colors"
                >
                    <Edit3 className="w-4 h-4" />
                    Edit Job
                </button>
                <button
                    onClick={() => onArchive?.(job)}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#EF4444] text-white font-medium rounded-xl hover:bg-[#DC2626] transition-colors"
                >
                    <Archive className="w-4 h-4" />
                    Archive
                </button>
            </div>
        </Dialog>
    );
}
