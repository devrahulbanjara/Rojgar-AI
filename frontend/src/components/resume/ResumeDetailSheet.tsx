'use client'

import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
  History,
  X,
} from 'lucide-react'
import { useState, useEffect, useCallback, ReactNode } from 'react'
import ExperienceFormDialog from './forms/ExperienceFormDialog'
import EducationFormDialog from './forms/EducationFormDialog'
import SkillsFormDialog from './forms/SkillsFormDialog'
import CertificationFormDialog from './forms/CertificationFormDialog'
import BasicInfoFormDialog from './forms/BasicInfoFormDialog'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/constants'
import { ResumeDetail, WorkExperience, Education, Certification, Skill } from '@/types/resume'
import { SkeletonResumeDetail } from '../common/SkeletonLoader'
import { useDeleteConfirm } from '@/components/ui/delete-confirm-dialog'

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

  const [activeForm, setActiveForm] = useState<FormType>(null)
  const [editingItem, setEditingItem] = useState<WorkExperience | Education | Certification | null>(
    null
  )

  const [isCertificationOpen, setIsCertificationOpen] = useState(false)
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null)

  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false)

  const { confirm, Dialog: DeleteConfirmDialog } = useDeleteConfirm()

  const fetchResume = useCallback(async () => {
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
  }, [resumeId])

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
  }, [isOpen, resumeId, fetchResume])

  const handleDelete = async (type: string, id: string, itemName: string) => {
    const typeLabels: Record<string, string> = {
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skill',
      certifications: 'Certification',
    }

    await confirm({
      title: `Delete ${typeLabels[type] || 'Item'}`,
      description: "You're about to permanently delete",
      itemName,
      onConfirm: async () => {
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
      },
    })
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
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        showCloseButton={false}
        className="max-w-[800px] mx-auto p-0 border-none shadow-none"
      >
        <div className="w-full max-w-[800px] h-[90vh] bg-background-surface flex flex-col overflow-hidden rounded-[16px] border border-border-default shadow-2xl">
          <DialogTitle className="sr-only">Loading Resume</DialogTitle>
          <DialogDescription className="sr-only">
            Please wait while we fetch the resume details.
          </DialogDescription>
          <SkeletonResumeDetail />
        </div>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        showCloseButton={false}
        className="max-w-[800px] mx-auto p-0 border-none shadow-none"
      >
        <div className="w-full max-w-[800px] h-[90vh] bg-background-surface flex flex-col overflow-hidden rounded-[16px] border border-border-default shadow-2xl">
          <DialogTitle className="sr-only">
            {resume.target_job_title || 'General Resume'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detailed view of the resume for {resume.target_job_title || 'General'}.
          </DialogDescription>
          {/* Header Section */}
          <div className="flex-shrink-0 bg-background-surface px-10 py-8 border-b border-border-subtle relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-8 p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-background-subtle transition-all duration-200"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-5 pr-12">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 group mb-2">
                  <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                    {resume.target_job_title || 'General Resume'}
                  </h2>
                  <button
                    onClick={() => setIsBasicInfoOpen(true)}
                    className="p-1.5 text-text-muted hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Edit Basic Info"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {}
          {/* Scrollable Content */}
          <ScrollArea className="flex-1 bg-background-base">
            <div className="px-10 py-8 space-y-12">
              {/* Summary Section */}
              {resume.custom_summary && (
                <Section title="Professional Summary" icon={<Briefcase className="w-4 h-4" />}>
                  <p className="text-[15px] leading-relaxed text-text-secondary whitespace-pre-wrap">
                    {resume.custom_summary}
                  </p>
                </Section>
              )}

              {/* Work Experience Section */}
              <Section
                title="Work Experience"
                icon={<History className="w-4 h-4" />}
                action={
                  <button
                    onClick={() => handleAdd('experience')}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                }
              >
                <div className="space-y-6 mt-2">
                  {resume.work_experiences.length === 0 && (
                    <div className="text-center py-8 bg-background-subtle/50 rounded-xl border border-dashed border-border-default">
                      <p className="text-sm text-text-tertiary italic">
                        No work experience records found.
                      </p>
                    </div>
                  )}
                  {resume.work_experiences.map((exp: WorkExperience) => (
                    <div key={exp.resume_work_experience_id} className="group relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-[16px] font-bold text-text-primary">
                            {exp.job_title}
                          </h4>
                          <div className="flex items-center gap-2 text-[14px] text-text-secondary font-medium">
                            <span>{exp.company}</span>
                            {exp.location && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-border-strong" />
                                <span className="text-text-tertiary">{exp.location}</span>
                              </>
                            )}
                          </div>
                          <p className="text-[12px] text-text-tertiary font-medium">
                            {exp.start_date} — {exp.is_current ? 'Present' : exp.end_date}
                          </p>
                          {exp.description && (
                            <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-background-subtle text-text-tertiary hover:text-primary-600"
                            onClick={() => handleEdit('experience', exp)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/30 text-text-tertiary hover:text-error-600"
                            onClick={() =>
                              handleDelete(
                                'experience',
                                exp.resume_work_experience_id,
                                `${exp.job_title} at ${exp.company}`
                              )
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Education Section */}
              <Section
                title="Education"
                icon={<GraduationCap className="w-4 h-4" />}
                action={
                  <button
                    onClick={() => handleAdd('education')}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-ai-600 hover:text-ai-700 uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                }
              >
                <div className="space-y-6 mt-2">
                  {resume.educations.length === 0 && (
                    <div className="text-center py-8 bg-background-subtle/50 rounded-xl border border-dashed border-border-default">
                      <p className="text-sm text-text-tertiary italic">
                        No education records found.
                      </p>
                    </div>
                  )}
                  {resume.educations.map((edu: Education) => (
                    <div key={edu.resume_education_id} className="group relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-[16px] font-bold text-text-primary">{edu.degree}</h4>
                          <p className="text-[14px] text-text-secondary font-medium">
                            {edu.college_name}
                          </p>
                          <p className="text-[12px] text-text-tertiary font-medium">
                            {edu.start_date} — {edu.is_current ? 'Present' : edu.end_date}
                          </p>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-background-subtle text-text-tertiary hover:text-ai-600"
                            onClick={() => handleEdit('education', edu)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/30 text-text-tertiary hover:text-error-600"
                            onClick={() =>
                              handleDelete(
                                'education',
                                edu.resume_education_id,
                                `${edu.degree} from ${edu.college_name}`
                              )
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Skills Section */}
              <Section
                title="Skills & Expertise"
                icon={<Code className="w-4 h-4" />}
                action={
                  <button
                    onClick={() => handleAdd('skills')}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-success-600 hover:text-success-700 uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Manage
                  </button>
                }
              >
                <div className="flex flex-wrap gap-2 mt-2">
                  {resume.skills.length === 0 && (
                    <p className="text-sm text-text-tertiary italic w-full">No skills added.</p>
                  )}
                  {resume.skills.map((s: Skill) => (
                    <div
                      key={s.resume_skill_id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-background-subtle rounded-lg border border-border-default text-[13px] font-medium text-text-secondary"
                    >
                      {s.skill_name}
                      <button
                        onClick={() => handleDelete('skills', s.resume_skill_id, s.skill_name)}
                        className="p-0.5 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950/30 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Certifications Section */}
              <Section
                title="Certifications"
                icon={<Award className="w-4 h-4" />}
                action={
                  <button
                    onClick={() => handleAdd('certification')}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-warning-600 hover:text-warning-700 uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                }
              >
                <div className="space-y-6 mt-2">
                  {resume.certifications.length === 0 && (
                    <div className="text-center py-8 bg-background-subtle/50 rounded-xl border border-dashed border-border-default">
                      <p className="text-sm text-text-tertiary italic">
                        No certifications records found.
                      </p>
                    </div>
                  )}
                  {resume.certifications.map((cert: Certification) => (
                    <div key={cert.resume_certification_id} className="group relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-[16px] font-bold text-text-primary">
                            {cert.certification_name}
                          </h4>
                          <p className="text-[14px] text-text-secondary font-medium">
                            {cert.issuing_body}
                          </p>
                          <div className="flex items-center gap-3 text-[12px] text-text-tertiary font-medium">
                            {cert.issue_date && <span>Issued {cert.issue_date}</span>}
                            {!cert.does_not_expire && cert.expiration_date && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-border-strong" />
                                <span>Expires {cert.expiration_date}</span>
                              </>
                            )}
                          </div>
                          {cert.credential_url && (
                            <a
                              href={cert.credential_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-[13px] font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                            >
                              View Credential <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-background-subtle text-text-tertiary hover:text-warning-600"
                            onClick={() => handleEdit('certification', cert)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/30 text-text-tertiary hover:text-error-600"
                            onClick={() =>
                              handleDelete(
                                'certifications',
                                cert.resume_certification_id,
                                `${cert.certification_name} from ${cert.issuing_body}`
                              )
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </ScrollArea>

          {}
          {/* Footer Section */}
          <div className="border-t border-border-default bg-background-subtle/30 px-10 py-6 flex items-center justify-end gap-3 rounded-b-[16px]">
            <Button
              onClick={onClose}
              className="bg-primary-600 hover:bg-primary-700 text-white h-11 px-10 text-[14px] font-bold rounded-lg transition-all shadow-md shadow-primary-500/20 active:scale-95"
            >
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {}
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

          <DeleteConfirmDialog />
        </>
      )}
    </>
  )
}

// Clean section component matching JobDetailModal vibe
function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="relative pl-8 border-l-2 border-border-subtle hover:border-primary-200 dark:hover:border-primary-900 transition-colors pt-1">
      <div className="absolute -left-[11px] top-1 p-1 bg-background-surface border border-border-default rounded-md text-text-tertiary">
        {icon}
      </div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] uppercase tracking-wider font-bold text-text-tertiary">
          {title}
        </h4>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}
