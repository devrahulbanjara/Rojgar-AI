'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Briefcase, PenLine } from 'lucide-react'
import { cn } from '../../lib/utils'
import { JobCreationWizard } from './JobCreationWizard'
import type { Job } from '../../types/job'

interface PostJobModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'agent' | 'manual'
  jobToEdit?: Job
  initialReferenceJdId?: string
}

export function PostJobModal({
  isOpen,
  onClose,
  initialMode,
  jobToEdit,
  initialReferenceJdId,
}: PostJobModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative bg-background-surface rounded-3xl shadow-2xl border border-background-surface/20',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'animate-in zoom-in-95 duration-300 ease-out',
          'w-[900px] max-w-[95vw]'
        )}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div className="bg-background-surface px-10 py-8 border-b border-border-subtle relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2.5 rounded-full hover:bg-background-subtle text-text-muted hover:text-text-primary transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Content */}
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-sm border border-primary-100 dark:border-primary-900/30 flex-shrink-0">
              {jobToEdit ? (
                <PenLine className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              ) : (
                <Briefcase className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-2xl font-bold text-text-primary leading-tight tracking-tight">
                {jobToEdit ? 'Edit Job Posting' : 'Create New Job'}
              </h2>
              <p className="text-text-tertiary mt-1.5 text-base">
                {jobToEdit
                  ? 'Update your job posting details. Use AI to revise or edit manually.'
                  : 'Build your job posting step by step. Use AI generation to speed up the process.'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-background-subtle">
          <JobCreationWizard
            mode={initialMode || 'agent'}
            onBack={onClose}
            onComplete={() => {
              onClose()
            }}
            jobToEdit={jobToEdit}
            initialReferenceJdId={initialReferenceJdId}
          />
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }
  return content
}
