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
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      className="max-w-[480px] p-0 overflow-hidden border-none shadow-2xl"
    >
      <div className="bg-background-surface flex flex-col h-full">
        <div className="p-8 border-b border-border-subtle bg-background-surface shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-success-600/10 dark:bg-success-600/20 flex items-center justify-center border border-success-600/20 shadow-sm">
              <Code className="w-7 h-7 text-success-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-text-primary">
                {initialData ? 'Edit Skill' : 'Add Skill'}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-text-tertiary font-medium">
                {initialData
                  ? 'Update your professional skill detail'
                  : 'Highlight a key skill for your profile'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <DialogContent className="p-8">
          <form id="skill-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5" />
                Skill Name <span className="text-error-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={skillName}
                onChange={e => setSkillName(e.target.value)}
                placeholder="e.g. React, Python, Product Design"
                autoFocus
                className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-success-600/20 focus:border-success-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted"
              />
              <p className="text-[12px] text-text-tertiary font-medium mt-2">
                Use common names for better discoverability
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
              form="skill-form"
              disabled={loading}
              className="h-11 px-8 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-success-600/20 transition-all active:scale-95"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              {initialData ? 'Save Changes' : 'Add Skill'}
            </Button>
          </div>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
