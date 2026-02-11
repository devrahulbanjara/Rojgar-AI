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
import { Loader2, Award, Building2, Calendar, Link2 } from 'lucide-react'
import type { Certification } from '@/types/resume'

interface CertificationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId: string
  initialData?: Certification
  onSuccess: () => void
}

export default function CertificationFormDialog({
  open,
  onOpenChange,
  resumeId,
  initialData,
  onSuccess,
}: CertificationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    certification_name: '',
    issuing_body: '',
    issue_date: '',
    expiration_date: '',
    does_not_expire: false,
    credential_url: '',
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          certification_name: initialData.certification_name || '',
          issuing_body: initialData.issuing_body || '',
          issue_date: initialData.issue_date || '',
          expiration_date: initialData.expiration_date || '',
          does_not_expire: initialData.does_not_expire || false,
          credential_url: initialData.credential_url || '',
        })
      } else {
        setFormData({
          certification_name: '',
          issuing_body: '',
          issue_date: '',
          expiration_date: '',
          does_not_expire: false,
          credential_url: '',
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
        ? `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}/certifications/${initialData.resume_certification_id}`
        : `${API_CONFIG.baseUrl}/api/v1/candidate/resumes/${resumeId}/certifications`

      const method = isEdit ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        credential_url: formData.credential_url || null,
        issue_date: formData.issue_date || null,
        expiration_date: formData.expiration_date || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success(isEdit ? 'Certification updated' : 'Certification added')
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
            <div className="w-14 h-14 rounded-2xl bg-warning-600/10 dark:bg-warning-600/20 flex items-center justify-center border border-warning-600/20 shadow-sm">
              <Award className="w-7 h-7 text-warning-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-text-primary">
                {initialData ? 'Edit Certification' : 'Add Certification'}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-text-tertiary font-medium">
                {initialData
                  ? 'Update your professional certification details'
                  : 'Add a new certification to your profile'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <DialogContent className="p-8 overflow-y-auto">
          <form id="certification-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <Award className="w-3.5 h-3.5" />
                Certification Name <span className="text-error-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.certification_name}
                onChange={e => setFormData({ ...formData, certification_name: e.target.value })}
                placeholder="e.g. AWS Solutions Architect Associate"
                className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-warning-600/20 focus:border-warning-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                Issuing Organization <span className="text-error-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.issuing_body}
                onChange={e => setFormData({ ...formData, issuing_body: e.target.value })}
                placeholder="e.g. Amazon Web Services"
                className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-warning-600/20 focus:border-warning-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-warning-600/20 focus:border-warning-600 
                    hover:border-border-strong transition-all duration-200
                    text-text-primary font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Expiration Date
                </label>
                <input
                  type="date"
                  disabled={formData.does_not_expire}
                  value={formData.expiration_date}
                  onChange={e => setFormData({ ...formData, expiration_date: e.target.value })}
                  className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-warning-600/20 focus:border-warning-600 
                    hover:border-border-strong transition-all duration-200
                    text-text-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-muted"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 py-1">
              <Checkbox
                id="no_expire"
                checked={formData.does_not_expire}
                onCheckedChange={c => setFormData({ ...formData, does_not_expire: c as boolean })}
                className="w-5 h-5 rounded-md border-border-default data-[state=checked]:bg-warning-600 data-[state=checked]:border-warning-600 shadow-sm transition-all"
              />
              <label
                htmlFor="no_expire"
                className="text-[14px] font-semibold text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
              >
                This certification does not expire
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5" />
                Credential URL
              </label>
              <input
                type="url"
                value={formData.credential_url}
                onChange={e => setFormData({ ...formData, credential_url: e.target.value })}
                placeholder="https://..."
                className="w-full h-11 px-4 bg-background-base border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-warning-600/20 focus:border-warning-600 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary font-medium placeholder:text-text-muted"
              />
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
              form="certification-form"
              disabled={loading}
              className="h-11 px-8 rounded-xl bg-warning-600 hover:bg-warning-700 text-white font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-warning-600/20 transition-all active:scale-95"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              {initialData ? 'Save Changes' : 'Add Certification'}
            </Button>
          </div>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
