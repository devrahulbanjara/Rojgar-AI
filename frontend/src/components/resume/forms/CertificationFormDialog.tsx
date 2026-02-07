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
import { Loader2, Award, Building2, Calendar, Link2 } from 'lucide-react'
import type { ResumeCertificationResponse } from '@/types/resume'

interface CertificationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId: string
  initialData?: ResumeCertificationResponse
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
    <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="max-w-xl">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-950/30 flex items-center justify-center shadow-sm border border-warning-100 dark:border-warning-900/30">
            <Award className="w-6 h-6 text-warning-600 dark:text-warning-400" />
          </div>
          <div>
            <DialogTitle className="text-xl">
              {initialData ? 'Edit Certification' : 'Add Certification'}
            </DialogTitle>
            <DialogDescription className="text-text-tertiary">
              {initialData
                ? 'Update your certification details'
                : 'Add a professional certification'}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="pt-2">
        <form id="certification-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Certification Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <Award className="w-4 h-4 text-text-tertiary" />
              Certification Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.certification_name}
              onChange={e => setFormData({ ...formData, certification_name: e.target.value })}
              placeholder="e.g. AWS Certified Solutions Architect"
              className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500 
                hover:border-border-strong transition-all duration-200
                text-text-primary placeholder:text-text-muted"
            />
          </div>

          {/* Issuing Organization */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-text-tertiary" />
              Issuing Organization <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.issuing_body}
              onChange={e => setFormData({ ...formData, issuing_body: e.target.value })}
              placeholder="e.g. Amazon Web Services"
              className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500 
                hover:border-border-strong transition-all duration-200
                text-text-primary placeholder:text-text-muted"
            />
          </div>

          {/* Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                Issue Date
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                Expiration Date
              </label>
              <input
                type="date"
                disabled={formData.does_not_expire}
                value={formData.expiration_date}
                onChange={e => setFormData({ ...formData, expiration_date: e.target.value })}
                className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500 
                  hover:border-border-strong transition-all duration-200
                  text-text-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-muted"
              />
            </div>
          </div>

          {/* Does Not Expire Checkbox */}
          <div className="flex items-center gap-3 pt-1">
            <Checkbox
              id="no_expire"
              checked={formData.does_not_expire}
              onCheckedChange={c => setFormData({ ...formData, does_not_expire: c as boolean })}
            />
            <label
              htmlFor="no_expire"
              className="text-sm font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
            >
              This certification does not expire
            </label>
          </div>

          {/* Credential URL */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-text-tertiary" />
              Credential URL
            </label>
            <input
              type="url"
              value={formData.credential_url}
              onChange={e => setFormData({ ...formData, credential_url: e.target.value })}
              placeholder="https://..."
              className="w-full h-12 px-4 bg-background-subtle border border-border-default rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500 
                hover:border-border-strong transition-all duration-200
                text-text-primary placeholder:text-text-muted"
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
          form="certification-form"
          disabled={loading}
          className="h-11 px-6 rounded-xl bg-warning-600 dark:bg-warning-500 hover:bg-warning-700 dark:hover:bg-warning-600 text-white font-semibold shadow-lg shadow-warning-500/25 dark:shadow-warning-400/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {initialData ? 'Save Changes' : 'Add Certification'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
