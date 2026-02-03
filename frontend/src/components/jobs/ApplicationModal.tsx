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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className="relative z-50 w-full max-w-lg bg-white border border-gray-200 rounded-[20px] overflow-hidden"
            style={{
              boxShadow:
                '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 40px rgba(0, 0, 0, 0.15), 0 20px 60px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header - Clean white like screenshot */}
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{job.title}</h2>
              <p className="text-base text-gray-500">{job.company?.name || 'Company'}</p>

              {/* Badges - matching the pill style from screenshot */}
              <div className="flex flex-wrap gap-2 mt-4">
                {job.level && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {job.level}
                  </span>
                )}
                {job.location_type && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {job.location_type}
                  </span>
                )}
                {job.employment_type && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-violet-50 text-violet-700 border border-violet-100">
                    {job.employment_type}
                  </span>
                )}
              </div>
            </div>

            {/* Resume Selection Section - Gray background like info card in screenshot */}
            <div className="mx-6 mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-blue-600 rounded-full" />
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Select Resume</h3>
                <Link href="/candidate/resumes" className="ml-auto">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
                    + New
                  </span>
                </Link>
              </div>

              {isLoadingResumes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : !resumes || resumes.length === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-900 mb-1">No resumes found</p>
                  <p className="text-xs text-amber-700">Create a resume first to apply.</p>
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
                          'group cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-200 flex items-center gap-3 bg-white',
                          isSelected
                            ? 'border-blue-500 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div
                          className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                            isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {resume.resume_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {resume.target_job_title || 'General Resume'}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer - matching the Apply Now button style */}
            <div className="border-t border-gray-200 bg-white px-8 py-5 flex items-center justify-between gap-4">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-11 px-5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedResumeId || isSubmitting}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
