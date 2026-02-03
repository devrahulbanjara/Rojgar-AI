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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/constants'
import { Loader2, GraduationCap } from 'lucide-react'
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <DialogTitle>{initialData ? 'Edit Education' : 'Add Education'}</DialogTitle>
            <DialogDescription>
              {initialData ? 'Update your education details' : 'Add your academic background'}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="pt-0">
        <form id="education-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              School / College <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              value={formData.college_name}
              onChange={e => setFormData({ ...formData, college_name: e.target.value })}
              placeholder="e.g. Herald College Kathmandu"
              className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Degree <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              value={formData.degree}
              onChange={e => setFormData({ ...formData, degree: e.target.value })}
              placeholder="e.g. B(Hons) in Computer Science"
              className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Location</Label>
            <Input
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Kathmandu, Nepal"
              className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">End Date</Label>
              <Input
                type="date"
                disabled={formData.is_current}
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="current_edu"
              checked={formData.is_current}
              onCheckedChange={c => setFormData({ ...formData, is_current: c as boolean })}
              className="rounded border-gray-300"
            />
            <label htmlFor="current_edu" className="text-sm text-gray-700 cursor-pointer">
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
          className="rounded-xl px-5"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="education-form"
          disabled={loading}
          className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {initialData ? 'Save Changes' : 'Add Education'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
