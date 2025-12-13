/**
 * RecruiterJobCard - Premium job card with smooth animations and clean design
 */

import React, { memo } from 'react';
import { MapPin, Briefcase, Calendar, DollarSign, Clock, ChevronRight, Users, Star } from 'lucide-react';
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
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

// Status config
const statusConfig = {
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    Draft: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
    Closed: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500' },
};

export const RecruiterJobCard = memo<RecruiterJobCardProps>(({ job, onClick, className }) => {
    const status = job.status || 'Draft';
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative bg-white rounded-2xl p-6 cursor-pointer',
                'border border-gray-100',
                'transition-all duration-300 ease-out',
                'hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50',
                'hover:-translate-y-0.5',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                            {job.department}
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-1">
                        {job.title}
                    </h3>
                </div>

                {/* Status Badge */}
                <div className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                    config.bg, config.text
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
                    {status}
                </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>{job.employment_type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>{formatSalary(job)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{job.location_type}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatPostedDate(job.posted_date || job.created_at)}
                    </span>
                    {job.applicant_count > 0 && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <Users className="w-3.5 h-3.5" />
                            {job.applicant_count} applicants
                        </span>
                    )}
                </div>

                {/* Arrow indicator */}
                <div className="flex items-center gap-1 text-gray-400 group-hover:text-blue-600 transition-colors">
                    <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </div>
    );
});

RecruiterJobCard.displayName = 'RecruiterJobCard';

