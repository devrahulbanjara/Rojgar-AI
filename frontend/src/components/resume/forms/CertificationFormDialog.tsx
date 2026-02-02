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
import { Loader2, Award } from 'lucide-react'
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
        ? `${API_CONFIG.baseUrl}/api/v1/resumes/${resumeId}/certifications/${initialData.resume_certification_id}`
        : `${API_CONFIG.baseUrl}/api/v1/resumes/${resumeId}/certifications`

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <DialogTitle>{initialData ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
            <DialogDescription>
              {initialData
                ? 'Update your certification details'
                : 'Add a professional certification'}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="pt-0">
        <form id="certification-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Certification Name <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              value={formData.certification_name}
              onChange={e => setFormData({ ...formData, certification_name: e.target.value })}
              placeholder="e.g. AWS Certified Solutions Architect"
              className="h-11 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Issuing Organization <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              value={formData.issuing_body}
              onChange={e => setFormData({ ...formData, issuing_body: e.target.value })}
              placeholder="e.g. Amazon Web Services"
              className="h-11 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Issue Date</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                className="h-11 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Expiration Date</Label>
              <Input
                type="date"
                disabled={formData.does_not_expire}
                value={formData.expiration_date}
                onChange={e => setFormData({ ...formData, expiration_date: e.target.value })}
                className="h-11 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="no_expire"
              checked={formData.does_not_expire}
              onCheckedChange={c => setFormData({ ...formData, does_not_expire: c as boolean })}
              className="rounded border-gray-300"
            />
            <label htmlFor="no_expire" className="text-sm text-gray-700 cursor-pointer">
              This certification does not expire
            </label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Credential URL</Label>
            <Input
              value={formData.credential_url}
              onChange={e => setFormData({ ...formData, credential_url: e.target.value })}
              placeholder="https://..."
              className="h-11 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20"
            />
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
          form="certification-form"
          disabled={loading}
          className="rounded-xl px-6 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/25"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {initialData ? 'Save Changes' : 'Add Certification'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
