import React, { useState } from "react";
import { profileService } from "../../services/profileService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { User as UserIcon, Mail, Phone, MapPin, Globe, CheckCircle2 } from "lucide-react";
import type {
  CandidateProfile,
  CandidateProfileUpdate,
} from "../../types/profile";
import { toast } from "sonner";
import { SocialLinksSection } from "./SocialLinksSection";

interface ProfileInformationTabProps {
  profile: CandidateProfile;
  onUpdate: (profile: CandidateProfile) => void;
}

export function ProfileInformationTab({
  profile,
  onUpdate,
}: ProfileInformationTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: profile.full_name || "",
    phone: profile.phone || "",
    location_city: profile.location_city || "",
    location_country: profile.location_country || "",
    professional_headline: profile.professional_headline || "",
    professional_summary: profile.professional_summary || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updateData: CandidateProfileUpdate = {
        full_name: formData.name,
        phone: formData.phone || undefined,
        location_city: formData.location_city || undefined,
        location_country: formData.location_country || undefined,
        professional_headline: formData.professional_headline || undefined,
        professional_summary: formData.professional_summary || undefined,
      };

      const updatedProfile = await profileService.updateProfile(updateData);
      onUpdate(updatedProfile);
      toast.success("Profile updated successfully!");
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(
        error.response?.data?.detail ||
        "Failed to update profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Details Section */}
        <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#0F172A]">
                Contact Details
              </h4>
              <p className="text-sm text-[#64748B]">
                Your basic contact information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-[#374151]"
              >
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-12 px-4 border-[#E2E8F0] bg-gray-50/50 focus:bg-white focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10 rounded-xl transition-all duration-200 font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-[#374151]"
              >
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors duration-200">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full h-12 pl-14 bg-gray-50 text-gray-500 border-[#E2E8F0] rounded-xl font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="phone"
                className="text-sm font-semibold text-[#374151]"
              >
                Phone Number
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors duration-200">
                  <Phone className="w-4 h-4" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full h-12 pl-14 border-[#E2E8F0] bg-gray-50/50 focus:bg-white focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10 rounded-xl transition-all duration-200 font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="location_city"
                className="text-sm font-semibold text-[#374151]"
              >
                City
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors duration-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <Input
                  id="location_city"
                  name="location_city"
                  type="text"
                  value={formData.location_city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full h-12 pl-14 border-[#E2E8F0] bg-gray-50/50 focus:bg-white focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10 rounded-xl transition-all duration-200 font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="location_country"
                className="text-sm font-semibold text-[#374151]"
              >
                Country
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors duration-200">
                  <Globe className="w-4 h-4" />
                </div>
                <Input
                  id="location_country"
                  name="location_country"
                  type="text"
                  value={formData.location_country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="w-full h-12 pl-14 border-[#E2E8F0] bg-gray-50/50 focus:bg-white focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10 rounded-xl transition-all duration-200 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Summary Section */}
        <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#0F172A]">
                Professional Summary
              </h4>
              <p className="text-sm text-[#64748B]">
                Highlight your professional background
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="professional_headline"
                className="text-sm font-semibold text-[#374151]"
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
                className="w-full h-12 px-4 border-[#E2E8F0] bg-gray-50/50 focus:bg-white focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10 rounded-xl transition-all duration-200 font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="professional_summary"
                className="text-sm font-semibold text-[#374151]"
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
                className="w-full px-4 py-3 border-[#E2E8F0] bg-gray-50/50 focus:bg-white focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10 rounded-xl transition-all duration-200 resize-none font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <SocialLinksSection
          socialLinks={profile.social_links}
          onUpdate={async () => {
            try {
              const updatedProfile = await profileService.getProfile();
              onUpdate(updatedProfile);
            } catch (error) {
              console.error("Failed to refresh profile:", error);
            }
          }}
        />

        <div className="flex justify-end pt-6 border-t border-[#E5E7EB]">
          <Button
            type="submit"
            disabled={isSaving}
            className="px-8 py-4 bg-gradient-to-r from-[#3056F5] to-[#6366F1] hover:from-[#2541B2] hover:to-[#4F46E5] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
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
  );
}
