import React, { useState } from 'react'
import { apiClient } from '../../lib/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { Shield, Lock, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'

export function PasswordChangeForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      await apiClient.put('/api/v1/users/password', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      })

      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to change password. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-text-primary mb-2">Change Password</h3>
        <p className="text-text-secondary">Update your password to keep your account secure.</p>
      </div>

      {message && (
        <div
          className={`mb-8 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success'
              ? 'bg-success-50 text-success-700 border-success-200'
              : 'bg-error-50 text-error-700 border-error-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {}
        <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
            <div className="w-12 h-12 rounded-xl bg-error-50 flex items-center justify-center text-error-600 shadow-sm border border-error-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-text-primary">Password Security</h4>
              <p className="text-sm text-text-tertiary">Ensure your account stays protected</p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div className="space-y-3">
              <Label
                htmlFor="currentPassword"
                className="text-sm font-semibold text-text-secondary"
              >
                Current Password
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-background-subtle flex items-center justify-center text-text-muted group-focus-within:bg-error-50 group-focus-within:text-error-500 transition-colors duration-200">
                  <KeyRound className="w-4 h-4" />
                </div>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  className={`w-full h-12 pl-14 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-error-500 focus:ring-4 focus:ring-error-500/10 rounded-xl transition-all duration-200 font-medium ${
                    errors.currentPassword
                      ? 'border-error-300 focus:border-error-500 focus:ring-error-500/10'
                      : ''
                  }`}
                  required
                />
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-error-600 flex items-center gap-1 animate-in slide-in-from-left-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="newPassword" className="text-sm font-semibold text-text-secondary">
                New Password
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-background-subtle flex items-center justify-center text-text-muted group-focus-within:bg-error-50 group-focus-within:text-error-500 transition-colors duration-200">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  className={`w-full h-12 pl-14 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-error-500 focus:ring-4 focus:ring-error-500/10 rounded-xl transition-all duration-200 font-medium ${
                    errors.newPassword
                      ? 'border-error-300 focus:border-error-500 focus:ring-error-500/10'
                      : ''
                  }`}
                  required
                />
              </div>
              {errors.newPassword && (
                <p className="text-sm text-error-600 flex items-center gap-1 animate-in slide-in-from-left-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.newPassword}
                </p>
              )}
              <p className="text-xs text-text-tertiary flex items-center gap-1.5 ml-1">
                <Shield className="w-3 h-3" />
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-semibold text-text-secondary"
              >
                Confirm New Password
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-background-subtle flex items-center justify-center text-text-muted group-focus-within:bg-error-50 group-focus-within:text-error-500 transition-colors duration-200">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  className={`w-full h-12 pl-14 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-error-500 focus:ring-4 focus:ring-error-500/10 rounded-xl transition-all duration-200 font-medium ${
                    errors.confirmPassword
                      ? 'border-error-300 focus:border-error-500 focus:ring-error-500/10'
                      : ''
                  }`}
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-error-600 flex items-center gap-1 animate-in slide-in-from-left-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border-default">
          <Button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-primary hover:bg-gradient-primary-hover text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary hover:shadow-primary disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Changing Password...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Change Password
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
