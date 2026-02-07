'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/constants'
import { Loader2, Briefcase, Building2, MapPin, Calendar, FileText } from 'lucide-react'
import type { ResumeWorkExperienceResponse } from '@/types/resume'

interface ExperienceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId: string
  initialData?: ResumeWorkExperienceResponse
  onSuccess: () => void
}

export default function ExperienceFormDialog({
  open,
  onOpenChange,
  resumeId,
  initialData,
  onSuccess,
}: ExperienceFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    job_title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          job_title: initialData.job_title || '',
          company: initialData.company || '',
          location: initialData.location || '',
          start_date: initialData.start_date || '',
          end_date: initialData.end_date || '',
          is_current: initialData.is_current || false,
          description: initialData.description || '',
        })
      } else {
        setFormData({
          job_title: '',
          company: '',
          location: '',
          start_date: '',
          end_date: '',
          is_current: false,
          description: '',
        })
      }
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const isEdit = !!initialData
      const url = isEdit
        ? `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}/experience/${initialData.resume_work_experience_id}`
        : `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}/experience`

      const method = isEdit ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        location: formData.location || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        description: formData.description || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success(isEdit ? 'Experience updated' : 'Experience added')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="max-w-xl">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-sm border border-primary-100 dark:border-primary-900/30">
            <Briefcase className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <DialogTitle className="text-xl">
              {initialData ? 'Edit Work Experience' : 'Add Work Experience'}
            </DialogTitle>
            <DialogDescription className="text-text-tertiary">
              {initialData
                ? 'Update your work history details'
                : 'Add your professional experience'}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="pt-2">
        <form id="experience-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Job Title and Company Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-text-tertiary" />
                Job Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.job_title}
                onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="e.g. Senior Developer"
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary placeholder:text-text-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-text-tertiary" />
                Company <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Acme Inc."
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-text-tertiary" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. New York, NY (Remote)"
              className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                hover:border-border-strong transition-all duration-200
                text-text-primary placeholder:text-text-muted"
            />
          </div>

          {/* Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                End Date
              </label>
              <input
                type="date"
                disabled={formData.is_current}
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-muted"
              />
            </div>
          </div>

          {/* Currently Working Checkbox */}
          <div className="flex items-center gap-3 pt-1">
            <Checkbox
              id="current"
              checked={formData.is_current}
              onCheckedChange={c => setFormData({ ...formData, is_current: c as boolean })}
            />
            <label
              htmlFor="current"
              className="text-sm font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
            >
              I currently work here
            </label>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-text-tertiary" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your achievements and responsibilities..."
              rows={4}
              className="w-full px-4 py-3 bg-background-subtle border border-border-default rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                hover:border-border-strong transition-all duration-200
                text-text-primary placeholder:text-text-muted resize-none"
            />
          </div>
        </form>
      </DialogContent>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="h-11 px-6 rounded-xl border-border-default hover:bg-background-subtle hover:border-border-strong transition-all duration-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="experience-form"
          disabled={loading}
          className="h-11 px-6 rounded-xl bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary/25 dark:shadow-primary/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {initialData ? 'Save Changes' : 'Add Experience'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
