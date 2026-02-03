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
import {
  ResumeResponse,
  ResumeWorkExperienceResponse,
  ResumeEducationResponse,
  ResumeCertificationResponse,
} from '@/types/resume'
// import { cn } from '@/lib/utils' // Unused
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
  const [resume, setResume] = useState<ResumeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  // State for managing forms
  const [activeForm, setActiveForm] = useState<FormType>(null)
  const [editingItem, setEditingItem] = useState<
    ResumeWorkExperienceResponse | ResumeEducationResponse | ResumeCertificationResponse | null
  >(null)

  const [isCertificationOpen, setIsCertificationOpen] = useState(false)
  const [editingCertification, setEditingCertification] =
    useState<ResumeCertificationResponse | null>(null)

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
      const data: ResumeResponse = await res.json()
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

  const handleEdit = (
    type: FormType,
    item: ResumeWorkExperienceResponse | ResumeEducationResponse | ResumeCertificationResponse
  ) => {
    if (type === 'certification') {
      setEditingCertification(item as ResumeCertificationResponse)
      setIsCertificationOpen(true)
    } else if (type === 'experience') {
      setEditingItem(item as ResumeWorkExperienceResponse)
      setActiveForm(type)
    } else if (type === 'education') {
      setEditingItem(item as ResumeEducationResponse)
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
        <SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl p-0 bg-white border-l shadow-2xl flex flex-col overflow-hidden rounded-l-2xl">
          <SkeletonResumeDetail />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={open => !open && onClose()} hideClose>
        <SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl p-0 bg-white flex flex-col shadow-2xl border-l overflow-hidden rounded-l-2xl">
          {/* Header - Aligned with ApplicationModal aesthetics */}
          <div className="flex-shrink-0 bg-gradient-to-b from-gray-50 to-white px-8 py-8 border-b border-gray-200 relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 pr-12">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 group">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {resume.target_job_title || 'General Resume'}
                  </h2>
                  <button
                    onClick={() => setIsBasicInfoOpen(true)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Edit Basic Info"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                {resume.custom_summary && (
                  <p className="text-[15px] text-gray-600 leading-relaxed mt-4 max-w-3xl">
                    {resume.custom_summary}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 bg-white">
            <div className="px-8 py-8 space-y-8">
              {/* --- EXPERIENCE SECTION --- */}
              <section className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-blue-600 rounded-full" />
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Work Experience</h3>
                  </div>
                  <button
                    onClick={() => handleAdd('experience')}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="space-y-3">
                  {resume.work_experiences.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No work experience added yet.</p>
                    </div>
                  )}

                  {resume.work_experiences.map(exp => (
                    <div
                      key={exp.resume_work_experience_id}
                      className="group relative p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur-sm p-1 rounded-lg">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          onClick={() => handleEdit('experience', exp)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={() => handleDelete('experience', exp.resume_work_experience_id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900 text-base">{exp.job_title}</h4>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md whitespace-nowrap ml-4 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-3">
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-blue-500" />
                          {exp.company}
                        </span>
                        {exp.location && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {exp.location}
                            </span>
                          </>
                        )}
                      </div>

                      {exp.description && (
                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed border-t border-gray-100 pt-3 mt-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* --- EDUCATION SECTION --- */}
              <section className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Education</h3>
                  </div>
                  <button
                    onClick={() => handleAdd('education')}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="space-y-3">
                  {resume.educations.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No education added yet.</p>
                    </div>
                  )}

                  {resume.educations.map(edu => (
                    <div
                      key={edu.resume_education_id}
                      className="group relative p-5 rounded-xl border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 p-1 rounded-lg">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          onClick={() => handleEdit('education', edu)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={() => handleDelete('education', edu.resume_education_id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{edu.college_name}</h4>
                          <p className="text-sm text-gray-600 mt-0.5 font-medium">{edu.degree}</p>
                          {edu.location && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {edu.location}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md whitespace-nowrap ml-4 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* --- SKILLS SECTION --- */}
              <section className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-violet-500 rounded-full" />
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Code className="w-4 h-4 text-violet-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Skills</h3>
                  </div>
                  <button
                    onClick={() => handleAdd('skills')}
                    className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1.5 px-3 py-1.5 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {resume.skills.length === 0 && (
                    <span className="text-gray-400 text-sm py-2">No skills listed.</span>
                  )}
                  {resume.skills.map(s => (
                    <div
                      key={s.resume_skill_id}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-violet-200 hover:bg-violet-50/50 rounded-lg text-sm text-gray-700 font-medium transition-colors cursor-default shadow-sm"
                    >
                      <span className="ml-1">{s.skill_name}</span>
                      <button
                        onClick={() => handleDelete('skills', s.resume_skill_id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all w-0 group-hover:w-auto -mr-2 group-hover:mr-0 pl-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* --- CERTIFICATIONS SECTION --- */}
              <section className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-amber-500 rounded-full" />
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Certifications</h3>
                  </div>
                  <button
                    onClick={() => handleAdd('certification')}
                    className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 px-3 py-1.5 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="space-y-3">
                  {resume.certifications.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No certifications added yet.</p>
                    </div>
                  )}

                  {resume.certifications.map(cert => (
                    <div
                      key={cert.resume_certification_id}
                      className="group relative p-5 rounded-xl border border-gray-200 bg-white hover:border-amber-200 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 p-1 rounded-lg">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                          onClick={() => handleEdit('certification', cert)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={() =>
                            handleDelete('certifications', cert.resume_certification_id)
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">
                            {cert.certification_name}
                          </h4>
                          {cert.issuing_body && (
                            <p className="text-sm text-gray-600 mt-0.5 font-medium">
                              {cert.issuing_body}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              Issued: {cert.issue_date}
                            </span>
                            {!cert.does_not_expire && cert.expiration_date && (
                              <span>Expires: {cert.expiration_date}</span>
                            )}
                          </div>
                        </div>
                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>

          {/* Footer with Done Button */}
          <div className="border-t border-gray-200 bg-white px-8 py-5 flex items-center justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <Button
              onClick={onClose}
              className="h-11 px-8 text-base font-semibold bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl rounded-xl text-white"
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
                ? (editingItem as ResumeWorkExperienceResponse)
                : undefined
            }
            onSuccess={handleFormSuccess}
          />
          <EducationFormDialog
            open={activeForm === 'education'}
            onOpenChange={open => !open && setActiveForm(null)}
            resumeId={resume.resume_id}
            initialData={
              activeForm === 'education' && editingItem
                ? (editingItem as ResumeEducationResponse)
                : undefined
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
