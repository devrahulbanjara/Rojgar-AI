'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  CheckCircle2,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer } from '../../../components/common'
import { RecruiterModal, RecruiterFormData } from '../../../components/organization/RecruiterModal'
import {
  useRecruiters,
  useCreateRecruiter,
  useUpdateRecruiter,
  useDeleteRecruiter,
} from '../../../hooks/queries/useRecruiters'
import type { Recruiter as BackendRecruiter } from '../../../services/organizationService'

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
    month: 'short',
    day: '2-digit',
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

export default function RecruitersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const { data: backendRecruiters, isLoading, error, refetch: refetchRecruiters } = useRecruiters()
  const createRecruiterMutation = useCreateRecruiter()
  const updateRecruiterMutation = useUpdateRecruiter()
  const deleteRecruiterMutation = useDeleteRecruiter()

  const recruiters = useMemo(() => {
    if (!backendRecruiters) return []
    return backendRecruiters.map(transformRecruiter)
  }, [backendRecruiters])

  const filteredRecruiters = recruiters.filter(
    recruiter =>
      recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recruiter.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    setActiveMenuId(null)
  }

  const handleDeleteRecruiter = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recruiter?')) {
      try {
        await deleteRecruiterMutation.mutateAsync(id)
        setActiveMenuId(null)
      } catch (error) {
        console.error('Failed to delete recruiter:', error)
        alert('Failed to delete recruiter. Please try again.')
      }
    }
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

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-[32px] max-lg:text-[28px] font-bold text-text-primary leading-tight tracking-tight">
                  Recruiters
                </h1>
                <p className="text-base text-text-secondary">
                  Manage your recruitment team and their access.
                </p>
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
            <div className="mt-6 border-b border-border-default/60" />
          </AnimatedContainer>

          <div className="space-y-8">
            <AnimatedContainer direction="up" delay={0.2}>
              <div className="flex items-center gap-4 bg-background-surface p-4 rounded-2xl border border-border-default shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search recruiters by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </AnimatedContainer>

            <AnimatedContainer direction="up" delay={0.3}>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text-primary">Recruiter Team</h2>
                  <span className="text-sm font-medium text-text-tertiary bg-background-subtle px-3 py-1 rounded-full">
                    Total: {filteredRecruiters.length}
                  </span>
                </div>

                {isLoading && (
                  <div className="bg-background-surface rounded-2xl border border-border-default p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-background-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary">Loading recruiters...</h3>
                  </div>
                )}

                {error && (
                  <div className="bg-error-50 border border-error-200 rounded-2xl p-6 text-center shadow-sm">
                    <h3 className="text-lg font-medium text-error-900 mb-2">
                      Failed to load recruiters
                    </h3>
                    <p className="text-error-700 text-sm">
                      {error instanceof Error
                        ? error.message
                        : 'An error occurred. Please try again.'}
                    </p>
                  </div>
                )}

                {!isLoading && !error && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRecruiters.map(recruiter => (
                      <div
                        key={recruiter.id}
                        className="group relative bg-background-surface rounded-[24px] border border-border-default p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:border-primary-200"
                      >
                        {}
                        <div className="absolute top-6 right-6 z-10">
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === recruiter.id ? null : recruiter.id)
                            }
                            className="p-2 text-text-muted hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {activeMenuId === recruiter.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-3 mr-1 w-52 bg-background-surface/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-border-subtle z-20 py-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                                <button
                                  onClick={() => handleEditRecruiter(recruiter)}
                                  className="w-full px-4 py-3 text-left text-sm text-text-secondary hover:bg-background-subtle hover:text-primary-600 flex items-center gap-3 transition-colors group/item"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-text-muted group-hover/item:text-primary-500 transition-colors" />
                                  <span className="font-medium">Edit Details</span>
                                </button>

                                <div className="h-px bg-border-subtle/60 my-1 mx-2" />

                                <button
                                  onClick={() => handleDeleteRecruiter(recruiter.id)}
                                  className="w-full px-4 py-3 text-left text-sm text-error-600 hover:bg-error-50 flex items-center gap-3 transition-colors group/item"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-error-500 group-hover/item:scale-110 transition-transform" />
                                  <span className="font-medium">Delete Recruiter</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {}
                        <div className="flex flex-col h-full">
                          <div className="flex flex-col items-center text-center gap-4 mb-8">
                            <div className="relative">
                              {}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={recruiter.avatar}
                                alt={recruiter.name}
                                className="w-20 h-20 rounded-[20px] border-4 border-background-surface shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 rounded-[20px] ring-1 ring-text-primary/5 ring-inset" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-extrabold text-text-primary truncate group-hover:text-primary-600 transition-colors tracking-tight mb-1">
                                {recruiter.name}
                              </h3>
                              <div className="flex items-center justify-center gap-1.5 text-sm text-text-tertiary font-medium">
                                <Mail className="w-3.5 h-3.5 text-text-muted" />
                                {recruiter.email}
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-6 border-t border-border-subtle">
                            <div className="flex items-center justify-center">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-subtle rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5 text-text-muted" />
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                                  Joined {recruiter.joinedDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && !error && filteredRecruiters.length === 0 && (
                  <div className="bg-background-surface rounded-2xl border border-border-default p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-background-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-text-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary">No recruiters found</h3>
                    <p className="text-text-tertiary mt-1">Try adjusting your search terms.</p>
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
    </AppShell>
  )
}
