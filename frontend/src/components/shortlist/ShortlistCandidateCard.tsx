import React, { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Mail,
  Edit2,
  Trash2,
  Send,
  Save,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ShortlistCandidate } from '../../types/shortlist'
import { ResumeDetailModal } from './ResumeDetailModal'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui'

interface EmailDraft {
  draft_id: string
  application_id: string
  candidate_name: string
  candidate_email: string
  status: string
  subject: string
  body: string
  is_approved: boolean
  is_sent: boolean
  is_discarded: boolean
}

interface ShortlistCandidateCardProps {
  candidate: ShortlistCandidate
  onShortlist: (applicationId: string) => void
  onReject: (applicationId: string) => void
  className?: string
  showJobTitle?: boolean
  showScores?: boolean
  isShortlistingInProgress?: boolean
  isFinalized?: boolean
  emailDraft?: EmailDraft
  onSaveDraft?: (draftId: string, subject: string, body: string) => void
  onDiscardDraft?: (draftId: string) => void
  onSendDraft?: (draftId: string) => void
  isSendingDraft?: boolean
  isLoadingDraft?: boolean
}

export function ShortlistCandidateCard({
  candidate,
  onShortlist,
  onReject,
  className,
  showJobTitle = false,
  showScores = true,
  isShortlistingInProgress = false,
  isFinalized = false,
  emailDraft,
  onSaveDraft,
  onDiscardDraft,
  onSendDraft,
  isSendingDraft = false,
  isLoadingDraft = false,
}: ShortlistCandidateCardProps) {
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const getScoreStyles = (score: number) => {
    if (score < 50) {
      return {
        scoreColor: 'text-error-600 dark:text-error-400',
        bgColor:
          'from-error-50/80 via-error-50/40 to-error-50/60 dark:from-error-950/30 dark:via-error-950/20 dark:to-error-950/30',
        borderColor: 'border-error-200/60 dark:border-error-800/60',
      }
    } else if (score >= 50 && score < 70) {
      return {
        scoreColor: 'text-warning-600 dark:text-warning-400',
        bgColor:
          'from-warning-50/80 via-warning-50/40 to-warning-50/60 dark:from-warning-950/30 dark:via-warning-950/20 dark:to-warning-950/30',
        borderColor: 'border-warning-200/60 dark:border-warning-800/60',
      }
    } else {
      return {
        scoreColor: 'text-primary-600 dark:text-primary-400',
        bgColor:
          'from-primary-50/80 via-primary-50/40 to-primary-50/60 dark:from-primary-950/30 dark:via-primary-950/20 dark:to-primary-950/30',
        borderColor: 'border-primary-200/60 dark:border-primary-800/60',
      }
    }
  }

  const scoreStyles = getScoreStyles(candidate.score)

  // Check if candidate is already processed
  const isShortlisted = candidate.current_status === 'shortlisted'
  const isRejected = candidate.current_status === 'rejected'
  const isProcessed = isShortlisted || isRejected

  const handleStartEdit = () => {
    if (emailDraft) {
      setEditedSubject(emailDraft.subject)
      setEditedBody(emailDraft.body)
      setIsEditingDraft(true)
    }
  }

  const handleSaveEdit = () => {
    if (emailDraft && onSaveDraft) {
      onSaveDraft(emailDraft.draft_id, editedSubject, editedBody)
      setIsEditingDraft(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingDraft(false)
    setEditedSubject('')
    setEditedBody('')
  }

  return (
    <div
      className={cn(
        'group w-full bg-background-surface rounded-2xl border border-border-default p-6 shadow-sm hover:shadow-md transition-shadow',
        isRejected && 'opacity-70',
        className
      )}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
            <AvatarImage src={candidate.picture || undefined} />
            <AvatarFallback className="bg-background-subtle text-text-secondary font-bold">
              {candidate.name
                .split(' ')
                .map(part => part[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-text-primary leading-tight">
                {candidate.name}
              </h3>
              {isShortlisted && (
                <Badge
                  colorPalette="blue"
                  className="text-xs px-2 py-0.5"
                  style={{ borderRadius: '5px' }}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Shortlisted
                </Badge>
              )}
              {isRejected && (
                <Badge
                  colorPalette="red"
                  className="text-xs px-2 py-0.5"
                  style={{ borderRadius: '5px' }}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>

            {showJobTitle && (
              <p className="text-sm text-text-secondary font-medium">
                Applied for: {candidate.job_title}
              </p>
            )}
            {candidate.professional_headline && (
              <p className="text-sm text-text-secondary">{candidate.professional_headline}</p>
            )}
            <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">
              Applied{' '}
              {new Date(candidate.applied_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-4">
          {showScores && (
            <div className="text-center pr-4 border-r border-border-default/50">
              {isShortlistingInProgress && !candidate.score ? (
                <>
                  <Loader2 className="w-7 h-7 text-primary-500 animate-spin mx-auto" />
                  <div className="text-[10px] text-primary-600 font-bold tracking-tight mt-1.5">
                    Analyzing...
                  </div>
                </>
              ) : (
                <div className={cn('text-2xl font-bold leading-none', scoreStyles.scoreColor)}>
                  {candidate.score}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="px-5 py-2.5 border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              View Resume
            </button>
            {!isProcessed && !isFinalized && (
              <>
                <Button
                  size="sm"
                  className="h-9 px-5 bg-primary-600 hover:bg-primary-700 text-[13px] font-semibold"
                  onClick={() => onShortlist(candidate.application_id)}
                >
                  Shortlist
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-5 text-text-secondary border-border-default bg-transparent text-[13px] font-semibold hover:text-error-600 hover:border-error-200 hover:bg-error-50"
                  onClick={() => onReject(candidate.application_id)}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {showScores && candidate.feedback && (
        <div className="mt-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="analysis"
              className="border-none bg-background-subtle/40 rounded-xl"
            >
              <AccordionTrigger className="px-4 py-2.5 hover:no-underline border-t border-border-subtle/50 rounded-b-none">
                <div className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary uppercase tracking-tight">
                  <FileText className="w-3.5 h-3.5 text-primary-500" />
                  AI Feedback
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="border-l border-border-default pl-4">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {candidate.feedback}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {isLoadingDraft && isFinalized && (
        <div className="mt-4">
          <Accordion type="single" collapsible className="w-full" defaultValue="email">
            <AccordionItem value="email" className="border-none bg-background-subtle/40 rounded-xl">
              <AccordionTrigger className="px-4 py-2.5 hover:no-underline border-t border-border-subtle/50 rounded-b-none">
                <div className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary uppercase tracking-tight">
                  <Mail className="w-3.5 h-3.5 text-primary-500" />
                  Email Draft
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-3">
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary-100 dark:border-primary-900/30" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 animate-spin" />
                    <Mail className="absolute inset-0 m-auto w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-text-primary">Preparing Email Draft</p>
                    <p className="text-xs text-text-tertiary">
                      AI is composing a personalized message...
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {emailDraft && !isLoadingDraft && (
        <div className="mt-4">
          <Accordion type="single" collapsible className="w-full" defaultValue="email">
            <AccordionItem value="email" className="border-none bg-background-subtle/40 rounded-xl">
              <AccordionTrigger className="px-4 py-2.5 hover:no-underline border-t border-border-subtle/50 rounded-b-none">
                <div className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary uppercase tracking-tight">
                  <Mail className="w-3.5 h-3.5 text-primary-500" />
                  Email Draft
                  {emailDraft.is_sent && (
                    <Badge
                      colorPalette="green"
                      className="text-[8px] font-black uppercase px-1.5 py-0.5 ml-2"
                      style={{ borderRadius: '4px' }}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                      SENT
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-3">
                <div className="space-y-3">
                  {/* Subject */}
                  <div className="flex gap-2 text-xs">
                    <span className="font-bold text-text-tertiary shrink-0">Subject:</span>
                    {isEditingDraft ? (
                      <input
                        type="text"
                        value={editedSubject}
                        onChange={e => setEditedSubject(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-border-default rounded bg-background-default text-text-primary"
                      />
                    ) : (
                      <span className="text-text-primary font-medium">{emailDraft.subject}</span>
                    )}
                  </div>

                  {/* Body */}
                  {isEditingDraft ? (
                    <textarea
                      value={editedBody}
                      onChange={e => setEditedBody(e.target.value)}
                      rows={12}
                      className="w-full p-3 text-xs border border-border-default rounded bg-background-default text-text-primary font-mono leading-relaxed"
                    />
                  ) : (
                    <div
                      className="p-4 bg-background-subtle/50 rounded-xl border border-border-subtle text-xs leading-relaxed [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-semibold [&_p]:text-xs [&_p]:my-2 [&_strong]:font-semibold [&_a]:text-primary-600 [&_a]:underline [&_*]:!text-text-primary [&_table]:!bg-background-surface [&_td]:!bg-background-surface [&_body]:!bg-background-default [&_img]:!max-w-[120px] [&_img]:!h-auto dark:[&_*]:!text-text-primary dark:[&_table]:!bg-background-surface dark:[&_td]:!bg-background-surface dark:[&_body]:!bg-background-default"
                      dangerouslySetInnerHTML={{ __html: emailDraft.body }}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                    {isEditingDraft ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs bg-background-surface dark:bg-background-surface"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="text-xs bg-primary-600 hover:bg-primary-700"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save Changes
                        </Button>
                      </>
                    ) : emailDraft.is_sent ? (
                      <span className="text-xs text-text-tertiary italic">Email has been sent</span>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleStartEdit}
                          className="text-xs bg-background-surface dark:bg-background-surface"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDiscardDraft && onDiscardDraft(emailDraft.draft_id)}
                          className="text-xs bg-background-surface dark:bg-background-surface hover:text-error-600 hover:border-error-200 hover:bg-error-50 dark:hover:bg-error-950/30"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onSendDraft && onSendDraft(emailDraft.draft_id)}
                          disabled={isSendingDraft}
                          className="text-xs bg-primary-600 hover:bg-primary-700"
                        >
                          {isSendingDraft ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3 mr-1" />
                          )}
                          Send
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      <ResumeDetailModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        applicationId={candidate.application_id}
        candidateName={candidate.name}
        candidatePhoto={candidate.picture}
        candidateSocialLinks={candidate.social_links}
      />
    </div>
  )
}
