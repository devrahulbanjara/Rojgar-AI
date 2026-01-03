"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { AppShell } from "../../../components/layout/AppShell";
import { PageTransition, AnimatedContainer } from "../../../components/common";
import { ProfileHeader } from "../../../components/profile/ProfileHeader";
import { ProfileInformationTab } from "../../../components/profile/ProfileInformationTab";
import { CareerHistoryTab } from "../../../components/profile/CareerHistoryTab";
import { SkillsExpertiseTab } from "../../../components/profile/SkillsExpertiseTab";
import { PasswordChangeForm } from "../../../components/profile/PasswordChangeForm";
import { User, Briefcase, Settings, Shield } from "lucide-react";
import { profileService } from "../../../services/profileService";
import type { CandidateProfile } from "../../../types/profile";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";

export default function CandidateProfilePage() {
  const {
    user,
    isLoading: isAuthLoading,
    isAuthenticated,
    refetchUser,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "career" | "skills" | "password"
  >("profile");
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isAuthLoading]);

  const handleProfileUpdate = async (updatedProfile: CandidateProfile) => {
    setProfile(updatedProfile);
    if (refetchUser) {
      await refetchUser();
    }
  };

  if (isAuthLoading || (isAuthenticated && isLoadingProfile)) {
    return (
      <AppShell>
        <PageTransition
          className="min-h-screen"
          style={{ background: "#F9FAFB" }}
        >
          <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3056F5]"></div>
          </div>
        </PageTransition>
      </AppShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTransition
        className="min-h-screen"
        style={{ background: "#F9FAFB" }}
      >
        <div className="space-y-8 pb-12">
          {/* Enhanced Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ProfileHeader user={user} profile={profile} />
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Tab Navigation */}
            <AnimatedContainer direction="up" delay={0.2}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-1 shadow-sm">
                <div className="flex overflow-x-auto">
                  {[
                    { id: "profile", label: "Profile Information", icon: User },
                    { id: "career", label: "Career History", icon: Briefcase },
                    {
                      id: "skills",
                      label: "Skills & Expertise",
                      icon: Settings,
                    },
                    { id: "password", label: "Security", icon: Shield },
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setActiveTab(
                            tab.id as
                              | "profile"
                              | "career"
                              | "skills"
                              | "password",
                          )
                        }
                        className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                          activeTab === tab.id
                            ? "bg-[#3056F5] text-white shadow-sm"
                            : "text-[#475569] hover:bg-[#F9FAFB] hover:text-[#3056F5]"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </AnimatedContainer>

            {/* Tab Content */}
            <AnimatedContainer direction="up" delay={0.3}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
                {activeTab === "profile" && profile && (
                  <ProfileInformationTab
                    profile={profile}
                    onUpdate={handleProfileUpdate}
                  />
                )}
                {activeTab === "career" && profile && (
                  <CareerHistoryTab
                    experiences={profile.work_experiences}
                    educations={profile.educations}
                  />
                )}
                {activeTab === "skills" && profile && (
                  <SkillsExpertiseTab
                    skills={profile.skills}
                    certifications={profile.certifications}
                  />
                )}
                {activeTab === "password" && <PasswordChangeForm />}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
