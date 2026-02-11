'use client'

import React, { useState } from 'react'
import { CandidateApplication } from '../../types/candidate'
import { cn } from '../../lib/utils'
import {
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Send,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import { UserAvatar } from '../ui/UserAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface CandidatesTableProps {
  candidates: CandidateApplication[]
  onCandidateClick: (candidate: CandidateApplication) => void
  currentPage: number
  totalCandidates: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

interface ActionDropdownProps {
  candidate: CandidateApplication
}

function ActionDropdown({ candidate: _candidate }: ActionDropdownProps) {
  const menuItems = [
    { icon: Eye, label: 'View Resume', onClick: () => {} },
    { icon: Send, label: 'Send Email', onClick: () => {} },
    { icon: Trash2, label: 'Delete', onClick: () => {}, isDanger: true },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-background-subtle hover:text-text-secondary transition-all duration-200 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {menuItems.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={e => {
              e.stopPropagation()
              item.onClick()
            }}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              item.isDanger
                ? 'text-text-secondary hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30'
                : 'text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusStyles(status: string): { bg: string; text: string; border: string } {
  switch (status.toLowerCase()) {
    case 'applied':
      return {
        bg: 'bg-primary-50 dark:bg-primary-950/30',
        text: 'text-primary-600 dark:text-primary-400',
        border: 'border-primary-200 dark:border-primary-800',
      }
    case 'interviewing':
      return {
        bg: 'bg-warning-50 dark:bg-warning-950/30',
        text: 'text-warning-600 dark:text-warning-400',
        border: 'border-warning-200 dark:border-warning-800',
      }
    case 'shortlisted':
      return {
        bg: 'bg-success-50 dark:bg-success-950/30',
        text: 'text-success-600 dark:text-success-400',
        border: 'border-success-200 dark:border-success-800',
      }
    case 'rejected':
      return {
        bg: 'bg-error-50 dark:bg-error-950/30',
        text: 'text-error-600 dark:text-error-400',
        border: 'border-error-200 dark:border-error-800',
      }
    case 'outcome':
      return {
        bg: 'bg-success-50 dark:bg-success-950/30',
        text: 'text-success-600 dark:text-success-400',
        border: 'border-success-200 dark:border-success-800',
      }
    default:
      return {
        bg: 'bg-background-subtle',
        text: 'text-text-tertiary',
        border: 'border-border-default',
      }
  }
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-border-subtle animate-pulse">
      <td className="py-6 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-background-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 bg-background-muted rounded w-32" />
            <div className="h-3 bg-background-muted rounded w-24" />
          </div>
        </div>
      </td>
      <td className="py-6 px-6">
        <div className="space-y-2">
          <div className="h-4 bg-background-muted rounded w-28" />
          <div className="h-3 bg-background-muted rounded w-20" />
        </div>
      </td>
      <td className="py-6 px-6">
        <div className="space-y-2">
          <div className="h-3 bg-background-muted rounded w-36" />
          <div className="h-3 bg-background-muted rounded w-24" />
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

export function CandidatesTable({
  candidates,
  onCandidateClick,
  currentPage,
  totalCandidates,
  pageSize,
  onPageChange,
  className,
}: CandidatesTableProps) {
  const [sortField, setSortField] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCandidates / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCandidates)

  const handleSort = (field: string) => {
    setSortField(sortField === field ? null : field)
  }

  const truncateEmail = (email: string, maxLength: number = 24) => {
    if (email.length <= maxLength) return email
    return `${email.slice(0, maxLength)}...`
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-background-surface border border-border-default rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-background-subtle to-background-subtle/50 border-b border-border-default">
              <th className="py-4 px-6 text-left" style={{ width: '40%' }}>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors duration-200"
                >
                  Candidate
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>

              <th className="py-4 px-6 text-left" style={{ width: '25%' }}>
                <button
                  onClick={() => handleSort('job_title')}
                  className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors duration-200"
                >
                  Applied For
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>

              <th className="py-4 px-6 text-left" style={{ width: '25%' }}>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Contact
                </span>
              </th>

              <th className="py-4 px-6 text-left" style={{ width: '15%' }}>
                <button
                  onClick={() => handleSort('current_status')}
                  className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors duration-200"
                >
                  Status
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>

              <th className="py-4 px-6 text-center" style={{ width: '8%' }}>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {candidates.map((candidate, index) => {
              const statusStyles = getStatusStyles(candidate.current_status)
              const isEven = index % 2 === 0

              return (
                <tr
                  key={candidate.application_id}
                  onClick={() => onCandidateClick(candidate)}
                  className={cn(
                    'border-b border-border-subtle cursor-pointer transition-all duration-200 group',
                    isEven ? 'bg-background-surface' : 'bg-background-subtle/30',
                    'hover:bg-primary-50/50 dark:hover:bg-primary-950/30 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm'
                  )}
                  style={{ minHeight: '80px' }}
                >
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        name={candidate.name}
                        src={candidate.picture || undefined}
                        className="w-12 h-12 border-2 border-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-text-primary group-hover:text-primary-600 transition-colors duration-200 truncate">
                          {candidate.name}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatFullDate(candidate.applied_at)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-6 px-6">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {candidate.job_title}
                    </p>
                  </td>

                  <td className="py-6 px-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-text-muted" />
                        <span
                          className="text-[13px] text-text-secondary font-medium"
                          title={candidate.email}
                        >
                          {truncateEmail(candidate.email)}
                        </span>
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-text-muted" />
                          <span className="text-[13px] text-text-secondary">{candidate.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-6 px-6">
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold capitalize border',
                        statusStyles.bg,
                        statusStyles.text,
                        statusStyles.border
                      )}
                    >
                      {candidate.current_status}
                    </span>
                  </td>

                  <td className="py-6 px-6 text-center">
                    <ActionDropdown candidate={candidate} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-background-subtle to-background-subtle/50 border-t border-border-default">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">
              Showing {startIndex}-{endIndex} of {totalCandidates} candidates
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-200',
                currentPage === 1
                  ? 'bg-background-surface border-border-default text-text-muted cursor-not-allowed'
                  : 'bg-background-surface border-border-default text-text-secondary hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:border-primary-200 dark:hover:border-primary-800 hover:text-primary-600 dark:hover:text-primary-400'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200',
                    currentPage === pageNum
                      ? 'bg-primary-600 text-text-inverse shadow-sm'
                      : 'bg-background-surface border border-border-default text-text-secondary hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-200',
                currentPage === totalPages || totalPages === 0
                  ? 'bg-background-surface border-border-default text-text-muted cursor-not-allowed'
                  : 'bg-background-surface border-border-default text-text-secondary hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:border-primary-200 dark:hover:border-primary-800 hover:text-primary-600 dark:hover:text-primary-400'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmptyTableState({
  isSearchMode,
  searchQuery,
}: {
  isSearchMode: boolean
  searchQuery: string
}) {
  return (
    <div className="bg-background-surface border border-border-default rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 flex items-center justify-center mb-6 bg-background-subtle rounded-2xl">
          <Users className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          {isSearchMode ? 'No candidates found' : 'No candidates yet'}
        </h3>
        <p className="text-sm text-text-tertiary max-w-md leading-relaxed">
          {isSearchMode
            ? `No candidates match your search for "${searchQuery}". Try adjusting your search terms.`
            : 'Candidates will appear here once they apply to your job postings.'}
        </p>
      </div>
    </div>
  )
}
