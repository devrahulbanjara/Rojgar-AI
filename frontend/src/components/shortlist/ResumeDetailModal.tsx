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
      return <SiLinkedin className="w-6 h-6" style={{ color: '#0A66C2' }} />
    }
    if (iconType.includes('github')) {
      return <SiGithub className="w-6 h-6" style={{ color: '#24292e' }} />
    }
    // Portfolio/Website for all other links
    return <Globe className="w-6 h-6" style={{ color: '#6366F1' }} />
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
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ease-out rounded-[20px]"
        style={{
          maxWidth: '900px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Enhanced Header with gradient background */}
        <div className="bg-gradient-to-b from-indigo-50/50 to-white px-12 py-12 border-b border-indigo-50/50 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
          </button>

          {/* Candidate Header */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full border-2 border-gray-200"
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
              >
                <UserAvatar name={candidateName} src={candidatePhoto} className="w-20 h-20" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] leading-tight mb-2">
                {candidateName}
              </h2>
              {resume?.target_job_title && (
                <p className="text-[#475569] font-medium">{resume.target_job_title}</p>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="overflow-y-auto p-8"
          style={{
            maxHeight: 'calc(90vh - 200px)',
            scrollBehavior: 'smooth',
            background: '#F9FAFB',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Resume</h3>
              <p className="text-gray-500">Failed to load resume details</p>
            </div>
          ) : !resume ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Found</h3>
              <p className="text-gray-500">This candidate hasn't uploaded a resume yet.</p>
            </div>
          ) : (
            <div>
              {/* Professional Summary */}
              {resume.custom_summary && (
                <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#0F172A]">Professional Summary</h4>
                      <p className="text-sm text-[#64748B]">Your professional overview</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <p className="text-[#475569] leading-relaxed">{resume.custom_summary}</p>
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {resume?.work_experiences?.length > 0 && (
                <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#0F172A]">Work Experience</h4>
                      <p className="text-sm text-[#64748B]">Professional journey</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {resume.work_experiences.map(exp => (
                      <div
                        key={exp.resume_work_experience_id}
                        className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                <Building className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-[#0F172A] text-lg">
                                  {exp.job_title}
                                </h5>
                                <p className="text-[#475569] font-medium">{exp.company}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#64748B]">
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">
                                  {formatDate(exp.start_date)} -{' '}
                                  {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                                </span>
                              </div>
                              {exp.location && (
                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                  <MapPin className="w-4 h-4 text-blue-500" />
                                  <span className="font-medium">{exp.location}</span>
                                </div>
                              )}
                            </div>

                            {exp.description && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <p className="text-sm text-[#475569] leading-relaxed">
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
                <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#0F172A]">Education</h4>
                      <p className="text-sm text-[#64748B]">Academic background</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {resume.educations.map(edu => (
                      <div
                        key={edu.resume_education_id}
                        className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                                <GraduationCap className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-[#0F172A] text-lg">{edu.degree}</h5>
                                <p className="text-[#475569] font-medium">{edu.college_name}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#64748B]">
                              {edu.start_date && (
                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                  <Calendar className="w-4 h-4 text-indigo-500" />
                                  <span className="font-medium">
                                    {formatDate(edu.start_date)} -{' '}
                                    {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                                  </span>
                                </div>
                              )}
                              {edu.location && (
                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                  <MapPin className="w-4 h-4 text-indigo-500" />
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
                <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#0F172A]">Skills & Expertise</h4>
                      <p className="text-sm text-[#64748B]">Technical and professional skills</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {resume.skills.map(skill => (
                      <div
                        key={skill.resume_skill_id}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                      >
                        <span className="font-semibold">{skill.skill_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {resume.certifications.length > 0 && (
                <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 shadow-sm border border-yellow-100">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#0F172A]">Certifications</h4>
                      <p className="text-sm text-[#64748B]">Professional certifications</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {resume.certifications.map(cert => (
                      <div
                        key={cert.resume_certification_id}
                        className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:border-yellow-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors">
                                <Award className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-[#0F172A] text-lg">
                                  {cert.certification_name}
                                </h5>
                                <p className="text-[#475569] font-medium">{cert.issuing_body}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#64748B]">
                              {cert.issue_date && (
                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                  <Calendar className="w-4 h-4 text-yellow-500" />
                                  <span className="font-medium">
                                    Issued {formatDate(cert.issue_date)}
                                  </span>
                                </div>
                              )}
                              {!cert.does_not_expire && cert.expiration_date && (
                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                  <Calendar className="w-4 h-4 text-yellow-500" />
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
                                  className="inline-flex items-center gap-2 text-sm text-[#3056F5] hover:text-[#1E40AF] font-medium hover:underline"
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
                <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300 mb-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#0F172A]">Profile Social Links</h4>
                      <p className="text-sm text-[#64748B]">Professional online presence</p>
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
                          className="group relative h-15 p-3 bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-50/50 active:scale-[0.98]"
                        >
                          {/* Content Layout */}
                          <div className="flex items-center gap-3 h-full">
                            {/* Icon */}
                            <div className="flex-shrink-0">{getSocialIcon(link.type)}</div>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-900">
                                {getPlatformName(link.type)}
                              </div>
                              <div className="text-xs text-gray-600 truncate">{cleanUrl}</div>
                            </div>
                          </div>

                          {/* External Link Icon - Top Right */}
                          <ExternalLink className="absolute top-2 right-2 w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
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
