import React, { useState } from "react";
import { profileService } from "../../services/profileService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { User as UserIcon, Mail, Phone, MapPin, Globe } from "lucide-react";
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
    // Just map social links manually for now or use the first one if we want to be robust,
    // but the UI implies specific fields.
    // Ideally we should have structured these in the backend or iterate over them.
    // For now, let's assume we might need to handle them differently or just bind them to the existing UI fields
    // if the backend stores them in a list.
    // The previous frontend had specific fields. The NEW backend has a LIST of social links.
    // I will just disable the social link editing in this tab for now to avoid complexity,
    // or I can implement a "Social Links" manager later.
    // Wait, the user wants "Clean, Efficient".
    // I'll keep the UI fields but they won't work 1:1 with the list unless I do some logic.
    // Let's stick to the scalar fields first.
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
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-[#3056F5]" />
            <h4 className="text-lg font-semibold text-[#0F172A]">
              Contact Details
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-[#374151]"
              >
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-12 px-4 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-[#374151]"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full h-12 pl-10 bg-gray-50 text-gray-500 border-[#D1D5DB] rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-[#374151]"
              >
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
              <Label
                htmlFor="location_city"
                className="text-sm font-medium text-[#374151]"
              >
                City
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="location_city"
                  name="location_city"
                  type="text"
                  value={formData.location_city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full h-12 pl-10 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location_country"
                className="text-sm font-medium text-[#374151]"
              >
                Country
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="location_country"
                  name="location_country"
                  type="text"
                  value={formData.location_country}
                  onChange={handleChange}
                  placeholder="Country"
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
            <h4 className="text-lg font-semibold text-[#0F172A]">
              Professional Summary
            </h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="professional_headline"
                className="text-sm font-medium text-[#374151]"
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
                className="w-full h-12 px-4 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="professional_summary"
                className="text-sm font-medium text-[#374151]"
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
                className="w-full px-4 py-3 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200 resize-none"
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
              "Update Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
