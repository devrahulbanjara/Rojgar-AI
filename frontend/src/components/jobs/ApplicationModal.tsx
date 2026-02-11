'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useResumes } from '../../hooks/queries/useResumes'
import { useCreateApplication } from '../../hooks/queries/useJobs'
import { toast } from 'sonner'
import { Loader2, FileText, CheckCircle2, X, AlertCircle, Briefcase } from 'lucide-react'
import { cn } from '../../lib/utils'
import Link from 'next/link'
import type { Job } from '../../types/job'
import { Badge } from '../ui'

interface ApplicationModalProps {
  job: Job
  isOpen: boolean
  onClose: () => void
}

export function ApplicationModal({ job, isOpen, onClose }: ApplicationModalProps) {
  const { data: resumes, isLoading: isLoadingResumes } = useResumes()
  const createApplicationMutation = useCreateApplication()

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedResumeId) {
      toast.error('Please select a resume to apply')
      return
    }

    setIsSubmitting(true)

    try {
      await createApplicationMutation.mutateAsync({
        job_id: job.id.toString(),
        resume_id: selectedResumeId,
      })

      toast.success('Application submitted successfully!')
      onClose()
    } catch (error: unknown) {
      console.error('Application failed:', error)

      const getErrorMessage = (err: unknown): string => {
        if (err instanceof Error) {
          return err.message
        }
        if (typeof err === 'object' && err !== null) {
          const errorObj = err as { message?: string; data?: { detail?: string } }
          return errorObj?.message || errorObj?.data?.detail || 'Failed to submit application.'
        }
        return 'Failed to submit application.'
      }

      const msg = getErrorMessage(error)

      if (msg.includes('Application already exists for this job')) {
        toast.error('You have already applied for this job')
      } else {
        toast.error(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedResumeId(null)
    onClose()
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className="relative z-50 w-full max-w-lg bg-background-surface border border-border-default rounded-[5px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-subtle bg-background-surface">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-text-primary mb-2">
                    {job.title}
                  </h2>
                  <p className="text-sm text-text-secondary mb-3">{job.company?.name || 'Company'}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.level && (
                      <Badge variant="subtle" colorPalette="gray" className="text-xs">
                        {job.level}
                      </Badge>
                    )}
                    {job.location_type && (
                      <Badge variant="subtle" colorPalette="green" className="text-xs">
                        {job.location_type}
                      </Badge>
                    )}
                    {job.employment_type && (
                      <Badge variant="subtle" colorPalette="blue" className="text-xs">
                        {job.employment_type}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded hover:bg-background-subtle text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-full" />
                <div className="absolute left-[-11px] top-0 w-5 h-5 rounded bg-background-surface border-2 border-primary-500 flex items-center justify-center">
                  <Briefcase className="w-3 h-3 text-primary-600" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                    Select Resume
                  </h3>
                  <Link href="/candidate/resumes">
                    <span className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                      + New Resume
                    </span>
                  </Link>
                </div>

                {isLoadingResumes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : !resumes || resumes.length === 0 ? (
                  <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded p-4 text-center">
                    <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-warning-900 dark:text-warning-300 mb-1">
                      No resumes found
                    </p>
                    <p className="text-xs text-warning-700 dark:text-warning-400">
                      Create a resume first to apply.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {resumes.map(resume => {
                      const isSelected = selectedResumeId === resume.resume_id
                      return (
                        <div
                          key={resume.resume_id}
                          onClick={() => setSelectedResumeId(resume.resume_id)}
                          className={cn(
                            'cursor-pointer rounded border p-3 transition-all flex items-center gap-3',
                            isSelected
                              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                              : 'border-border-default hover:border-border-strong bg-background-surface'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded flex items-center justify-center flex-shrink-0',
                              isSelected
                                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600'
                                : 'bg-background-subtle text-text-muted'
                            )}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-text-primary truncate">
                              {resume.target_job_title || 'General Resume'}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle bg-background-subtle/50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-10 px-5 border border-border-default text-text-secondary rounded hover:bg-background-surface transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedResumeId || isSubmitting}
                className="h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Apply Now'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  return null
}
