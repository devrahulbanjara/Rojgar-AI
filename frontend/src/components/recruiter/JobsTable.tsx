'use client'

import React from 'react'
import { Job } from '../../types/job'
import { cn } from '../../lib/utils'
import {
    MoreVertical,
    Eye,
    Trash2,
    Users,
    Briefcase,
    Zap,
    Edit2,
    Archive,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'
import { useAutoShortlist } from '../../hooks/useAutoShortlist'
import { toast } from 'sonner'

interface JobsTableProps {
    jobs: Job[]
    onJobClick: (job: Job) => void
    onEdit: (job: Job) => void
    onExpire: (job: Job) => void
    onDelete: (job: Job) => void
    className?: string
}

function formatFullDate(dateString: string): string {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Recently'
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function getStatusStyles(status: string): { bg: string; text: string; border: string } {
    const s = status?.toLowerCase() || ''
    if (s === 'active') {
        return {
            bg: 'bg-primary-50 dark:bg-primary-950/30',
            text: 'text-primary-600 dark:text-primary-400',
            border: 'border-primary-200 dark:border-primary-800',
        }
    }
    if (s === 'draft') {
        return {
            bg: 'bg-warning-50 dark:bg-warning-950/30',
            text: 'text-warning-600 dark:text-warning-400',
            border: 'border-warning-200 dark:border-warning-800',
        }
    }
    if (s === 'closed' || s === 'expired' || s === 'inactive') {
        return {
            bg: 'bg-error-50 dark:bg-error-950/30',
            text: 'text-error-600 dark:text-error-400',
            border: 'border-error-200 dark:border-error-800',
        }
    }
    return {
        bg: 'bg-background-subtle',
        text: 'text-text-tertiary',
        border: 'border-border-default',
    }
}

function JobTableRow({
    job,
    index,
    onJobClick,
    onEdit,
    onExpire,
    onDelete
}: {
    job: Job;
    index: number;
    onJobClick: (j: Job) => void;
    onEdit: (j: Job) => void;
    onExpire: (j: Job) => void;
    onDelete: (j: Job) => void;
}) {
    const status = job.status || 'Draft'
    const statusStyles = getStatusStyles(status)
    const isEven = index % 2 === 0
    const jobId = job.job_id || job.id?.toString()

    const {
        autoShortlist,
        isLoading: _isLoadingAutoShortlist,
        toggle,
        isToggling,
    } = useAutoShortlist(jobId || null)

    const handleAutoShortlistToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!jobId || isToggling) return
        toggle()
        toast.success(autoShortlist ? 'Auto Shortlist Disabled' : 'Auto Shortlist Enabled', {
            description: autoShortlist
                ? 'Candidates will not be automatically shortlisted'
                : 'Candidates will be automatically shortlisted when job expires',
            duration: 3000,
        })
    }

    return (
        <tr
            onClick={() => onJobClick(job)}
            className={cn(
                'border-b border-border-subtle cursor-pointer transition-all duration-200 group',
                isEven ? 'bg-background-surface' : 'bg-background-subtle/20',
                'hover:bg-primary-50/40 dark:hover:bg-primary-950/20 hover:border-primary-100 dark:hover:border-primary-900'
            )}
        >
            <td className="py-5 px-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 shadow-sm transition-transform group-hover:scale-105">
                        {(job.title || 'J').substring(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-text-primary group-hover:text-primary-600 transition-colors truncate">
                            {job.title}
                        </p>
                        <p className="text-[11px] text-text-tertiary font-bold mt-0.5 truncate uppercase tracking-widest opacity-80 italic">
                            {job.department} • {job.level}
                        </p>
                    </div>
                </div>
            </td>

            <td className="py-5 px-6 text-sm">
                <div className="flex items-center gap-5">
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-text-primary">
                            {job.applicant_count || 0}
                        </span>
                        <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">
                            Apps
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-text-primary">
                            {job.views_count || 0}
                        </span>
                        <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">
                            Views
                        </span>
                    </div>
                </div>
            </td>

            <td className="py-5 px-6">
                <Badge
                    variant="subtle"
                    colorPalette={
                        status.toLowerCase() === 'active'
                            ? 'blue'
                            : status.toLowerCase() === 'draft'
                                ? 'orange'
                                : 'red'
                    }
                    className="font-bold uppercase tracking-wider text-[10px]"
                    style={{ borderRadius: '5px' }}
                >
                    {status}
                </Badge>
            </td>

            <td className="py-5 px-6">
                <div className="text-[13px] font-medium text-text-secondary whitespace-nowrap">
                    {formatFullDate(job.posted_date || job.created_at)}
                </div>
            </td>

            <td className="py-5 px-6 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={handleAutoShortlistToggle}
                        className={cn(
                            'p-2 rounded-lg transition-all',
                            autoShortlist
                                ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/20'
                                : 'text-text-muted hover:bg-background-subtle'
                        )}
                        title="Toggle Auto-Shortlist"
                    >
                        <Zap
                            className={cn(
                                'w-4 h-4',
                                autoShortlist && 'fill-current'
                            )}
                        />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                onClick={e => e.stopPropagation()}
                                className="p-2 rounded-lg text-text-muted hover:bg-background-subtle transition-all"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1.5">
                            <DropdownMenuItem
                                onClick={e => {
                                    e.stopPropagation()
                                    onJobClick(job)
                                }}
                                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer font-medium"
                            >
                                <Eye className="w-4 h-4" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={e => {
                                    e.stopPropagation()
                                    onEdit(job)
                                }}
                                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer font-medium"
                            >
                                <Edit2 className="w-4 h-4" /> Edit posting
                            </DropdownMenuItem>
                            {job.status === 'Active' && (
                                <DropdownMenuItem
                                    onClick={e => {
                                        e.stopPropagation()
                                        onExpire(job)
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer font-medium text-warning-600 focus:text-warning-600"
                                >
                                    <Archive className="w-4 h-4" /> Expire job
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={e => {
                                    e.stopPropagation()
                                    onDelete(job)
                                }}
                                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer font-medium text-error-600 focus:text-error-600"
                            >
                                <Trash2 className="w-4 h-4" /> Permanently delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </tr>
    )
}

export function SkeletonJobTableRow() {
    return (
        <tr className="border-b border-border-subtle animate-pulse">
            <td className="py-6 px-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-background-muted rounded-xl" />
                    <div className="space-y-2">
                        <div className="h-4 bg-background-muted rounded w-40" />
                        <div className="h-3 bg-background-muted rounded w-24" />
                    </div>
                </div>
            </td>
            <td className="py-6 px-6">
                <div className="h-4 bg-background-muted rounded w-20" />
            </td>
            <td className="py-6 px-6">
                <div className="flex gap-4">
                    <div className="h-4 bg-background-muted rounded w-12" />
                    <div className="h-4 bg-background-muted rounded w-12" />
                </div>
            </td>
            <td className="py-6 px-6">
                <div className="h-6 bg-background-muted rounded-full w-20" />
            </td>
            <td className="py-6 px-6">
                <div className="w-8 h-8 bg-background-muted rounded-lg" />
            </td>
        </tr>
    )
}

export function JobsTable({
    jobs,
    onJobClick,
    onEdit,
    onExpire,
    onDelete,
    className,
}: JobsTableProps) {
    return (
        <div className={cn('w-full', className)}>
            <div className="bg-background-surface border border-border-default rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.02)]">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-background-subtle/80 to-background-subtle/30 border-b border-border-default">
                            <th className="py-4 px-6 text-left" style={{ width: '40%' }}>
                                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                                    Job details
                                </span>
                            </th>
                            <th className="py-4 px-6 text-left" style={{ width: '15%' }}>
                                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                                    Analytics
                                </span>
                            </th>
                            <th className="py-4 px-6 text-left" style={{ width: '15%' }}>
                                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                                    Status
                                </span>
                            </th>
                            <th className="py-4 px-6 text-left" style={{ width: '20%' }}>
                                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                                    Posted date
                                </span>
                            </th>
                            <th className="py-4 px-6 text-center" style={{ width: '10%' }}>
                                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                                    Actions
                                </span>
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {jobs.map((job, index) => (
                            <JobTableRow
                                key={job.job_id || job.id?.toString() || index}
                                job={job}
                                index={index}
                                onJobClick={onJobClick}
                                onEdit={onEdit}
                                onExpire={onExpire}
                                onDelete={onDelete}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
