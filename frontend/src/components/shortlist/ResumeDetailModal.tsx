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
  Building,
  Globe,
} from 'lucide-react'
import { SiGithub, SiLinkedin } from 'react-icons/si'
import { UserAvatar } from '../ui/UserAvatar'
import { LoadingSpinner } from '../common'
import { useResume } from '../../hooks/useResume'

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
        className="bg-background-surface w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ease-out rounded-[20px] shadow-2xl"
        style={{
          maxWidth: '900px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {}
        <div className="bg-background-surface px-12 py-12 border-b border-primary-200/50 relative">
          {}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-background-subtle transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors" />
          </button>

          {}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-border-default shadow-sm">
                <UserAvatar name={candidateName} src={candidatePhoto} className="w-20 h-20" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary leading-tight mb-2">
                {candidateName}
              </h2>
              {resume?.target_job_title && (
                <p className="text-text-secondary font-medium">{resume.target_job_title}</p>
              )}
            </div>
          </div>
        </div>

        {}
        <div
          className="overflow-y-auto p-8 bg-background-subtle"
          style={{
            maxHeight: 'calc(90vh - 200px)',
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
                <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border-subtle">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm border border-primary-200 dark:border-primary-800">
                      <User className="w-6 h-6" />
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

              {/* Work Experience */}
              {resume?.work_experiences?.length > 0 && (
                <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm border border-primary-200 dark:border-primary-800">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Work Experience</h4>
                      <p className="text-sm text-text-tertiary">Professional journey</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {resume.work_experiences.map(exp => (
                      <div
                        key={exp.resume_work_experience_id}
                        className="bg-background-surface rounded-xl border border-border-default p-5 hover:border-primary-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
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
                                <Calendar className="w-4 h-4 text-primary-500" />
                                <span className="font-medium">
                                  {formatDate(exp.start_date)} -{' '}
                                  {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                                </span>
                              </div>
                              {exp.location && (
                                <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                  <MapPin className="w-4 h-4 text-primary-500" />
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resume.educations.length > 0 && (
                <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
                    <div className="w-12 h-12 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center text-ai-600 dark:text-ai-400 shadow-sm border border-ai-200 dark:border-ai-800">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Education</h4>
                      <p className="text-sm text-text-tertiary">Academic background</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {resume.educations.map(edu => (
                      <div
                        key={edu.resume_education_id}
                        className="bg-background-surface rounded-xl border border-border-default p-5 hover:border-ai-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-ai-50 dark:bg-ai-950/30 text-ai-600 dark:text-ai-400 rounded-lg hover:bg-ai-100 dark:hover:bg-ai-900/30 transition-colors">
                                <GraduationCap className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-text-primary text-lg">
                                  {edu.degree}
                                </h5>
                                <p className="text-text-secondary font-medium">
                                  {edu.college_name}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                              {edu.start_date && (
                                <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                  <Calendar className="w-4 h-4 text-ai-500" />
                                  <span className="font-medium">
                                    {formatDate(edu.start_date)} -{' '}
                                    {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                                  </span>
                                </div>
                              )}
                              {edu.location && (
                                <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                  <MapPin className="w-4 h-4 text-ai-500" />
                                  <span className="font-medium">{edu.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {resume.skills.length > 0 && (
                <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
                    <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center text-success-600 dark:text-success-400 shadow-sm border border-success-200 dark:border-success-800">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Skills & Expertise</h4>
                      <p className="text-sm text-text-tertiary">
                        Technical and professional skills
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {resume.skills.map(skill => (
                      <div
                        key={skill.resume_skill_id}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 rounded-xl border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all duration-200"
                      >
                        <span className="font-semibold">{skill.skill_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {resume.certifications.length > 0 && (
                <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
                    <div className="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-950/30 flex items-center justify-center text-warning-600 dark:text-warning-400 shadow-sm border border-warning-200 dark:border-warning-800">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Certifications</h4>
                      <p className="text-sm text-text-tertiary">Professional certifications</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {resume.certifications.map(cert => (
                      <div
                        key={cert.resume_certification_id}
                        className="bg-background-surface rounded-xl border border-border-default p-5 hover:border-warning-200 hover:shadow-md transition-all duration-300"
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
                                <p className="text-text-secondary font-medium">
                                  {cert.issuing_body}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                              {cert.issue_date && (
                                <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                  <Calendar className="w-4 h-4 text-warning-500" />
                                  <span className="font-medium">
                                    Issued {formatDate(cert.issue_date)}
                                  </span>
                                </div>
                              )}
                              {!cert.does_not_expire && cert.expiration_date && (
                                <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                                  <Calendar className="w-4 h-4 text-warning-500" />
                                  <span className="font-medium">
                                    Expires {formatDate(cert.expiration_date)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {cert.credential_url && (
                              <div className="mt-4">
                                <a
                                  href={cert.credential_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View Credential
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Social Links */}
              {candidateSocialLinks && candidateSocialLinks.length > 0 && (
                <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
                    <div className="w-12 h-12 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center text-ai-600 dark:text-ai-400 shadow-sm border border-ai-200 dark:border-ai-800">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">Profile Social Links</h4>
                      <p className="text-sm text-text-tertiary">Professional online presence</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {candidateSocialLinks.map(link => {
                      const cleanUrl = link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')

                      return (
                        <a
                          key={link.social_link_id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative h-15 p-3 bg-background-subtle border border-border-default rounded-lg transition-all duration-200 hover:border-primary-500 hover:bg-primary-50/50 active:scale-[0.98]"
                        >
                          {/* Content Layout */}
                          <div className="flex items-center gap-3 h-full">
                            {/* Icon */}
                            <div className="flex-shrink-0">{getSocialIcon(link.type)}</div>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-text-primary">
                                {getPlatformName(link.type)}
                              </div>
                              <div className="text-xs text-text-secondary truncate">{cleanUrl}</div>
                            </div>
                          </div>

                          {/* External Link Icon - Top Right */}
                          <ExternalLink className="absolute top-2 right-2 w-3.5 h-3.5 text-text-muted group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
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
