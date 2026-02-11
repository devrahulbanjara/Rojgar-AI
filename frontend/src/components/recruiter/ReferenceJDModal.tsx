import React from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Briefcase,
  FileText,
  CheckCircle2,
  Gift,
  Trash2,
  Edit,
  Award,
  Building2,
} from 'lucide-react'
import { ReferenceJD } from '../../services/referenceJDService'
import { useDeleteConfirm } from '../ui/delete-confirm-dialog'
import { ActionButton, Badge } from '../ui'

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
  const { confirm, Dialog } = useDeleteConfirm()

  if (!isOpen || !jd) return null

  const handleDelete = async () => {
    if (onDelete) {
      await confirm({
        title: 'Delete Reference JD',
        description: "You're about to permanently delete",
        itemName: jd.department ? `${jd.department} Template` : 'this reference template',
        onConfirm: async () => {
          onDelete(jd)
        },
      })
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(jd)
    }
  }

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-[5px] bg-background-surface shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-10 py-8 pb-8">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1 flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                  {jd.department ? `${jd.department} Template` : 'Reference Job Description'}
                </h2>
                <p className="text-text-secondary font-medium">Reference Template</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Standardized Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              {jd.department && (
                <Badge className="bg-primary-600 hover:bg-primary-700 text-white border-0 text-[14px] font-medium">
                  {jd.department}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
              >
                Template
              </Badge>
            </div>

            {/* Content Sections with clean left border design */}
            <div className="space-y-8">
              {(jd.job_summary || jd.role_overview) && (
                <Section icon={<Briefcase className="w-4 h-4" />} title="Job Summary">
                  <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {jd.job_summary || jd.role_overview}
                  </p>
                </Section>
              )}

              {jd.job_responsibilities && jd.job_responsibilities.length > 0 && (
                <Section icon={<Briefcase className="w-4 h-4" />} title="Responsibilities">
                  <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {jd.job_responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {(jd.required_qualifications || jd.requiredSkillsAndExperience) &&
                (jd.required_qualifications?.length > 0 ||
                  jd.requiredSkillsAndExperience?.length > 0) && (
                  <Section
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    title="Required Qualifications"
                  >
                    <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {(jd.required_qualifications || jd.requiredSkillsAndExperience || []).map(
                        (req, i) => (
                          <li key={i}>{req}</li>
                        )
                      )}
                    </ul>
                  </Section>
                )}

              {(jd.preferred || jd.niceToHave) &&
                (jd.preferred?.length > 0 || jd.niceToHave?.length > 0) && (
                  <Section icon={<Award className="w-4 h-4" />} title="Preferred">
                    <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {(jd.preferred || jd.niceToHave || []).map((skill, i) => (
                        <li key={i}>{skill}</li>
                      ))}
                    </ul>
                  </Section>
                )}

              {(jd.compensation_and_benefits || jd.benefits) &&
                (jd.compensation_and_benefits?.length > 0 || jd.benefits?.length > 0) && (
                  <Section icon={<Gift className="w-4 h-4" />} title="Compensation & Benefits">
                    <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {(jd.compensation_and_benefits || jd.benefits || []).map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </Section>
                )}

              {jd.about_the_company && (
                <Section icon={<Building2 className="w-4 h-4" />} title="About the Company">
                  <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {jd.about_the_company}
                  </p>
                </Section>
              )}
            </div>
          </div>
        </div>

        {/* Standardized Footer with Action Hierarchy */}
        <div className="border-t border-border-default bg-slate-50/50 dark:bg-slate-900/30 px-10 py-6 flex items-center justify-between rounded-b-[5px]">
          <div className="flex items-center gap-3">
            {onDelete && (
              <ActionButton
                onClick={handleDelete}
                variant="ghost"
                size="md"
                className="text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-950/30"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </ActionButton>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onEdit && (
              <ActionButton
                onClick={handleEdit}
                variant="outline"
                size="md"
                className="text-slate-600 dark:text-slate-400"
              >
                <Edit className="w-4 h-4" />
                Edit
              </ActionButton>
            )}
            <ActionButton
              onClick={() => onUseTemplate(jd)}
              variant="primary"
              size="md"
              className="px-8"
            >
              <FileText className="w-4 h-4" />
              Use Template
            </ActionButton>
          </div>
        </div>
      </div>
      <Dialog />
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }
  return content
}

// Clean section component with standardized typography scale
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 transition-colors pt-1">
      <div className="absolute -left-[11px] top-1 p-1 bg-white dark:bg-slate-900 border border-border-default rounded-md text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4">
        {title}
      </h4>
      <div>{children}</div>
    </div>
  )
}
