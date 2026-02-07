import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ResumeResponse, ResumeCreate } from '@/types/resume'
import { resumeService } from '@/services/resumeService'
import { Loader2, FileText, Target, AlignLeft } from 'lucide-react'

interface BasicInfoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId?: string | null
  initialData?: ResumeResponse | null
  onSuccess: (resume: ResumeResponse) => void
  mode?: 'create' | 'edit'
}

export default function BasicInfoFormDialog({
  open,
  onOpenChange,
  resumeId,
  initialData,
  onSuccess,
  mode = 'edit',
}: BasicInfoFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    target_job_title: '',
    custom_summary: '',
  })

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        target_job_title: initialData.target_job_title || '',
        custom_summary: initialData.custom_summary || '',
      })
    } else {
      setFormData({
        target_job_title: '',
        custom_summary: '',
      })
    }
  }, [initialData, open, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'create') {
        const createData: ResumeCreate = {
          target_job_title: formData.target_job_title || null,
          custom_summary: formData.custom_summary || null,
        }
        const created = await resumeService.createResumeFork(createData)
        toast.success('Resume created successfully')
        onSuccess(created)
      } else if (resumeId) {
        const updated = await resumeService.updateResume(resumeId, formData)
        toast.success('Resume details updated')
        onSuccess(updated)
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create resume' : 'Failed to update resume details')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-sm border border-primary-100 dark:border-primary-900/30">
            <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <DialogTitle className="text-xl">
              {mode === 'create' ? 'Create New Resume' : 'Edit Resume Details'}
            </DialogTitle>
            <DialogDescription className="text-text-tertiary">
              {mode === 'create'
                ? 'Start by specifying your target job title'
                : 'Update your target position and summary'}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="pt-2">
        <form id="basic-info-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Target Job Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <Target className="w-4 h-4 text-text-tertiary" />
              Target Job Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.target_job_title}
              onChange={e => setFormData({ ...formData, target_job_title: e.target.value })}
              required
              placeholder="e.g. Senior Software Engineer"
              className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                hover:border-border-strong transition-all duration-200
                text-text-primary placeholder:text-text-muted"
            />
            <p className="text-xs text-text-tertiary mt-1.5">
              This helps tailor your resume for specific job applications
            </p>
          </div>

          {/* Professional Summary */}
          {mode === 'edit' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-text-tertiary" />
                Professional Summary
              </label>
              <textarea
                value={formData.custom_summary}
                onChange={e => setFormData({ ...formData, custom_summary: e.target.value })}
                placeholder="Write a brief summary of your professional background..."
                rows={4}
                className="w-full px-4 py-3 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary placeholder:text-text-muted resize-none"
              />
            </div>
          )}
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
          form="basic-info-form"
          disabled={loading}
          className="h-11 px-6 rounded-xl bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary/25 dark:shadow-primary/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {mode === 'create' ? 'Create Resume' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
