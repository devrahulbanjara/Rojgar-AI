import React, { useState } from 'react'
import { User } from '../../types/index'
import { apiClient } from '../../lib/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import { User as UserIcon, Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { refetchUser } = useAuth()
  const [formData, setFormData] = useState({
    name: user.name || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      await apiClient.put('/api/v1/users/profile', {
        name: formData.name,
      })

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      refetchUser?.()
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to update profile. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-text-primary mb-2">Profile Information</h3>
        <p className="text-text-secondary">Update your personal information and profile details.</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
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
        <div className="bg-background-subtle rounded-xl p-6 border border-border-default">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-semibold text-text-primary">Contact Details</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-text-secondary">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full h-12 px-4 border-border-default focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-text-secondary">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-12 pl-10 bg-background-subtle text-text-muted border-border-default rounded-xl"
                />
              </div>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border-default">
          <Button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-primary hover:bg-primary-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Updating Profile...
              </div>
            ) : (
              'Update Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
