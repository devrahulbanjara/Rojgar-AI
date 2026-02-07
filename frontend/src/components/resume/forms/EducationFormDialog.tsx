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
import { Loader2, GraduationCap, Building2, BookOpen, MapPin, Calendar } from 'lucide-react'
import type { ResumeEducationResponse } from '@/types/resume'

interface EducationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId: string
  initialData?: ResumeEducationResponse
  onSuccess: () => void
}

export default function EducationFormDialog({
  open,
  onOpenChange,
  resumeId,
  initialData,
  onSuccess,
}: EducationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    college_name: '',
    degree: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          college_name: initialData.college_name || '',
          degree: initialData.degree || '',
          location: initialData.location || '',
          start_date: initialData.start_date || '',
          end_date: initialData.end_date || '',
          is_current: initialData.is_current || false,
        })
      } else {
        setFormData({
          college_name: '',
          degree: '',
          location: '',
          start_date: '',
          end_date: '',
          is_current: false,
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
        ? `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}/education/${initialData.resume_education_id}`
        : `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}/education`

      const method = isEdit ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        location: formData.location || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success(isEdit ? 'Education updated' : 'Education added')
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
          <div className="w-12 h-12 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center shadow-sm border border-ai-100 dark:border-ai-900/30">
            <GraduationCap className="w-6 h-6 text-ai-600 dark:text-ai-400" />
          </div>
          <div>
            <DialogTitle className="text-xl">
              {initialData ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
            <DialogDescription className="text-text-tertiary">
              {initialData ? 'Update your education details' : 'Add your academic background'}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="pt-2">
        <form id="education-form" onSubmit={handleSubmit} className="space-y-5">
          {/* School / College */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-text-tertiary" />
              School / College <span className="text-error">*</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                required
                value={formData.college_name}
                onChange={e => setFormData({ ...formData, college_name: e.target.value })}
                placeholder="e.g. Herald College Kathmandu"
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-ai-500/20 focus:border-ai-500 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Degree */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-text-tertiary" />
              Degree <span className="text-error">*</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                required
                value={formData.degree}
                onChange={e => setFormData({ ...formData, degree: e.target.value })}
                placeholder="e.g. B(Hons) in Computer Science"
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-ai-500/20 focus:border-ai-500 
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
            <div className="relative group">
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Kathmandu, Nepal"
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-ai-500/20 focus:border-ai-500 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary placeholder:text-text-muted"
              />
            </div>
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
                  focus:outline-none focus:ring-2 focus:ring-ai-500/20 focus:border-ai-500 
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
                  focus:outline-none focus:ring-2 focus:ring-ai-500/20 focus:border-ai-500 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-muted"
              />
            </div>
          </div>

          {/* Currently Studying Checkbox */}
          <div className="flex items-center gap-3 pt-1 pb-2">
            <Checkbox
              id="current_edu"
              checked={formData.is_current}
              onCheckedChange={c => setFormData({ ...formData, is_current: c as boolean })}
            />
            <label
              htmlFor="current_edu"
              className="text-sm font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
            >
              I am currently studying here
            </label>
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
          form="education-form"
          disabled={loading}
          className="h-11 px-6 rounded-xl bg-ai-600 dark:bg-ai-500 hover:bg-ai-700 dark:hover:bg-ai-600 text-white font-semibold shadow-lg shadow-ai-500/25 dark:shadow-ai-400/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {initialData ? 'Save Changes' : 'Add Education'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
