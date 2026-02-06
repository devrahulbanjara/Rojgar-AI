import React from 'react'
import { createPortal } from 'react-dom'
import { X, Briefcase, Sparkles, CheckCircle2, Gift, Trash2, Edit } from 'lucide-react'
import { ReferenceJD } from '../../services/referenceJDService'

interface ReferenceJDModalProps {
  jd: ReferenceJD | null
  isOpen: boolean
  onClose: () => void
  onUseTemplate: (jd: ReferenceJD) => void
  onDelete?: (jd: ReferenceJD) => void
  onEdit?: (jd: ReferenceJD) => void
}

export function ReferenceJDModal({
  jd,
  isOpen,
  onClose,
  onUseTemplate,
  onDelete,
  onEdit,
}: ReferenceJDModalProps) {
  if (!isOpen || !jd) return null

  const handleDelete = () => {
    if (onDelete) {
      onDelete(jd)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(jd)
    }
  }

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[900px] max-h-[90vh] flex flex-col rounded-[20px] bg-background-surface shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Enhanced Header with gradient background */}
        <div className="bg-gradient-to-b from-background-subtle/80 to-background-surface px-12 py-12 border-b border-border-subtle relative rounded-t-[20px]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-background-subtle transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors" />
          </button>

          {/* Job Title & Department */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-3 py-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-sm font-semibold rounded-lg border border-primary-200 dark:border-primary-800">
                Reference JD
              </span>
              <span className="px-3 py-1.5 text-sm font-semibold rounded-lg border bg-background-subtle text-text-tertiary border-border-default">
                Template
              </span>
            </div>
            <h2 className="text-[28px] font-bold text-text-primary leading-tight tracking-[0.3px]">
              Reference Job Description
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-12 py-12">
          {/* Job Summary */}
          {(jd.job_summary || jd.role_overview) && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                  <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  Job Summary
                </h3>
              </div>
              <div className="pl-14">
                <p className="text-[16px] text-text-secondary leading-[1.8]">
                  {jd.job_summary || jd.role_overview}
                </p>
              </div>
            </section>
          )}

          {/* Job Responsibilities */}
          {jd.job_responsibilities && jd.job_responsibilities.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                  <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  Job Responsibilities
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {jd.job_responsibilities.map((resp, i) => (
                    <li key={i} className="text-[15px] text-text-secondary leading-relaxed pl-2">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Required Qualifications */}
          {(jd.required_qualifications || jd.requiredSkillsAndExperience) &&
            (jd.required_qualifications?.length > 0 ||
              jd.requiredSkillsAndExperience?.length > 0) && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-success-600 rounded-full" />
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/30">
                    <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                    Required Qualifications
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {(jd.required_qualifications || jd.requiredSkillsAndExperience || []).map(
                      (req, i) => (
                        <li
                          key={i}
                          className="text-[15px] text-text-secondary leading-relaxed pl-2"
                        >
                          {req}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </section>
            )}

          {/* Preferred */}
          {(jd.preferred || jd.niceToHave) &&
            (jd.preferred?.length > 0 || jd.niceToHave?.length > 0) && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-warning-600 rounded-full" />
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-900/30">
                    <Sparkles className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                    Preferred
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {(jd.preferred || jd.niceToHave || []).map((skill, i) => (
                      <li key={i} className="text-[15px] text-text-secondary leading-relaxed pl-2">
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

          {/* Compensation & Benefits */}
          {(jd.compensation_and_benefits || jd.benefits) &&
            (jd.compensation_and_benefits?.length > 0 || jd.benefits?.length > 0) && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-ai-600 rounded-full" />
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-ai-50 dark:bg-ai-900/30">
                    <Gift className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                    Compensation & Benefits
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {(jd.compensation_and_benefits || jd.benefits || []).map((benefit, i) => (
                      <li key={i} className="text-[15px] text-text-secondary leading-relaxed pl-2">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

          {/* About the Company */}
          {jd.about_the_company && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                  <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  About the Company
                </h3>
              </div>
              <div className="pl-14">
                <p className="text-[16px] text-text-secondary leading-[1.8]">
                  {jd.about_the_company}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-border-default bg-background-surface px-12 py-6 flex items-center justify-between gap-4 shadow-lg rounded-b-[20px]">
          <div className="flex items-center gap-4">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="h-12 px-6 bg-ai-50 dark:bg-ai-950/30 hover:bg-ai-100 dark:hover:bg-ai-900/30 text-ai-700 dark:text-ai-300 font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 border border-ai-200 dark:border-ai-800"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="h-12 px-6 bg-error-50 dark:bg-error-950/30 hover:bg-error-100 dark:hover:bg-error-900/30 text-error-700 dark:text-error-300 font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 border border-error-200 dark:border-error-800"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={onClose}
              className="h-12 px-6 bg-background-subtle hover:bg-background-muted text-text-secondary font-semibold rounded-lg transition-all duration-200"
            >
              Close
            </button>
            <button
              onClick={() => onUseTemplate(jd)}
              className="h-12 px-6 btn-primary-gradient font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }
  return content
}
