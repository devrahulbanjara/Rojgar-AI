'use client'

import React, { useEffect, useState } from 'react'
import { User, Mail, Lock, Plus, Save } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'

export interface RecruiterFormData {
  name: string
  email: string
  password?: string
}

interface RecruiterModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RecruiterFormData) => void
  initialData?: RecruiterFormData
  mode: 'add' | 'edit'
}

export function RecruiterModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: RecruiterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    if (isOpen && initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
      })
    } else if (isOpen && mode === 'add') {
      setFormData({
        name: '',
        email: '',
        password: '',
      })
    }
  }, [isOpen, initialData, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-md mx-4 rounded-[20px]">
      <div className="flex flex-col bg-background-surface rounded-[20px] overflow-hidden">
        {}
        <DialogHeader className="bg-gradient-to-b from-background-subtle/80 to-background-surface px-8 py-8 border-b border-border-subtle">
          <DialogTitle className="text-2xl font-bold text-text-primary leading-tight">
            {mode === 'add' ? 'Add Recruiter' : 'Edit Recruiter'}
          </DialogTitle>
          <DialogDescription className="text-text-tertiary mt-2 text-sm font-medium">
            {mode === 'add'
              ? 'Enter details to add a new recruiter to your team.'
              : 'Update recruiter information and access details.'}
          </DialogDescription>
        </DialogHeader>

        {}
        <form onSubmit={handleSubmit}>
          <DialogContent className="p-8 space-y-6 bg-background-surface">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary placeholder:text-text-muted"
                  placeholder="e.g. Sarah Wilson"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary placeholder:text-text-muted"
                  placeholder="e.g. sarah@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  required={mode === 'add'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary placeholder:text-text-muted"
                  placeholder={mode === 'edit' ? 'Leave blank to keep current' : 'Enter password'}
                />
              </div>
            </div>
          </DialogContent>

          {}
          <DialogFooter className="border-t border-border-subtle bg-background-subtle/50 px-8 py-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-6 text-sm font-semibold border-border-default hover:bg-background-surface hover:border-border-strong transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 px-6 text-sm font-semibold bg-primary hover:bg-primary-hover text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {mode === 'add' ? (
                <>
                  <Plus className="w-4 h-4" />
                  Add Recruiter
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  )
}
