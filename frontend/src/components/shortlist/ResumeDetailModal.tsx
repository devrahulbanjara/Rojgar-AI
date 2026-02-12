import React from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  ExternalLink,
  User,
  Briefcase,
  Wrench,
  Globe,
} from 'lucide-react'
import { SiGithub, SiLinkedin } from 'react-icons/si'
import { UserAvatar } from '../ui/UserAvatar'
import { LoadingSpinner } from '../common'
import { useResume } from '../../hooks/useResume'

import { Badge } from '../ui'

interface ResumeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  candidateName: string
  candidatePhoto?: string
  candidateSocialLinks?: Array<{
    social_link_id: string
    type: string
    url: string
  }>
}

export function ResumeDetailModal({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  candidatePhoto,
  candidateSocialLinks = [],
}: ResumeDetailModalProps) {
  const { data: resume, isLoading, error } = useResume(applicationId, isOpen)

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  }

  const getSocialIcon = (type: string) => {
    const iconType = type.toLowerCase()
    if (iconType.includes('linkedin')) {
      return <SiLinkedin className="w-6 h-6 text-social-linkedin" />
    }
    if (iconType.includes('github')) {
      return <SiGithub className="w-6 h-6 text-social-github" />
    }

    return <Globe className="w-6 h-6 text-primary-500" />
  }

  const getPlatformName = (type: string) => {
    const iconType = type.toLowerCase()
    if (iconType.includes('linkedin')) {
      return 'LinkedIn'
    }
    if (iconType.includes('github')) {
      return 'GitHub'
    }
    return 'Portfolio'
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200 bg-text-primary/40"
      onClick={onClose}
    >
      <div
        className="bg-background-surface w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ease-out rounded-[5px] shadow-2xl"
        style={{
          maxWidth: '900px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle bg-background-surface">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded border-2 border-border-default">
                <UserAvatar name={candidateName} src={candidatePhoto} className="w-14 h-14" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">{candidateName}</h2>
                {resume?.target_job_title && (
                  <Badge variant="subtle" colorPalette="blue" className="text-xs">
                    {resume.target_job_title}
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-background-subtle text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6 bg-background-subtle"
          style={{
            maxHeight: 'calc(90vh - 140px)',
            scrollBehavior: 'smooth',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-error-50 dark:bg-error-950/30 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-error-500" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Error Loading Resume</h3>
              <p className="text-text-tertiary">Failed to load resume details</p>
            </div>
          ) : !resume ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-background-subtle rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Resume Found</h3>
              <p className="text-text-tertiary">This candidate hasn't uploaded a resume yet.</p>
            </div>
          ) : (
            <div>
              {/* Professional Summary */}
              {resume.custom_summary && (
                <div className="bg-background-surface rounded p-6 border border-border-default mb-6">
                  <div className="relative pl-6 mb-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-full" />
                    <div className="absolute left-[-11px] top-0 w-5 h-5 rounded bg-background-surface border-2 border-primary-500 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary-600" />
                    </div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                      Professional Summary
                    </h4>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {resume.custom_summary}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {resume?.work_experiences?.length > 0 && (
                <div className="bg-background-surface rounded p-6 border border-border-default mb-6">
                  <div className="relative pl-6 mb-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-full" />
                    <div className="absolute left-[-11px] top-0 w-5 h-5 rounded bg-background-surface border-2 border-primary-500 flex items-center justify-center">
                      <Briefcase className="w-3 h-3 text-primary-600" />
                    </div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                      Work Experience
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {resume.work_experiences.map(exp => (
                      <div
                        key={exp.resume_work_experience_id}
                        className="border-l-2 border-border-subtle pl-4 pb-4 last:pb-0"
                      >
                        <h5 className="font-bold text-text-primary">{exp.job_title}</h5>
                        <p className="text-sm text-text-secondary font-medium">{exp.company}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-tertiary">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(exp.start_date)} -{' '}
                            {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                          </span>
                          {exp.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {exp.location}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resume.educations.length > 0 && (
                <div className="bg-background-surface rounded p-6 border border-border-default mb-6">
                  <div className="relative pl-6 mb-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-full" />
                    <div className="absolute left-[-11px] top-0 w-5 h-5 rounded bg-background-surface border-2 border-primary-500 flex items-center justify-center">
                      <GraduationCap className="w-3 h-3 text-primary-600" />
                    </div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                      Education
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {resume.educations.map(edu => (
                      <div
                        key={edu.resume_education_id}
                        className="border-l-2 border-border-subtle pl-4 pb-4 last:pb-0"
                      >
                        <h5 className="font-bold text-text-primary">{edu.degree}</h5>
                        <p className="text-sm text-text-secondary font-medium">
                          {edu.college_name}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-tertiary">
                          {edu.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(edu.start_date)} -{' '}
                              {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                            </span>
                          )}
                          {edu.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {edu.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {resume.skills.length > 0 && (
                <div className="bg-background-surface rounded p-6 border border-border-default mb-6">
                  <div className="relative pl-6 mb-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-full" />
                    <div className="absolute left-[-11px] top-0 w-5 h-5 rounded bg-background-surface border-2 border-primary-500 flex items-center justify-center">
                      <Wrench className="w-3 h-3 text-primary-600" />
                    </div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                      Skills & Expertise
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map(skill => (
                      <Badge
                        key={skill.resume_skill_id}
                        variant="subtle"
                        colorPalette="blue"
                        className="text-xs"
                      >
                        {skill.skill_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {resume.certifications.length > 0 && (
                <div className="bg-background-surface rounded p-6 border border-border-default mb-6">
                  <div className="relative pl-6 mb-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-full" />
                    <div className="absolute left-[-11px] top-0 w-5 h-5 rounded bg-background-surface border-2 border-primary-500 flex items-center justify-center">
                      <Award className="w-3 h-3 text-primary-600" />
                    </div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                      Certifications
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {resume.certifications.map(cert => (
                      <div
                        key={cert.resume_certification_id}
                        className="border-l-2 border-border-subtle pl-4 pb-4 last:pb-0"
                      >
                        <h5 className="font-bold text-text-primary">{cert.certification_name}</h5>
                        <p className="text-sm text-text-secondary font-medium">
                          {cert.issuing_body}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-tertiary">
                          {cert.issue_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Issued {formatDate(cert.issue_date)}
                            </span>
                          )}
                          {!cert.does_not_expire && cert.expiration_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Expires {formatDate(cert.expiration_date)}
                            </span>
                          )}
                        </div>
                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium mt-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Credential
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Social Links */}
              {candidateSocialLinks && candidateSocialLinks.length > 0 && (
                <div className="bg-background-surface rounded p-6 border border-border-default">
                  <div className="relative pl-6 mb-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-full" />
                    <div className="absolute left-[-11px] top-0 w-5 h-5 rounded bg-background-surface border-2 border-primary-500 flex items-center justify-center">
                      <Globe className="w-3 h-3 text-primary-600" />
                    </div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                      Social Links
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {candidateSocialLinks.map(link => {
                      const cleanUrl = link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')
                      return (
                        <a
                          key={link.social_link_id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 p-3 border border-border-default rounded hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-colors"
                        >
                          <div className="flex-shrink-0">{getSocialIcon(link.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-text-primary">
                              {getPlatformName(link.type)}
                            </div>
                            <div className="text-[10px] text-text-tertiary truncate">
                              {cleanUrl}
                            </div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-primary-600 transition-colors flex-shrink-0" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
