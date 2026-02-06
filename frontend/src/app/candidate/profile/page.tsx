'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer } from '../../../components/common'
import { ProfileHeader } from '../../../components/profile/ProfileHeader'
import { ProfileInformationTab } from '../../../components/profile/ProfileInformationTab'
import { CareerHistoryTab } from '../../../components/profile/CareerHistoryTab'
import { SkillsExpertiseTab } from '../../../components/profile/SkillsExpertiseTab'
import { PasswordChangeForm } from '../../../components/profile/PasswordChangeForm'
import { User, Briefcase, Settings, Shield } from 'lucide-react'
import { profileService } from '../../../services/profileService'
import type { CandidateProfile } from '../../../types/profile'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import {
  SkeletonProfileHeader,
  SkeletonProfileTab,
  SkeletonProfileForm,
} from '../../../components/common/SkeletonLoader'

export default function CandidateProfilePage() {
  const { user, isLoading: isAuthLoading, isAuthenticated, refetchUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'career' | 'skills' | 'password'>(
    'profile'
  )
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const data = await profileService.getProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to fetch profile', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isAuthLoading])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        fetchProfile()
        if (refetchUser) {
          refetchUser()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [refetchUser])

  const handleProfileUpdate = async (updatedProfile: CandidateProfile) => {
    setProfile(updatedProfile)
    if (refetchUser) {
      await refetchUser()
    }
  }

  if (isAuthLoading || (isAuthenticated && isLoadingProfile)) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen bg-background-subtle">
          <div className="space-y-8 pb-12">
            {/* Skeleton Header */}
            <AnimatedContainer direction="up" delay={0.1}>
              <div className="relative py-12 bg-gradient-to-b from-primary-50/50 dark:from-primary-950/30 to-background-surface border-b border-primary-50/50 dark:border-primary-900/30 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <SkeletonProfileHeader />
                </div>
              </div>
            </AnimatedContainer>

            {/* Main Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              {/* Skeleton Tab Navigation */}
              <AnimatedContainer direction="up" delay={0.2}>
                <SkeletonProfileTab />
              </AnimatedContainer>

              {/* Skeleton Tab Content */}
              <AnimatedContainer direction="up" delay={0.3}>
                <SkeletonProfileForm />
              </AnimatedContainer>
            </div>
          </div>
        </PageTransition>
      </AppShell>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="space-y-8 pb-12">
          {/* Enhanced Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-primary-50/50 dark:from-primary-950/30 to-background-surface border-b border-primary-50/50 dark:border-primary-900/30 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <ProfileHeader user={user} profile={profile} />
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Tab Navigation */}
            <AnimatedContainer direction="up" delay={0.2}>
              <div className="bg-background-surface rounded-2xl border border-border-default p-1 shadow-sm">
                <div className="flex overflow-x-auto">
                  {[
                    { id: 'profile', label: 'Profile Information', icon: User },
                    { id: 'career', label: 'Career History', icon: Briefcase },
                    {
                      id: 'skills',
                      label: 'Skills & Expertise',
                      icon: Settings,
                    },
                    { id: 'password', label: 'Security', icon: Shield },
                  ].map(tab => {
                    const IconComponent = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setActiveTab(tab.id as 'profile' | 'career' | 'skills' | 'password')
                        }
                        className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-text-secondary hover:bg-background-subtle hover:text-primary-600 dark:hover:text-primary-400'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </AnimatedContainer>

            {/* Tab Content */}
            <AnimatedContainer direction="up" delay={0.3}>
              <div className="bg-background-surface rounded-2xl border border-border-default shadow-sm">
                {activeTab === 'profile' && profile && (
                  <ProfileInformationTab profile={profile} onUpdate={handleProfileUpdate} />
                )}
                {activeTab === 'career' && profile && (
                  <CareerHistoryTab
                    experiences={profile.work_experiences}
                    educations={profile.educations}
                  />
                )}
                {activeTab === 'skills' && profile && (
                  <SkillsExpertiseTab
                    skills={profile.skills}
                    certifications={profile.certifications}
                  />
                )}
                {activeTab === 'password' && <PasswordChangeForm />}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
