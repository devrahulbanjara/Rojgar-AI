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
  Download,
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
        <div className="fixed inset-0 bg-black/5 backdrop-blur-[3px]" onClick={onClose} />
        <div className="relative bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Initializing...</p>
        </div>
      </div>
    )
    return typeof document !== 'undefined'
      ? createPortal(loadingContent, document.body)
      : loadingContent
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Very subtle backdrop blur */}
      <div
        className="fixed inset-0 bg-black/5 backdrop-blur-[3px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">Create New Resume</h2>
            <p className="text-sm text-[#475569] mt-1">Start by specifying your target job title</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0F172A]">
              Target Job Title <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={formData.target_job_title || ''}
              onChange={e => setFormData({ ...formData, target_job_title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white text-[#0F172A] placeholder:text-slate-400"
              placeholder="e.g. Senior Backend Engineer"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
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
    let filtered = resumes.filter(resume =>
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
      const newResume = await resumeService.createResumeFork(duplicateData)
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
      // Use a small delay to avoid immediate closure when opening
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
      <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <div className="space-y-8 pb-12">
          {/* Enhanced Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <PageHeader
                  title="Resume Builder"
                  subtitle="Create and manage tailored resumes from your profile data"
                />
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-100">
                <span className="font-medium">!</span> {error}
              </div>
            )}

            <AnimatedContainer direction="up" delay={0.2}>
              <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[400px]">
                {/* Header with Search and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2 text-[#0F172A]">
                    <FileText className="w-5 h-5 text-indigo-600" /> Your Resumes
                  </h2>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search resumes..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white text-[#0F172A] placeholder:text-slate-400"
                      />
                    </div>
                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as 'date' | 'title')}
                        className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white cursor-pointer text-[#0F172A] hover:border-slate-300 select-arrow"
                      >
                        <option value="date">Sort by Date</option>
                        <option value="title">Sort by Title</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {/* Create Button */}
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 font-medium text-base whitespace-nowrap"
                    >
                      <Plus className="w-5 h-5" /> Create New Resume
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="bg-white w-20 h-20 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                      No resumes created yet
                    </h3>
                    <p className="text-[#475569] mb-6 max-w-sm mx-auto">
                      Create your first resume to get started with your job applications!
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline transition-colors"
                    >
                      Create your first resume
                    </button>
                  </div>
                ) : filteredAndSortedResumes.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="bg-white w-16 h-16 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-base font-semibold text-[#0F172A] mb-1">
                      No resumes found
                    </h3>
                    <p className="text-sm text-[#475569]">
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
                      const topSkills = details?.skills?.slice(0, 5).map(s => s.skill_name) || []
                      const experienceCount = details?.work_experiences?.length || 0
                      const educationCount = details?.educations?.length || 0
                      const totalSections =
                        experienceCount +
                        educationCount +
                        (details?.certifications?.length || 0) +
                        (details?.skills?.length || 0)

                      // Generate description with more context
                      const getDescription = () => {
                        const parts: string[] = []
                        if (experienceCount > 0) {
                          parts.push(
                            `${experienceCount} ${experienceCount === 1 ? 'role' : 'roles'}`
                          )
                        }
                        if (educationCount > 0) {
                          parts.push(
                            `${educationCount} ${educationCount === 1 ? 'degree' : 'degrees'}`
                          )
                        }
                        if (topSkills.length > 0) {
                          parts.push(`${topSkills.length}+ skills`)
                        }
                        if (parts.length === 0) {
                          return 'New resume • Ready to customize'
                        }
                        return parts.join(' • ')
                      }

                      return (
                        <div
                          key={resume.resume_id}
                          onClick={() => setSelectedResumeId(resume.resume_id)}
                          className="group cursor-pointer transition-all duration-300 w-full bg-white rounded-xl border p-6 hover:-translate-y-1 hover:border-indigo-200 border-slate-200 relative"
                          style={{
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                          }}
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
                          <div className="flex flex-col h-full">
                            {/* Header Row: Icon + Title + Menu */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[19px] leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1">
                                  {resume.target_job_title || 'General Resume'}
                                </h3>
                                <p className="text-sm text-slate-600 truncate">
                                  {getDescription()}
                                </p>
                              </div>
                              {/* Action Menu */}
                              <div
                                className="relative flex-shrink-0"
                                ref={isExpanded ? dropdownRef : null}
                              >
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
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {isExpanded && (
                                  <div
                                    onClick={e => e.stopPropagation()}
                                    className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                  >
                                    <button
                                      onClick={e => {
                                        e.stopPropagation()
                                        setSelectedResumeId(resume.resume_id)
                                        setExpandedResumeId(null)
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={e => handleDuplicate(resume.resume_id, e)}
                                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Copy className="w-4 h-4" />
                                      Duplicate
                                    </button>
                                    <button
                                      onClick={e => handleDelete(resume.resume_id, e)}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Skills Tags */}
                            {topSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {topSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Footer: Date + Section Count */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>
                                  Updated{' '}
                                  {new Date(resume.updated_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                {totalSections > 0 && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span>{totalSections} sections</span>
                                  </>
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
                  setSelectedResumeId(newResume.resume_id) // Open editor immediately
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
