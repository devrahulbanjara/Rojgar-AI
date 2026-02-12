'use client'

import {
  Dialog,
  DialogContent,
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
import type { Education } from '@/types/resume'

interface EducationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId: string
  initialData?: Education
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
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      className="max-w-[600px] p-0 overflow-hidden border-none shadow-2xl"
    >
      <div className="bg-background-surface flex flex-col h-full max-h-[90vh]">
        <div className="p-8 border-b border-border-subtle bg-background-surface shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-ai-600/10 dark:bg-ai-600/20 flex items-center justify-center border border-ai-600/20 shadow-sm">
              <GraduationCap className="w-7 h-7 text-ai-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-text-primary">
                {initialData ? 'Edit Education' : 'Add Education'}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-text-tertiary font-medium">
                {initialData
                  ? 'Refine your academic background details below'
                  : 'Add your educational history to your profile'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <DialogContent className="p-8 overflow-y-auto">
          <form id="education-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                School / College <span className="text-error-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.college_name}
                onChange={e => setFormData({ ...formData, college_name: e.target.value })}
                placeholder="e.g. Herald College Kathmandu"
                className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-ai-600/20 focus:border-ai-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Degree <span className="text-error-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.degree}
                onChange={e => setFormData({ ...formData, degree: e.target.value })}
                placeholder="e.g. B(Hons) in Computer Science"
                className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-ai-600/20 focus:border-ai-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Kathmandu, Nepal"
                className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-ai-600/20 focus:border-ai-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-ai-600/20 focus:border-ai-600 
                    hover:border-border-strong transition-all duration-200
                    text-text-primary font-medium transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  End Date
                </label>
                <input
                  type="date"
                  disabled={formData.is_current}
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-ai-600/20 focus:border-ai-600 
                    hover:border-border-strong transition-all duration-200
                    text-text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-muted"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 py-1">
              <Checkbox
                id="current_edu"
                checked={formData.is_current}
                onCheckedChange={c => setFormData({ ...formData, is_current: c as boolean })}
                className="w-5 h-5 rounded-md border-border-default data-[state=checked]:bg-ai-600 data-[state=checked]:border-ai-600 transition-all shadow-sm"
              />
              <label
                htmlFor="current_edu"
                className="text-[14px] font-semibold text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
              >
                I am currently studying here
              </label>
            </div>
          </form>
        </DialogContent>

        <DialogFooter className="p-6 border-t border-border-subtle bg-background-surface shrink-0">
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-background-subtle font-bold uppercase tracking-wider text-[11px] transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="education-form"
              disabled={loading}
              className="h-11 px-8 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-ai-600/20 transition-all active:scale-95"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              {initialData ? 'Save Changes' : 'Add Education'}
            </Button>
          </div>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
