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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ResumeResponse, ResumeCreate } from '@/types/resume'
import { resumeService } from '@/services/resumeService'
import { Loader2, FileText } from 'lucide-react'

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <DialogTitle>
              {mode === 'create' ? 'Create New Resume' : 'Edit Resume Details'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Start by specifying your target job title'
                : 'Update your target position and summary'}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="pt-0">
        <form id="basic-info-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-secondary">
              Target Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.target_job_title}
              onChange={e => setFormData({ ...formData, target_job_title: e.target.value })}
              required
              placeholder="e.g. Senior Software Engineer"
              className="h-11 rounded-xl border-border-default focus:border-primary focus:ring-primary/20"
            />
          </div>

          {mode === 'edit' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-text-secondary">
                Professional Summary
              </Label>
              <Textarea
                value={formData.custom_summary}
                onChange={e => setFormData({ ...formData, custom_summary: e.target.value })}
                className="min-h-[120px] resize-none rounded-xl border-border-default focus:border-primary focus:ring-primary/20"
                placeholder="Write a brief summary of your professional background..."
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
          className="rounded-xl px-5"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="basic-info-form"
          disabled={loading}
          className="rounded-xl px-6 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-400/15"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {mode === 'create' ? 'Create Resume' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
