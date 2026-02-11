import React, { useState } from 'react'
import { profileService } from '../../services/profileService'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { User as UserIcon, Globe, CheckCircle2, Briefcase } from 'lucide-react'
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
    <div className="px-10 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Details Section */}
        <Section icon={<UserIcon className="w-4 h-4" />} title="Contact Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-text-secondary">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-text-secondary">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="h-11 bg-background-subtle text-text-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-text-secondary">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_city" className="text-sm font-semibold text-text-secondary">
                City
              </Label>
              <Input
                id="location_city"
                name="location_city"
                type="text"
                value={formData.location_city}
                onChange={handleChange}
                placeholder="City"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location_country"
                className="text-sm font-semibold text-text-secondary"
              >
                Country
              </Label>
              <Input
                id="location_country"
                name="location_country"
                type="text"
                value={formData.location_country}
                onChange={handleChange}
                placeholder="Country"
                className="h-11"
              />
            </div>
          </div>
        </Section>

        {/* Professional Summary Section */}
        <Section icon={<Briefcase className="w-4 h-4" />} title="Professional Summary">
          <div className="space-y-6">
            <div className="space-y-2">
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
                className="h-11"
              />
            </div>

            <div className="space-y-2">
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
                className="resize-none"
              />
            </div>
          </div>
        </Section>

        {/* Social Links Section */}
        <Section icon={<Globe className="w-4 h-4" />} title="Social Links">
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
        </Section>

        <div className="border-t border-border-default pt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded transition-all"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Updating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Update Profile
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 transition-colors pt-1">
      <div className="absolute -left-[11px] top-1 p-1 bg-white dark:bg-slate-900 border border-border-default rounded-md text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4">
        {title}
      </h4>
      <div>{children}</div>
    </div>
  )
}
