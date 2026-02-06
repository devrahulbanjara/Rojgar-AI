'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Pencil,
  Trash2,
  Plus,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  ExternalLink,
  Calendar,
  MapPin,
  Building,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import ExperienceFormDialog from './forms/ExperienceFormDialog'
import EducationFormDialog from './forms/EducationFormDialog'
import SkillsFormDialog from './forms/SkillsFormDialog'
import CertificationFormDialog from './forms/CertificationFormDialog'
import BasicInfoFormDialog from './forms/BasicInfoFormDialog'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/constants'
import { ResumeDetail, WorkExperience, Education, Certification, Skill } from '@/types/resume'
import { SkeletonResumeDetail } from '../common/SkeletonLoader'

interface ResumeDetailSheetProps {
  resumeId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

type FormType = 'experience' | 'education' | 'skills' | 'certification' | null

export default function ResumeDetailSheet({
  resumeId,
  isOpen,
  onClose,
  onUpdate,
}: ResumeDetailSheetProps) {
  const [resume, setResume] = useState<ResumeDetail | null>(null)
  const [loading, setLoading] = useState(false)

  // State for managing forms
  const [activeForm, setActiveForm] = useState<FormType>(null)
  const [editingItem, setEditingItem] = useState<WorkExperience | Education | Certification | null>(
    null
  )

  const [isCertificationOpen, setIsCertificationOpen] = useState(false)
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null)

  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false)

  const fetchResume = async () => {
    if (!resumeId) {
      setResume(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch resume details')
      const data: ResumeDetail = await res.json()
      setResume(data)
    } catch (error) {
      console.error('Error fetching resume details:', error)
      toast.error('Failed to load resume details.')
      setResume(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && resumeId) {
      fetchResume()
    } else if (!isOpen) {
      setResume(null)
      setActiveForm(null)
      setEditingItem(null)
      setIsBasicInfoOpen(false)
      setIsCertificationOpen(false)
      setEditingCertification(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resumeId])

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to remove this item?')) return
    try {
      const res = await fetch(
        `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resume?.resume_id}/${type}/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )
      if (!res.ok) throw new Error('Failed')
      toast.success('Item removed')
      fetchResume()
      onUpdate()
    } catch {
      toast.error('Failed to delete item')
    }
  }

  const handleEdit = (type: FormType, item: WorkExperience | Education | Certification) => {
    if (type === 'certification') {
      setEditingCertification(item as Certification)
      setIsCertificationOpen(true)
    } else if (type === 'experience') {
      setEditingItem(item as WorkExperience)
      setActiveForm(type)
    } else if (type === 'education') {
      setEditingItem(item as Education)
      setActiveForm(type)
    }
  }

  const handleAdd = (type: FormType) => {
    if (type === 'certification') {
      setEditingCertification(null)
      setIsCertificationOpen(true)
    } else {
      setEditingItem(null)
      setActiveForm(type)
    }
  }

  const handleFormSuccess = () => {
    fetchResume()
    onUpdate()
    setActiveForm(null)
    setEditingItem(null)
    setIsBasicInfoOpen(false)
    setIsCertificationOpen(false)
    setEditingCertification(null)
  }

  if (!resume || loading) {
    return (
      <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
        <SheetContent className="w-full max-w-4xl p-0 bg-background-surface border-l shadow-2xl flex flex-col overflow-hidden rounded-l-2xl">
          <SkeletonResumeDetail />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={open => !open && onClose()} hideClose>
        <SheetContent className="w-full max-w-4xl p-0 bg-background-surface flex flex-col shadow-2xl border-l overflow-hidden rounded-l-2xl">
          {/* Enhanced Header with gradient background */}
          <div className="flex-shrink-0 bg-gradient-to-b from-ai-50/50 dark:from-ai-950/30 to-background-surface px-12 py-12 border-b border-ai-50/50 dark:border-ai-900/30 relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-background-subtle transition-all duration-200 hover:scale-110 active:scale-95 group"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-text-tertiary group-hover:text-text-primary transition-colors" />
            </button>

            <div className="flex items-start gap-4 pr-12">
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-3 group mb-2">
                  <h2 className="text-2xl font-bold text-text-primary leading-tight">
                    {resume.target_job_title || 'General Resume'}
                  </h2>
                  <button
                    onClick={() => setIsBasicInfoOpen(true)}
                    className="p-1.5 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Edit Basic Info"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                {resume.custom_summary && (
                  <p className="text-text-secondary font-medium leading-relaxed max-w-3xl">
                    {resume.custom_summary}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 bg-background-subtle">
            <div className="p-8 space-y-8">
              {/* Professional Summary */}
              {resume.custom_summary && (
                <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border-subtle">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-900/30">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Professional Summary</h4>
                      <p className="text-sm text-text-tertiary">Your professional overview</p>
                    </div>
                  </div>
                  <div className="bg-background-subtle border border-border-default rounded-2xl p-6">
                    <p className="text-text-secondary leading-relaxed">{resume.custom_summary}</p>
                  </div>
                </div>
              )}

              {/* --- EXPERIENCE SECTION --- */}
              <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-900/30">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Work Experience</h4>
                      <p className="text-sm text-text-tertiary">Professional journey</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd('experience')}
                    className="btn-primary-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl"
                  >
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.work_experiences.length === 0 && (
                    <div className="text-center py-12 bg-background-subtle rounded-2xl border border-dashed border-border-default">
                      <div className="w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border-subtle">
                        <Briefcase className="w-8 h-8 text-text-tertiary" />
                      </div>
                      <h5 className="text-lg font-semibold text-text-primary mb-2">
                        No work experience added yet
                      </h5>
                      <p className="text-text-secondary max-w-sm mx-auto">
                        Add your work experience to showcase your professional background.
                      </p>
                    </div>
                  )}

                  {resume.work_experiences.map((exp: WorkExperience) => (
                    <div
                      key={exp.resume_work_experience_id}
                      className="bg-background-surface rounded-xl border border-border-default p-5 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                              <Building className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-text-primary text-lg">
                                {exp.job_title}
                              </h5>
                              <p className="text-text-secondary font-medium">{exp.company}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                            <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                              <Calendar className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                              <span className="font-medium">
                                {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                              </span>
                            </div>
                            {exp.location && (
                              <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                <MapPin className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                                <span className="font-medium">{exp.location}</span>
                              </div>
                            )}
                          </div>

                          {exp.description && (
                            <div className="mt-4 pt-3 border-t border-border-subtle">
                              <p className="text-sm text-text-secondary leading-relaxed">
                                {exp.description}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-text-tertiary hover:text-primary dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg"
                            onClick={() => handleEdit('experience', exp)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-text-tertiary hover:text-error dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg"
                            onClick={() =>
                              handleDelete('experience', exp.resume_work_experience_id)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- EDUCATION SECTION --- */}
              <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center text-ai-600 dark:text-ai-400 shadow-sm border border-ai-100 dark:border-ai-900/30">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Education</h4>
                      <p className="text-sm text-text-tertiary">Academic background</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd('education')}
                    className="btn-primary-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl"
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.educations.length === 0 && (
                    <div className="text-center py-12 bg-background-subtle rounded-2xl border border-dashed border-border-default">
                      <div className="w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border-subtle">
                        <GraduationCap className="w-8 h-8 text-text-tertiary" />
                      </div>
                      <h5 className="text-lg font-semibold text-text-primary mb-2">
                        No education records added yet
                      </h5>
                      <p className="text-text-secondary max-w-sm mx-auto">
                        Add your educational background to complete your profile.
                      </p>
                    </div>
                  )}

                  {resume.educations.map((edu: Education) => (
                    <div
                      key={edu.resume_education_id}
                      className="bg-background-surface rounded-xl border border-border-default p-5 hover:border-ai-200 dark:hover:border-ai-800 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-ai-50 dark:bg-ai-950/30 text-ai-600 dark:text-ai-400 rounded-lg hover:bg-ai-100 dark:hover:bg-ai-900/30 transition-colors">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-text-primary text-lg">{edu.degree}</h5>
                              <p className="text-text-secondary font-medium">{edu.college_name}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                            {edu.start_date && (
                              <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                <Calendar className="w-4 h-4 text-ai-500 dark:text-ai-400" />
                                <span className="font-medium">
                                  {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
                                </span>
                              </div>
                            )}
                            {edu.location && (
                              <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                <MapPin className="w-4 h-4 text-ai-500 dark:text-ai-400" />
                                <span className="font-medium">{edu.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-text-tertiary hover:text-primary dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg"
                            onClick={() => handleEdit('education', edu)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-text-tertiary hover:text-error dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg"
                            onClick={() => handleDelete('education', edu.resume_education_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- SKILLS SECTION --- */}
              <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center text-success-600 dark:text-success-400 shadow-sm border border-success-100 dark:border-success-900/30">
                      <Code className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Skills & Expertise</h4>
                      <p className="text-sm text-text-tertiary">
                        Technical and professional skills
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd('skills')}
                    className="btn-primary-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl"
                  >
                    <Plus className="w-4 h-4" /> Add Skills
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {resume.skills.length === 0 && (
                    <div className="text-center py-12 bg-background-subtle rounded-2xl border border-dashed border-border-default w-full">
                      <div className="w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border-subtle">
                        <Code className="w-8 h-8 text-text-tertiary" />
                      </div>
                      <h5 className="text-lg font-semibold text-text-primary mb-2">
                        No skills added yet
                      </h5>
                      <p className="text-text-secondary max-w-sm mx-auto">
                        Add your skills to showcase your expertise.
                      </p>
                    </div>
                  )}
                  {resume.skills.map((s: Skill) => (
                    <div
                      key={s.resume_skill_id}
                      className="group inline-flex items-center gap-2 px-4 py-2.5 bg-ai-50 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 rounded-xl border border-ai-100 dark:border-ai-900/30 hover:bg-ai-100 dark:hover:bg-ai-900/30 hover:border-ai-200 dark:hover:border-ai-800 hover:shadow-sm transition-all duration-200"
                    >
                      <span className="font-semibold">{s.skill_name}</span>
                      <button
                        onClick={() => handleDelete('skills', s.resume_skill_id)}
                        className="text-ai-600 dark:text-ai-400 hover:text-error opacity-0 group-hover:opacity-100 transition-all duration-200 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- CERTIFICATIONS SECTION --- */}
              <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-950/30 flex items-center justify-center text-warning-600 dark:text-warning-400 shadow-sm border border-warning-100 dark:border-warning-900/30">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Certifications</h4>
                      <p className="text-sm text-text-tertiary">Professional certifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd('certification')}
                    className="btn-primary-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl"
                  >
                    <Plus className="w-4 h-4" /> Add Certification
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.certifications.length === 0 && (
                    <div className="text-center py-12 bg-background-subtle rounded-2xl border border-dashed border-border-default">
                      <div className="w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border-subtle">
                        <Award className="w-8 h-8 text-text-tertiary" />
                      </div>
                      <h5 className="text-lg font-semibold text-text-primary mb-2">
                        No certifications added yet
                      </h5>
                      <p className="text-text-secondary max-w-sm mx-auto">
                        Add your certifications to demonstrate your expertise.
                      </p>
                    </div>
                  )}

                  {resume.certifications.map((cert: Certification) => (
                    <div
                      key={cert.resume_certification_id}
                      className="bg-background-surface rounded-xl border border-border-default p-5 hover:border-warning-200 dark:hover:border-warning-800 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-warning-50 dark:bg-warning-950/30 text-warning-600 dark:text-warning-400 rounded-lg hover:bg-warning-100 dark:hover:bg-warning-900/30 transition-colors">
                              <Award className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-text-primary text-lg">
                                {cert.certification_name}
                              </h5>
                              <p className="text-text-secondary font-medium">{cert.issuing_body}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                            {cert.issue_date && (
                              <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                <Calendar className="w-4 h-4 text-warning-500 dark:text-warning-400" />
                                <span className="font-medium">Issued {cert.issue_date}</span>
                              </div>
                            )}
                            {!cert.does_not_expire && cert.expiration_date && (
                              <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                <Calendar className="w-4 h-4 text-warning-500 dark:text-warning-400" />
                                <span className="font-medium">Expires {cert.expiration_date}</span>
                              </div>
                            )}
                          </div>

                          {cert.credential_url && (
                            <div className="mt-4">
                              <a
                                href={cert.credential_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Credential
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-text-tertiary hover:text-primary dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg"
                            onClick={() => handleEdit('certification', cert)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-text-tertiary hover:text-error dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 rounded-lg"
                            onClick={() =>
                              handleDelete('certifications', cert.resume_certification_id)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer with Done Button */}
          <div className="border-t border-border-default bg-background-surface px-8 py-5 flex items-center justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <Button
              onClick={onClose}
              className="btn-primary-gradient h-11 px-8 text-base font-semibold rounded-xl"
            >
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- FORMS --- */}
      {resume && (
        <>
          <ExperienceFormDialog
            open={activeForm === 'experience'}
            onOpenChange={open => !open && setActiveForm(null)}
            resumeId={resume.resume_id}
            initialData={
              activeForm === 'experience' && editingItem
                ? (editingItem as WorkExperience)
                : undefined
            }
            onSuccess={handleFormSuccess}
          />
          <EducationFormDialog
            open={activeForm === 'education'}
            onOpenChange={open => !open && setActiveForm(null)}
            resumeId={resume.resume_id}
            initialData={
              activeForm === 'education' && editingItem ? (editingItem as Education) : undefined
            }
            onSuccess={handleFormSuccess}
          />
          <SkillsFormDialog
            open={activeForm === 'skills'}
            onOpenChange={open => !open && setActiveForm(null)}
            resumeId={resume.resume_id}
            initialData={undefined}
            onSuccess={handleFormSuccess}
          />
          <CertificationFormDialog
            open={isCertificationOpen}
            onOpenChange={open => !open && setIsCertificationOpen(false)}
            resumeId={resume.resume_id}
            initialData={editingCertification || undefined}
            onSuccess={handleFormSuccess}
          />

          <BasicInfoFormDialog
            open={isBasicInfoOpen}
            onOpenChange={open => !open && setIsBasicInfoOpen(false)}
            resumeId={resume.resume_id}
            initialData={resume}
            onSuccess={handleFormSuccess}
          />
        </>
      )}
    </>
  )
}
