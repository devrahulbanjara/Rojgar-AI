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
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className="relative z-50 w-full max-w-lg bg-background-surface border border-default rounded-[20px] overflow-hidden shadow-xl"
          >
            {}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 p-2 rounded-xl text-text-tertiary hover:text-text-secondary hover:bg-background-subtle transition-all duration-200 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {}
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-2xl font-bold text-text-primary leading-tight mb-1">
                {job.title}
              </h2>
              <p className="text-base text-text-tertiary">{job.company?.name || 'Company'}</p>

              {}
              <div className="flex flex-wrap gap-2 mt-4">
                {job.level && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background-subtle text-text-secondary border border-default">
                    {job.level}
                  </span>
                )}
                {job.location_type && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 border border-success-200 dark:border-success-800">
                    {job.location_type}
                  </span>
                )}
                {job.employment_type && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ai-50 dark:bg-ai-950/30 text-ai-600 dark:text-ai-400 border border-ai-200 dark:border-ai-800">
                    {job.employment_type}
                  </span>
                )}
              </div>
            </div>

            {}
            <div className="mx-6 mb-6 p-5 bg-background-subtle rounded-xl border border-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <Briefcase className="w-4 h-4 text-primary dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Select Resume</h3>
                <Link href="/candidate/resumes" className="ml-auto">
                  <span className="text-sm font-medium text-primary hover:text-primary-700 cursor-pointer transition-colors">
                    + New
                  </span>
                </Link>
              </div>

              {isLoadingResumes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : !resumes || resumes.length === 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-1">
                    No resumes found
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Create a resume first to apply.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {resumes.map(resume => {
                    const isSelected = selectedResumeId === resume.resume_id
                    return (
                      <div
                        key={resume.resume_id}
                        onClick={() => setSelectedResumeId(resume.resume_id)}
                        className={cn(
                          'group cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-200 flex items-center gap-3 bg-background-surface',
                          isSelected
                            ? 'border-primary shadow-sm'
                            : 'border-default hover:border-strong'
                        )}
                      >
                        <div
                          className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                            isSelected
                              ? 'bg-primary-100 text-primary'
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
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {}
            <div className="border-t border-default bg-background-surface px-8 py-5 flex items-center justify-between gap-4">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-11 px-5 border-2 border-default text-text-secondary rounded-xl hover:bg-background-subtle hover:border-strong transition-all duration-200 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedResumeId || isSubmitting}
                className="h-11 px-6 btn-primary-gradient rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Apply Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </>
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
