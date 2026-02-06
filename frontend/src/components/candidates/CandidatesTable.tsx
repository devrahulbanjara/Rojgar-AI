'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  onClose: () => void
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
      return { bg: '#EEF2FF', text: '#6366F1', border: '#C7D2FE' }
    case 'interviewing':
      return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' }
    case 'shortlisted':
      return { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' }
    case 'rejected':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' }
    case 'outcome':
      return { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' }
    default:
      return { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' }
  }
}

function ActionDropdown({ candidate: _candidate, onClose }: ActionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const menuItems = [
    { icon: Eye, label: 'View Resume', onClick: () => {} },
    { icon: Send, label: 'Send Email', onClick: () => {} },
    { icon: Trash2, label: 'Delete', onClick: () => {}, isDanger: true },
  ]

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-2 min-w-[160px]"
      style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.1)' }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={e => {
            e.stopPropagation()
            item.onClick()
            onClose()
          }}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200',
            item.isDanger
              ? 'text-slate-700 hover:text-red-600 hover:bg-red-50'
              : 'text-slate-700 hover:text-indigo-600 hover:bg-indigo-50'
          )}
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      <td className="py-6 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-3 bg-slate-200 rounded w-24" />
          </div>
        </div>
      </td>
      <td className="py-6 px-6">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-3 bg-slate-200 rounded w-20" />
        </div>
      </td>
      <td className="py-6 px-6">
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-36" />
          <div className="h-3 bg-slate-200 rounded w-24" />
        </div>
      </td>
      <td className="py-6 px-6">
        <div className="h-6 bg-slate-200 rounded-full w-20" />
      </td>
      <td className="py-6 px-6">
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
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
      <div
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.02)' }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-50/50 border-b border-slate-200">
              <th className="py-4 px-6 text-left" style={{ width: '40%' }}>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-900 transition-colors duration-200"
                >
                  Candidate
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>

              <th className="py-4 px-6 text-left" style={{ width: '25%' }}>
                <button
                  onClick={() => handleSort('job_title')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-900 transition-colors duration-200"
                >
                  Applied For
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>

              <th className="py-4 px-6 text-left" style={{ width: '25%' }}>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contact
                </span>
              </th>

              <th className="py-4 px-6 text-left" style={{ width: '15%' }}>
                <button
                  onClick={() => handleSort('current_status')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-900 transition-colors duration-200"
                >
                  Status
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>

              <th className="py-4 px-6 text-center" style={{ width: '8%' }}>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
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
                    'border-b border-slate-100 cursor-pointer transition-all duration-200 group',
                    isEven ? 'bg-white' : 'bg-slate-50/30',
                    'hover:bg-indigo-50/50 hover:border-indigo-200 hover:shadow-sm'
                  )}
                  style={{ minHeight: '80px' }}
                >
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        name={candidate.name}
                        src={candidate.picture || undefined}
                        className="w-12 h-12 border-2 border-white shadow-sm ring-1 ring-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200 truncate">
                          {candidate.name}
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          {formatFullDate(candidate.applied_at)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-6 px-6">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {candidate.job_title}
                    </p>
                  </td>

                  <td className="py-6 px-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span
                          className="text-[13px] text-slate-600 font-medium"
                          title={candidate.email}
                        >
                          {truncateEmail(candidate.email)}
                        </span>
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[13px] text-slate-600">{candidate.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-6 px-6">
                    <span
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold capitalize border"
                      style={{
                        backgroundColor: statusStyles.bg,
                        color: statusStyles.text,
                        borderColor: statusStyles.border,
                      }}
                    >
                      {candidate.current_status}
                    </span>
                  </td>

                  <td className="py-6 px-6 text-center">
                    <div className="relative inline-block">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setActiveDropdown(
                            activeDropdown === candidate.application_id
                              ? null
                              : candidate.application_id
                          )
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeDropdown === candidate.application_id && (
                        <ActionDropdown
                          candidate={candidate}
                          onClose={() => setActiveDropdown(null)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-50/50 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-600">
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
                  ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
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
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
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
                  ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
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
    <div
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.02)' }}
    >
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 flex items-center justify-center mb-6 bg-slate-100 rounded-2xl">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {isSearchMode ? 'No candidates found' : 'No candidates yet'}
        </h3>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          {isSearchMode
            ? `No candidates match your search for "${searchQuery}". Try adjusting your search terms.`
            : 'Candidates will appear here once they apply to your job postings.'}
        </p>
      </div>
    </div>
  )
}
