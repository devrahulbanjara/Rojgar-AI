'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/constants'
import { Loader2, User, Briefcase } from 'lucide-react'

interface BasicInfoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId: string
  initialData?: {
    target_job_title?: string
    custom_summary?: string
  }
  onSuccess: () => void
}

export default function BasicInfoFormDialog({
  open,
  onOpenChange,
  resumeId,
  initialData,
  onSuccess,
}: BasicInfoFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    target_job_title: '',
    custom_summary: '',
  })

  useEffect(() => {
    if (open) {
      setFormData({
        target_job_title: initialData?.target_job_title || '',
        custom_summary: initialData?.custom_summary || '',
      })
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success('Basic info updated')
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
    <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
      <div className="bg-background-surface flex flex-col h-full max-h-[90vh]">
        <div className="p-8 border-b border-border-subtle bg-background-surface shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center border border-primary-600/20 shadow-sm">
              <User className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-text-primary">
                Profile Overview
              </DialogTitle>
              <DialogDescription className="text-[14px] text-text-tertiary font-medium">
                Refine your professional summary and target role
              </DialogDescription>
            </div>
          </div>
        </div>

        <DialogContent className="p-8 overflow-y-auto">
          <form id="basic-info-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" />
                Target Job Title <span className="text-error-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.target_job_title}
                onChange={e => setFormData({ ...formData, target_job_title: e.target.value })}
                placeholder="e.g. Senior Fullstack Engineer"
                className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                User Summary
              </label>
              <textarea
                value={formData.custom_summary}
                onChange={e => setFormData({ ...formData, custom_summary: e.target.value })}
                placeholder="Craft a compelling professional summary..."
                rows={6}
                className="w-full px-4 py-3 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted resize-none leading-relaxed"
              />
              <p className="text-[12px] text-text-tertiary font-medium mt-2 leading-relaxed">
                Tip: Briefly describe your core expertise, years of experience, and what values you bring to a potential team.
              </p>
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
              form="basic-info-form"
              disabled={loading}
              className="h-11 px-8 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-primary-600/20 transition-all active:scale-95"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
