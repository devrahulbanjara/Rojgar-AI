import React, { useState } from 'react'
import { profileService } from '../../services/profileService'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { User as UserIcon, Mail, Phone, MapPin, Globe, CheckCircle2 } from 'lucide-react'
import type { CandidateProfile, CandidateProfileUpdate } from '../../types/profile'
import { toast } from 'sonner'
import { SocialLinksSection } from './SocialLinksSection'

interface ProfileInformationTabProps {
  profile: CandidateProfile
  onUpdate: (profile: CandidateProfile) => void
}

export function ProfileInformationTab({ profile, onUpdate }: ProfileInformationTabProps) {
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: profile.full_name || '',
    phone: profile.phone || '',
    location_city: profile.location_city || '',
    location_country: profile.location_country || '',
    professional_headline: profile.professional_headline || '',
    professional_summary: profile.professional_summary || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const updateData: CandidateProfileUpdate = {
        full_name: formData.name,
        phone: formData.phone || undefined,
        location_city: formData.location_city || undefined,
        location_country: formData.location_country || undefined,
        professional_headline: formData.professional_headline || undefined,
        professional_summary: formData.professional_summary || undefined,
      }

      const updatedProfile = await profileService.updateProfile(updateData)
      onUpdate(updatedProfile)
      toast.success('Profile updated successfully!')
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-text-primary mb-2">Profile Information</h3>
        <p className="text-text-secondary">
          Manage your personal information and professional identity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Details Section */}
        <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm border border-primary-200 dark:border-primary-800">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-text-primary">Contact Details</h4>
              <p className="text-sm text-text-tertiary">Your basic contact information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-text-secondary">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-12 px-4 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all duration-200 font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-text-secondary">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-background-subtle flex items-center justify-center text-text-muted group-hover:bg-primary-50 dark:group-hover:bg-primary-950/30 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-200">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full h-12 pl-14 bg-background-subtle text-text-muted border-border-default rounded-xl font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-sm font-semibold text-text-secondary">
                Phone Number
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-background-subtle flex items-center justify-center text-text-muted group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-950/30 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200">
                  <Phone className="w-4 h-4" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full h-12 pl-14 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all duration-200 font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="location_city" className="text-sm font-semibold text-text-secondary">
                City
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-background-subtle flex items-center justify-center text-text-muted group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-950/30 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <Input
                  id="location_city"
                  name="location_city"
                  type="text"
                  value={formData.location_city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full h-12 pl-14 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all duration-200 font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="location_country"
                className="text-sm font-semibold text-text-secondary"
              >
                Country
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-background-subtle flex items-center justify-center text-text-muted group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-950/30 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200">
                  <Globe className="w-4 h-4" />
                </div>
                <Input
                  id="location_country"
                  name="location_country"
                  type="text"
                  value={formData.location_country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="w-full h-12 pl-14 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all duration-200 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Summary Section */}
        <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
            <div className="w-12 h-12 rounded-xl bg-ai-50 dark:bg-ai-950/30 flex items-center justify-center text-ai-600 dark:text-ai-400 shadow-sm border border-ai-200 dark:border-ai-800">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-text-primary">Professional Summary</h4>
              <p className="text-sm text-text-tertiary">Highlight your professional background</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="professional_headline"
                className="text-sm font-semibold text-text-secondary"
              >
                Professional Headline
              </Label>
              <Input
                id="professional_headline"
                name="professional_headline"
                type="text"
                value={formData.professional_headline}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer"
                className="w-full h-12 px-4 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all duration-200 font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="professional_summary"
                className="text-sm font-semibold text-text-secondary"
              >
                Professional Summary
              </Label>
              <Textarea
                id="professional_summary"
                name="professional_summary"
                value={formData.professional_summary}
                onChange={handleChange}
                placeholder="Write a brief summary of your professional background and expertise..."
                rows={4}
                className="w-full px-4 py-3 border-border-default bg-background-subtle/50 focus:bg-background-surface focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all duration-200 resize-none font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <SocialLinksSection
          socialLinks={profile.social_links}
          onUpdate={async () => {
            try {
              const updatedProfile = await profileService.getProfile()
              onUpdate(updatedProfile)
            } catch (error) {
              console.error('Failed to refresh profile:', error)
            }
          }}
        />

        <div className="flex justify-end pt-6 border-t border-border-default">
          <Button
            type="submit"
            disabled={isSaving}
            className="px-8 py-4 bg-gradient-primary hover:bg-gradient-primary-hover text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary hover:shadow-primary disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Updating Profile...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Update Profile
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
