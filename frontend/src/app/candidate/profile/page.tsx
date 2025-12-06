'use client';

import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { AppShell } from '../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer } from '../../../components/common';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { ProfileInformationTab } from '../../../components/profile/ProfileInformationTab';
import { CareerHistoryTab } from '../../../components/profile/CareerHistoryTab';
import { SkillsExpertiseTab } from '../../../components/profile/SkillsExpertiseTab';
import { PasswordChangeForm } from '../../../components/profile/PasswordChangeForm';
import { User, Briefcase, Settings, Shield } from 'lucide-react';

export default function CandidateProfile() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'career' | 'skills' | 'password'>('profile');

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
              <div className="animate-pulse">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-64 mb-3"></div>
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>
      </AppShell>
    );
  }

  // Show error state if no user data
  if (!isAuthenticated || !user) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
                  {!isAuthenticated ? 'Authentication Required' : 'Profile Not Found'}
                </h1>
                <p className="text-[#475569] mb-4">
                  {!isAuthenticated
                    ? 'Please log in to view your profile.'
                    : 'Unable to load your profile information. Please try refreshing the page.'
                  }
                </p>
                {!isAuthenticated && (
                  <div className="mt-4">
                    <a
                      href="/login"
                      className="inline-flex items-center px-4 py-2 bg-[#3056F5] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
                    >
                      Go to Login
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageTransition>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <div className="space-y-8">
          {/* Profile Header Card */}
          <AnimatedContainer direction="up" delay={0.1}>
            <ProfileHeader user={user} />
          </AnimatedContainer>

          {/* Tab Navigation */}
          <AnimatedContainer direction="up" delay={0.2}>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-1 shadow-sm">
              <div className="flex">
                {[
                  { id: 'profile', label: 'Profile Information', icon: User },
                  { id: 'career', label: 'Career History', icon: Briefcase },
                  { id: 'skills', label: 'Skills & Expertise', icon: Settings },
                  { id: 'password', label: 'Security', icon: Shield }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-[#3056F5] text-white shadow-sm'
                          : 'text-[#475569] hover:bg-[#F9FAFB] hover:text-[#3056F5]'
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
              {activeTab === 'profile' && <ProfileInformationTab user={user} />}
              {activeTab === 'career' && <CareerHistoryTab />}
              {activeTab === 'skills' && <SkillsExpertiseTab />}
              {activeTab === 'password' && <PasswordChangeForm />}
            </div>
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  );
}
