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
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/constants'
import { Loader2, Code, Lightbulb } from 'lucide-react'

interface SkillsFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId: string
  initialData?: { resume_skill_id: string; skill_name: string }
  onSuccess: () => void
}

export default function SkillsFormDialog({
  open,
  onOpenChange,
  resumeId,
  initialData,
  onSuccess,
}: SkillsFormProps) {
  const [loading, setLoading] = useState(false)
  const [skillName, setSkillName] = useState('')

  useEffect(() => {
    if (open) {
      setSkillName(initialData?.skill_name || '')
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const isEdit = !!initialData
      const url = isEdit
        ? `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}/skills/${initialData.resume_skill_id}`
        : `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}/skills`

      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ skill_name: skillName }),
      })

      if (!res.ok) throw new Error('Failed to save skill')

      toast.success(isEdit ? 'Skill updated' : 'Skill added')
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
    <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center shadow-sm border border-success-100 dark:border-success-900/30">
            <Code className="w-6 h-6 text-success-600 dark:text-success-400" />
          </div>
          <div>
            <DialogTitle className="text-xl">
              {initialData ? 'Edit Skill' : 'Add Skill'}
            </DialogTitle>
            <DialogDescription className="text-text-tertiary">
              {initialData ? 'Update your skill' : 'Add a new skill to your resume'}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="pt-2">
        <form id="skill-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Skill Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-text-tertiary" />
              Skill Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={skillName}
              onChange={e => setSkillName(e.target.value)}
              placeholder="e.g. Python, React, Leadership"
              autoFocus
              className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-success-500/20 focus:border-success-500 
                hover:border-border-strong transition-all duration-200
                text-text-primary placeholder:text-text-muted"
            />
            <p className="text-xs text-text-tertiary mt-1.5">
              Add technical skills, tools, frameworks, or soft skills
            </p>
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
          form="skill-form"
          disabled={loading}
          className="h-11 px-6 rounded-xl bg-success-600 dark:bg-success-500 hover:bg-success-700 dark:hover:bg-success-600 text-white font-semibold shadow-lg shadow-success-500/25 dark:shadow-success-400/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {initialData ? 'Save Changes' : 'Add Skill'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
