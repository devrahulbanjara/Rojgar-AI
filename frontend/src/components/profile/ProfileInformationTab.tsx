import React, { useState, useEffect } from 'react';
import { User } from '../../types/index';
import { profileService } from '../../services/profileService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { User as UserIcon, Mail, Phone, MapPin, Linkedin, Github, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import type { Profile, ProfileUpdateRequest } from '../../types/profile';

interface ProfileInformationTabProps {
  user: User;
}

export function ProfileInformationTab({ user }: ProfileInformationTabProps) {
  const { refetchUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location_city: '',
    location_country: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    professional_headline: '',
    professional_summary: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      setFormData({
        name: profileData.user_name || user.name || '',
        phone: profileData.phone || '',
        location_city: profileData.location_city || '',
        location_country: profileData.location_country || '',
        linkedin_url: profileData.linkedin_url || '',
        github_url: profileData.github_url || '',
        portfolio_url: profileData.portfolio_url || '',
        professional_headline: profileData.professional_headline || '',
        professional_summary: profileData.professional_summary || '',
      });
    } catch (error: any) {
      // If profile doesn't exist, create it with basic info
      if (error.status === 404) {
        try {
          const newProfile = await profileService.createProfile({
            full_name: user.name || '',
            email: user.email,
          });
          setProfile(newProfile);
          setFormData({
            full_name: newProfile.full_name || '',
            phone: newProfile.phone || '',
            location_city: newProfile.location_city || '',
            location_country: newProfile.location_country || '',
            linkedin_url: newProfile.linkedin_url || '',
            github_url: newProfile.github_url || '',
            portfolio_url: newProfile.portfolio_url || '',
            professional_headline: newProfile.professional_headline || '',
            professional_summary: newProfile.professional_summary || '',
          });
        } catch (createError: any) {
          setMessage({
            type: 'error',
            text: 'Failed to create profile. Please try again.'
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to load profile. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updateData: ProfileUpdateRequest = {
        name: formData.name,
        phone: formData.phone || undefined,
        location_city: formData.location_city || undefined,
        location_country: formData.location_country || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        github_url: formData.github_url || undefined,
        portfolio_url: formData.portfolio_url || undefined,
        professional_headline: formData.professional_headline || undefined,
        professional_summary: formData.professional_summary || undefined,
      };

      const updatedProfile = await profileService.updateProfile(updateData);
      setProfile(updatedProfile);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      refetchUser?.();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
          Profile Information
        </h3>
        <p className="text-[#475569]">
          Manage your personal information and professional identity.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Details Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-[#3056F5]" />
            <h4 className="text-lg font-semibold text-[#0F172A]">Contact Details</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-[#374151]">
                Full Name *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full h-12 px-4 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#374151]">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-12 pl-10 bg-gray-50 text-gray-500 border-[#D1D5DB] rounded-xl"
                />
              </div>
              <p className="text-xs text-[#6B7280] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-[#374151]">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full h-12 pl-10 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_city" className="text-sm font-medium text-[#374151]">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="location_city"
                  name="location_city"
                  type="text"
                  value={formData.location_city}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="w-full h-12 pl-10 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Links Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-[#3056F5]" />
            <h4 className="text-lg font-semibold text-[#0F172A]">Professional Links</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url" className="text-sm font-medium text-[#374151]">
                LinkedIn
              </Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourname"
                  className="w-full h-12 pl-10 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_url" className="text-sm font-medium text-[#374151]">
                GitHub
              </Label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="github_url"
                  name="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={handleChange}
                  placeholder="https://github.com/yourname"
                  className="w-full h-12 pl-10 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio_url" className="text-sm font-medium text-[#374151]">
                Portfolio
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="portfolio_url"
                  name="portfolio_url"
                  type="url"
                  value={formData.portfolio_url}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                  className="w-full h-12 pl-10 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Summary Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-[#3056F5]" />
            <h4 className="text-lg font-semibold text-[#0F172A]">Professional Summary</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="professional_headline" className="text-sm font-medium text-[#374151]">
                Professional Headline
              </Label>
              <Input
                id="professional_headline"
                name="professional_headline"
                type="text"
                value={formData.professional_headline}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer"
                className="w-full h-12 px-4 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professional_summary" className="text-sm font-medium text-[#374151]">
                Professional Summary
              </Label>
              <Textarea
                id="professional_summary"
                name="professional_summary"
                value={formData.professional_summary}
                onChange={handleChange}
                placeholder="Write a brief summary of your professional background and expertise..."
                rows={4}
                className="w-full px-4 py-3 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200 resize-none"
              />
              <p className="text-xs text-[#6B7280]">
                This will be your default summary for all resumes. You can customize it for specific resumes later.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
          <Button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-[#3056F5] hover:bg-[#1E40AF] text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
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
  );
}
