'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { resumeService } from '@/services/resumeService'
import { profileService } from '@/services/profileService'
import { ResumeListResponse, ResumeCreate, ResumeResponse } from '@/types/resume'
import {
  Loader2,
  Plus,
  FileText,
  Trash2,
  X,
  Search,
  MoreVertical,
  Edit,
  Copy,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { PageTransition, AnimatedContainer, PageHeader } from '@/components/common'
import ResumeDetailSheet from '@/components/resume/ResumeDetailSheet'

interface CreateResumeModalProps {
  onClose: () => void
  onCreated: (resume: ResumeListResponse) => void
}

function CreateResumeModal({ onClose, onCreated }: CreateResumeModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [formData, setFormData] = useState<ResumeCreate>({
    target_job_title: '',
    custom_summary: '',
    work_experiences: [],
    educations: [],
    skills: [],
    certifications: [],
    social_links: [],
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await profileService.getProfile()
        setFormData(prev => ({
          ...prev,
          target_job_title: profile.professional_headline || '',
          custom_summary: profile.professional_summary || '',

          work_experiences: profile.work_experiences.map(exp => ({
            job_title: exp.job_title,
            company: exp.company,
            location: exp.location || '',
            start_date: exp.start_date,
            end_date: exp.end_date,
            is_current: exp.is_current,
            description: exp.description,
          })),
          educations: profile.educations.map(edu => ({
            college_name: edu.college_name,
            degree: edu.degree,
            location: edu.location,
            start_date: edu.start_date,
            end_date: edu.end_date,
            is_current: edu.is_current,
          })),
          skills: profile.skills.map(s => ({ skill_name: s.skill_name })),
          certifications: profile.certifications.map(c => ({
            certification_name: c.certification_name,
            issuing_body: c.issuing_body,
            credential_url: c.credential_url,
            issue_date: c.issue_date,
            expiration_date: c.expiration_date,
            does_not_expire: c.does_not_expire,
          })),
          social_links: profile.social_links.map(l => ({
            type: l.type,
            url: l.url,
          })),
        }))
      } catch {
        toast.error('Could not load profile data')
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.target_job_title) {
      toast.error('Target Job Title is required')
      return
    }
    setLoading(true)
    try {
      const newResume = await resumeService.createResumeFork(formData)
      const listResume: ResumeListResponse = {
        resume_id: newResume.resume_id,
        target_job_title: newResume.target_job_title,
        updated_at: newResume.updated_at,
      }
      toast.success('Resume created successfully!')
      onCreated(listResume)
    } catch (error) {
      console.error('Failed to create resume', error)
      toast.error('Failed to create resume')
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    const loadingContent = (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-[3px]"
          onClick={onClose}
        />
        <div className="relative bg-background-surface p-6 rounded-2xl shadow-2xl border border-border-default flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-text-secondary font-medium">Initializing...</p>
        </div>
      </div>
    )
    return typeof document !== 'undefined'
      ? createPortal(loadingContent, document.body)
      : loadingContent
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-[3px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-background-surface rounded-xl shadow-2xl border border-border-default w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border-default flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Create New Resume</h2>
            <p className="text-sm text-text-secondary mt-1">
              Start by specifying your target job title
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-subtle rounded-lg transition-colors text-text-muted hover:text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-primary">
              Target Job Title <span className="text-error">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={formData.target_job_title || ''}
              onChange={e => setFormData({ ...formData, target_job_title: e.target.value })}
              className="w-full px-4 py-3 border border-border-default rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-background-surface text-text-primary placeholder:text-text-muted"
              placeholder="e.g. Senior Backend Engineer"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn-primary-gradient text-white rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create & Edit Resume
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}

export default function ResumeListPage() {
  const [resumes, setResumes] = useState<ResumeListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')
  const [expandedResumeId, setExpandedResumeId] = useState<string | null>(null)
  const [resumeDetails, setResumeDetails] = useState<Record<string, ResumeResponse>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadResumes = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await resumeService.getAllResumes()
      setResumes(data)
    } catch (err) {
      console.warn('Failed to load resumes', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumeDetails = async (resumeId: string) => {
    if (resumeDetails[resumeId]) return
    try {
      const details = await resumeService.getResumeById(resumeId)
      setResumeDetails(prev => ({ ...prev, [resumeId]: details }))
    } catch (error) {
      console.error('Failed to load resume details', error)
    }
  }

  const filteredAndSortedResumes = useMemo(() => {
    const filtered = resumes.filter(resume =>
      resume.target_job_title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      } else {
        return (a.target_job_title || '').localeCompare(b.target_job_title || '')
      }
    })

    return filtered
  }, [resumes, searchQuery, sortBy])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this resume?')) return
    try {
      await resumeService.deleteResume(id)
      toast.success('Resume deleted successfully')
      loadResumes() // Refresh
    } catch {
      toast.error('Failed to delete resume')
    }
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const resume = await resumeService.getResumeById(id)
      const duplicateData: ResumeCreate = {
        target_job_title: resume.target_job_title ? `${resume.target_job_title} (Copy)` : null,
        custom_summary: resume.custom_summary,
        work_experiences: resume.work_experiences.map(exp => ({
          job_title: exp.job_title,
          company: exp.company,
          location: exp.location || null,
          start_date: exp.start_date || null,
          end_date: exp.end_date || null,
          is_current: exp.is_current,
          description: exp.description || null,
        })),
        educations: resume.educations.map(edu => ({
          college_name: edu.college_name,
          degree: edu.degree,
          location: edu.location || null,
          start_date: edu.start_date || null,
          end_date: edu.end_date || null,
          is_current: edu.is_current,
        })),
        skills: resume.skills.map(s => ({ skill_name: s.skill_name })),
        certifications: resume.certifications.map(c => ({
          certification_name: c.certification_name,
          issuing_body: c.issuing_body,
          credential_url: c.credential_url || null,
          issue_date: c.issue_date || null,
          expiration_date: c.expiration_date || null,
          does_not_expire: c.does_not_expire,
        })),
        social_links: resume.social_links.map(l => ({
          type: l.type,
          url: l.url,
        })),
      }
      await resumeService.createResumeFork(duplicateData)
      toast.success('Resume duplicated successfully')
      loadResumes()
    } catch (error) {
      console.error('Failed to duplicate resume', error)
      toast.error('Failed to duplicate resume')
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        expandedResumeId &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setExpandedResumeId(null)
      }
    }
    if (expandedResumeId) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 0)
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [expandedResumeId])

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="space-y-8 pb-12">
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-primary-50/50 dark:from-primary-950/30 to-background-surface border-b border-primary-50/50 dark:border-primary-900/30 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <PageHeader
                  title="Resume Builder"
                  subtitle="Create and manage tailored resumes from your profile data"
                />
              </div>
            </div>
          </AnimatedContainer>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {error && (
              <div className="bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 p-4 rounded-lg mb-6 flex items-center gap-2 border border-error-100 dark:border-error-800">
                <span className="font-medium">!</span> {error}
              </div>
            )}

            <AnimatedContainer direction="up" delay={0.2}>
              <div className="bg-background-surface rounded-xl border border-border-default p-6 min-h-[400px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2 text-text-primary">
                    <FileText className="w-5 h-5 text-primary" /> Your Resumes
                  </h2>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search resumes..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-border-default rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-background-surface text-text-primary placeholder:text-text-muted"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as 'date' | 'title')}
                        className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background-surface cursor-pointer text-text-primary hover:border-border-strong select-arrow"
                      >
                        <option value="date">Sort by Date</option>
                        <option value="title">Sort by Title</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="btn-primary-gradient text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 font-medium text-base whitespace-nowrap"
                    >
                      <Plus className="w-5 h-5" /> Create New Resume
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-20 bg-background-subtle/50 dark:bg-background-surface/50 rounded-xl border-2 border-dashed border-border-subtle dark:border-border-default">
                    <div className="bg-background-surface w-20 h-20 rounded-xl shadow-sm border border-border-subtle dark:border-border-default flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-primary-400 dark:text-primary-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      No resumes created yet
                    </h3>
                    <p className="text-text-secondary mb-6 max-w-sm mx-auto">
                      Create your first resume to get started with your job applications!
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-primary font-medium hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                    >
                      Create your first resume
                    </button>
                  </div>
                ) : filteredAndSortedResumes.length === 0 ? (
                  <div className="text-center py-16 bg-background-subtle/50 dark:bg-background-surface/50 rounded-xl border-2 border-dashed border-border-subtle dark:border-border-default">
                    <div className="bg-background-surface w-16 h-16 rounded-xl shadow-sm border border-border-subtle dark:border-border-default flex items-center justify-center mx-auto mb-3">
                      <Search className="w-8 h-8 text-primary-400 dark:text-primary-500" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">
                      No resumes found
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Create your first resume to get started!'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedResumes.map(resume => {
                      const details = resumeDetails[resume.resume_id]
                      const isExpanded = expandedResumeId === resume.resume_id

                      return (
                        <div
                          key={resume.resume_id}
                          onClick={() => setSelectedResumeId(resume.resume_id)}
                          className="group cursor-pointer transition-all duration-200 w-full bg-background-surface dark:bg-[#1E293B] rounded-xl border border-border-default dark:border-[#334155] py-5 px-6 hover:border-border-strong dark:hover:border-[#475569] hover:shadow-md relative"
                          role="button"
                          tabIndex={0}
                          aria-label={`View resume for ${resume.target_job_title || 'General Resume'}`}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedResumeId(resume.resume_id)
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="font-semibold text-lg text-text-primary group-hover:text-primary transition-colors truncate">
                              {resume.target_job_title || 'General Resume'}
                            </h3>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-sm text-text-tertiary whitespace-nowrap">
                                {new Date(resume.updated_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <div className="relative" ref={isExpanded ? dropdownRef : null}>
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    const newExpandedId =
                                      expandedResumeId === resume.resume_id
                                        ? null
                                        : resume.resume_id
                                    setExpandedResumeId(newExpandedId)
                                    if (newExpandedId && !details) {
                                      loadResumeDetails(resume.resume_id)
                                    }
                                  }}
                                  className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-background-subtle dark:hover:bg-background-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {isExpanded && (
                                  <div
                                    onClick={e => e.stopPropagation()}
                                    className="absolute right-0 top-9 bg-background-surface dark:bg-[#1E293B] border border-border-default dark:border-[#334155] rounded-xl shadow-lg py-1 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                  >
                                    <button
                                      onClick={e => {
                                        e.stopPropagation()
                                        setSelectedResumeId(resume.resume_id)
                                        setExpandedResumeId(null)
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-background-subtle dark:hover:bg-background-muted flex items-center gap-2"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={e => handleDuplicate(resume.resume_id, e)}
                                      className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-background-subtle dark:hover:bg-background-muted flex items-center gap-2"
                                    >
                                      <Copy className="w-4 h-4" />
                                      Duplicate
                                    </button>
                                    <button
                                      onClick={e => handleDelete(resume.resume_id, e)}
                                      className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error-50 dark:hover:bg-error-950/30 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </AnimatedContainer>

            {isModalOpen && (
              <CreateResumeModal
                onClose={() => setIsModalOpen(false)}
                onCreated={newResume => {
                  setResumes([...(resumes || []), newResume])
                  setIsModalOpen(false)
                  setSelectedResumeId(newResume.resume_id)
                }}
              />
            )}

            {selectedResumeId && (
              <ResumeDetailSheet
                resumeId={selectedResumeId}
                isOpen={!!selectedResumeId}
                onClose={() => setSelectedResumeId(null)}
                onUpdate={loadResumes}
              />
            )}
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
