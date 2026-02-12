'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  Calendar,
} from 'lucide-react'
import { AppShell } from '../../../components/layout/AppShell'
import { ActionButton } from '../../../components/ui'
import { PageTransition, AnimatedContainer } from '../../../components/common'
import { RecruiterModal, RecruiterFormData } from '../../../components/organization/RecruiterModal'
import {
  useRecruiters,
  useCreateRecruiter,
  useUpdateRecruiter,
  useDeleteRecruiter,
} from '../../../hooks/queries/useRecruiters'
import type { Recruiter as BackendRecruiter } from '../../../services/organizationService'
import { UserAvatar } from '../../../components/ui/UserAvatar'
import { cn } from '../../../lib/utils'
import { useDeleteConfirm } from '../../../components/ui/delete-confirm-dialog'

interface Recruiter {
  id: string
  name: string
  email: string
  status: string
  activeJobs: number
  joinedDate: string
  avatar: string
}

const transformRecruiter = (backendRecruiter: BackendRecruiter): Recruiter => {
  const joinedDate = new Date(backendRecruiter.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return {
    id: backendRecruiter.id,
    name: backendRecruiter.name,
    email: backendRecruiter.email,
    status: 'Active',
    activeJobs: 0,
    joinedDate,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(backendRecruiter.name)}&background=random`,
  }
}

interface ActionDropdownProps {
  recruiter: Recruiter
  onClose: () => void
  onEdit: (recruiter: Recruiter) => void
  onDelete: (id: string, name: string) => void
}

function ActionDropdown({ recruiter, onClose, onEdit, onDelete }: ActionDropdownProps) {
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

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 z-50 bg-background-surface border border-border-default rounded-xl shadow-lg py-2 min-w-[160px] shadow-[0_4px_6px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_6px_rgba(0,0,0,0.2),0_10px_20px_rgba(0,0,0,0.4)]"
    >
      <button
        onClick={e => {
          e.stopPropagation()
          onEdit(recruiter)
          onClose()
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30"
      >
        <Pencil className="w-4 h-4" />
        <span>Edit Details</span>
      </button>
      <button
        onClick={e => {
          e.stopPropagation()
          onDelete(recruiter.id, recruiter.name)
          onClose()
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 text-text-secondary hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete Recruiter</span>
      </button>
    </div>
  )
}

function SkeletonTableRow() {
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
        <div className="h-4 bg-background-muted rounded w-48" />
      </td>
      <td className="py-6 px-6">
        <div className="h-6 bg-background-muted rounded-full w-20" />
      </td>
      <td className="py-6 px-6">
        <div className="h-4 bg-background-muted rounded w-28" />
      </td>
      <td className="py-6 px-6">
        <div className="w-8 h-8 bg-background-muted rounded-lg mx-auto" />
      </td>
    </tr>
  )
}

export default function RecruitersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const pageSize = 10

  const { data: backendRecruiters, isLoading, error, refetch: refetchRecruiters } = useRecruiters()
  const createRecruiterMutation = useCreateRecruiter()
  const updateRecruiterMutation = useUpdateRecruiter()
  const deleteRecruiterMutation = useDeleteRecruiter()

  const { confirm, Dialog } = useDeleteConfirm()

  const recruiters = useMemo(() => {
    if (!backendRecruiters) return []
    return backendRecruiters.map(transformRecruiter)
  }, [backendRecruiters])

  const filteredRecruiters = useMemo(() => {
    return recruiters.filter(
      recruiter =>
        recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recruiter.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [recruiters, searchTerm])

  const paginatedRecruiters = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRecruiters.slice(startIndex, startIndex + pageSize)
  }, [filteredRecruiters, currentPage, pageSize])

  const totalRecruiters = filteredRecruiters.length
  const totalPages = Math.ceil(totalRecruiters / pageSize)
  const startIndex = totalRecruiters > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endIndex = Math.min(currentPage * pageSize, totalRecruiters)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        refetchRecruiters()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [refetchRecruiters])

  const handleAddRecruiter = () => {
    setModalMode('add')
    setSelectedRecruiter(null)
    setIsModalOpen(true)
  }

  const handleEditRecruiter = (recruiter: Recruiter) => {
    setModalMode('edit')
    setSelectedRecruiter(recruiter)
    setIsModalOpen(true)
    setActiveDropdown(null)
  }

  const handleDeleteRecruiter = async (id: string, name: string) => {
    await confirm({
      title: 'Delete Recruiter',
      description: "You're about to permanently delete",
      itemName: name,
      onConfirm: async () => {
        try {
          await deleteRecruiterMutation.mutateAsync(id)
          setActiveDropdown(null)
        } catch (error) {
          console.error('Failed to delete recruiter:', error)
          alert('Failed to delete recruiter. Please try again.')
        }
      },
    })
  }

  const handleModalSubmit = async (data: RecruiterFormData) => {
    try {
      if (modalMode === 'add') {
        if (!data.password) {
          alert('Password is required when creating a new recruiter.')
          return
        }
        await createRecruiterMutation.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password,
        })
      } else {
        if (selectedRecruiter) {
          await updateRecruiterMutation.mutateAsync({
            id: selectedRecruiter.id,
            data: {
              name: data.name,
              email: data.email,
              ...(data.password && data.password.trim() && { password: data.password }),
            },
          })
        }
      }
      setIsModalOpen(false)
      setSelectedRecruiter(null)
    } catch (error) {
      console.error('Failed to save recruiter:', error)
      alert('Failed to save recruiter. Please try again.')
    }
  }

  const handleSort = (field: string) => {
    setSortField(sortField === field ? null : field)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const truncateEmail = (email: string, maxLength: number = 28) => {
    if (email.length <= maxLength) return email
    return `${email.slice(0, maxLength)}...`
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          {/* Page Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-[32px] max-lg:text-[28px] font-bold text-text-primary leading-tight tracking-tight">
                  Recruiters
                </h1>
                <p className="text-base text-text-secondary">
                  Manage your recruitment team and their access
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-background-surface rounded-lg border border-border-default shadow-sm">
                  <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-text-primary leading-tight">
                      {recruiters.length}
                    </p>
                    <p className="text-xs text-text-muted">Total</p>
                  </div>
                </div>
                <button
                  onClick={handleAddRecruiter}
                  disabled={
                    isLoading ||
                    createRecruiterMutation.isPending ||
                    updateRecruiterMutation.isPending ||
                    deleteRecruiterMutation.isPending
                  }
                  className="btn-primary-gradient inline-flex items-center gap-2 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Add Recruiter
                </button>
              </div>
            </div>
            <div className="mt-6 border-b border-border-default/60" />
          </AnimatedContainer>

          {/* Search Bar */}
          <div className="space-y-8">
            <AnimatedContainer direction="up" delay={0.15}>
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-background-surface border border-border-default rounded-2xl shadow-sm">
                  <div className="relative w-full lg:w-[420px]">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-12 pr-4 py-3 text-sm bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted font-medium"
                    />
                  </div>
                </div>
              </div>
            </AnimatedContainer>

            {/* Table */}
            <AnimatedContainer direction="up" delay={0.2}>
              <div className="w-full">
                {isLoading ? (
                  <div
                    className="bg-background-surface border border-border-default rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-background-subtle to-background-subtle/50 border-b border-border-default">
                          <th className="py-4 px-6 text-left" style={{ width: '30%' }}>
                            <div className="h-3 bg-border-default rounded w-20" />
                          </th>
                          <th className="py-4 px-6 text-left" style={{ width: '30%' }}>
                            <div className="h-3 bg-border-default rounded w-16" />
                          </th>
                          <th className="py-4 px-6 text-left" style={{ width: '15%' }}>
                            <div className="h-3 bg-border-default rounded w-14" />
                          </th>
                          <th className="py-4 px-6 text-left" style={{ width: '20%' }}>
                            <div className="h-3 bg-border-default rounded w-20" />
                          </th>
                          <th className="py-4 px-6 text-center" style={{ width: '8%' }}>
                            <div className="h-3 bg-border-default rounded w-12 mx-auto" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <SkeletonTableRow key={index} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : error ? (
                  <div
                    className="bg-background-surface border border-border-default rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-error-50 dark:bg-error-950/30 border border-error-100 dark:border-error-800 rounded-2xl flex items-center justify-center mb-6">
                        <Users className="w-8 h-8 text-error-400 dark:text-error-300" />
                      </div>
                      <h3 className="text-xl font-semibold text-text-primary mb-2">
                        Error loading recruiters
                      </h3>
                      <p className="text-sm text-text-tertiary max-w-md mb-6 leading-relaxed">
                        {error instanceof Error
                          ? error.message
                          : 'There was an error loading the recruiters. Please try again.'}
                      </p>
                      <ActionButton onClick={() => refetchRecruiters()} variant="primary" size="md">
                        Try Again
                      </ActionButton>
                    </div>
                  </div>
                ) : paginatedRecruiters.length === 0 ? (
                  <div className="bg-background-surface border border-border-default rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15)]">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 flex items-center justify-center mb-6 bg-background-subtle rounded-2xl">
                        <Users className="w-8 h-8 text-text-muted" />
                      </div>
                      <h3 className="text-xl font-semibold text-text-primary mb-2">
                        {searchTerm ? 'No recruiters found' : 'No recruiters yet'}
                      </h3>
                      <p className="text-sm text-text-tertiary max-w-md leading-relaxed">
                        {searchTerm
                          ? `No recruiters match your search for "${searchTerm}". Try adjusting your search terms.`
                          : 'Add your first recruiter to start building your team.'}
                      </p>
                      {!searchTerm && (
                        <ActionButton onClick={handleAddRecruiter} variant="primary" size="md">
                          <Plus className="w-4 h-4" />
                          Add Recruiter
                        </ActionButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-background-surface border border-border-default rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15)]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-background-subtle to-background-subtle/50 border-b border-border-default">
                          <th className="py-4 px-6 text-left" style={{ width: '30%' }}>
                            <button
                              onClick={() => handleSort('name')}
                              className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors duration-200"
                            >
                              Recruiter
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>
                          </th>
                          <th className="py-4 px-6 text-left" style={{ width: '30%' }}>
                            <button
                              onClick={() => handleSort('email')}
                              className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors duration-200"
                            >
                              Email
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>
                          </th>
                          <th className="py-4 px-6 text-left" style={{ width: '15%' }}>
                            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                              Status
                            </span>
                          </th>
                          <th className="py-4 px-6 text-left" style={{ width: '20%' }}>
                            <button
                              onClick={() => handleSort('joinedDate')}
                              className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors duration-200"
                            >
                              Joined Date
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
                        {paginatedRecruiters.map((recruiter, index) => {
                          const isEven = index % 2 === 0

                          return (
                            <tr
                              key={recruiter.id}
                              className={cn(
                                'border-b border-border-subtle transition-all duration-200 group',
                                isEven ? 'bg-background-surface' : 'bg-background-subtle/30',
                                'hover:bg-primary-50/50 dark:hover:bg-primary-950/30 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm'
                              )}
                              style={{ minHeight: '80px' }}
                            >
                              <td className="py-6 px-6">
                                <div className="flex items-center gap-4">
                                  <UserAvatar
                                    name={recruiter.name}
                                    src={recruiter.avatar}
                                    className="w-12 h-12 border-2 border-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[15px] font-semibold text-text-primary group-hover:text-primary-600 transition-colors duration-200 truncate">
                                      {recruiter.name}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-6 px-6">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-text-muted" />
                                  <span
                                    className="text-[13px] text-text-secondary font-medium"
                                    title={recruiter.email}
                                  >
                                    {truncateEmail(recruiter.email)}
                                  </span>
                                </div>
                              </td>

                              <td className="py-6 px-6">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold capitalize border bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 border-success-200 dark:border-success-800">
                                  {recruiter.status}
                                </span>
                              </td>

                              <td className="py-6 px-6">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                                  <span className="text-sm text-text-secondary">
                                    {recruiter.joinedDate}
                                  </span>
                                </div>
                              </td>

                              <td className="py-6 px-6 text-center">
                                <div className="relative inline-block">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      setActiveDropdown(
                                        activeDropdown === recruiter.id ? null : recruiter.id
                                      )
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-background-subtle hover:text-text-secondary transition-all duration-200 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {activeDropdown === recruiter.id && (
                                    <ActionDropdown
                                      recruiter={recruiter}
                                      onClose={() => setActiveDropdown(null)}
                                      onEdit={handleEditRecruiter}
                                      onDelete={handleDeleteRecruiter}
                                    />
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-background-subtle to-background-subtle/50 border-t border-border-default">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-text-tertiary" />
                        <p className="text-sm font-medium text-text-secondary">
                          Showing {startIndex}-{endIndex} of {totalRecruiters} recruiters
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
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
                              onClick={() => handlePageChange(pageNum)}
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
                          onClick={() => handlePageChange(currentPage + 1)}
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
                )}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>

      <RecruiterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedRecruiter(null)
        }}
        onSubmit={handleModalSubmit}
        initialData={
          selectedRecruiter
            ? {
                name: selectedRecruiter.name,
                email: selectedRecruiter.email,
              }
            : undefined
        }
        mode={modalMode}
      />

      <Dialog />
    </AppShell>
  )
}
