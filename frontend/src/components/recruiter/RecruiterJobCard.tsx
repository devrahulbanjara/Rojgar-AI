/**
 * RecruiterJobCard - Modern card matching candidate browse-jobs design
 * Includes recruiter-specific fields: status, department, views, applicant count
 */

import React, { memo } from 'react';
import { MapPin, Briefcase, Calendar, DollarSign, Clock, Users, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Job } from '../../types/job';

interface RecruiterJobCardProps {
    job: Job;
    onClick?: () => void;
    className?: string;
}

// Format salary for display
function formatSalary(job: Job): string {
    const min = job.salary_range?.min ?? job.salary_min;
    const max = job.salary_range?.max ?? job.salary_max;

    if (!min && !max) return 'Competitive';

    const formatK = (n: number) => {
        if (n >= 1000) return `$${Math.round(n / 1000)}k`;
        return `$${n}`;
    };

    if (min && max) return `${formatK(min)} - ${formatK(max)}`;
    if (min) return `From ${formatK(min)}`;
    if (max) return `Up to ${formatK(max)}`;
    return 'Competitive';
}

// Format posted date
function formatPostedDate(dateStr: string): string {
    if (!dateStr) return 'Recently';

    const date = new Date(dateStr);
    const now = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Recently';

    // Reset time to midnight for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const postedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Status config matching candidate design style
const statusConfig = {
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Draft: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
    Closed: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    Inactive: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
};

export const RecruiterJobCard = memo<RecruiterJobCardProps>(({ job, onClick, className }) => {
    const status = job.status || 'Draft';
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;

    return (
        <div
            onClick={onClick}
            className={cn(
                'group cursor-pointer transition-all duration-200 w-full bg-white rounded-xl border p-4 lg:p-5',
                'hover:-translate-y-0.5 active:scale-[0.99]',
                'border-[#E5E7EB] hover:border-[#CBD5E1]',
                className
            )}
            style={{
                boxShadow: '0 0 0 rgba(0,0,0,0)',
            }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${job.title}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)';
            }}
        >
            <div className="space-y-3">
                {/* Job Title & Department */}
                <div>
                    <h3 className="font-semibold text-base text-[#0F172A] group-hover:text-[#3056F5] transition-colors line-clamp-1 mb-1">
                        {job.title}
                    </h3>
                    <p className="text-sm text-[#475569] font-medium">
                        {job.department}
                    </p>
                </div>

                {/* Location & Posted Date */}
                <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatPostedDate(job.posted_date || job.created_at)}</span>
                    </div>
                </div>

                {/* Job Details */}
                <div className="flex items-center gap-4 text-sm text-[#475569]">
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">
                            {formatSalary(job)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.employment_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{job.location_type}</span>
                    </div>
                </div>

                {/* Footer with Stats & Status */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                        {job.applicant_count !== undefined && job.applicant_count > 0 && (
                            <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{job.applicant_count} applicants</span>
                            </div>
                        )}
                        {job.views_count !== undefined && job.views_count > 0 && (
                            <div className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{job.views_count} views</span>
                            </div>
                        )}
                    </div>

                    {/* Status Badge */}
                    <span className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-md border',
                        config.bg, config.text, config.border
                    )}>
                        {status}
                    </span>
                </div>
            </div>
        </div>
    );
});

RecruiterJobCard.displayName = 'RecruiterJobCard';
