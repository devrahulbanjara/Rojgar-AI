'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer } from '../../../components/common'
import { ProfileHeader } from '../../../components/profile/ProfileHeader'
import { ProfileInformationTab } from '../../../components/profile/ProfileInformationTab'
import { CareerHistoryTab } from '../../../components/profile/CareerHistoryTab'
import { SkillsExpertiseTab } from '../../../components/profile/SkillsExpertiseTab'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui'
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
  const [activeTab, setActiveTab] = useState<'profile' | 'career' | 'skills'>('profile')
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
      window.location.href = '/signin'
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
            <AnimatedContainer direction="up" delay={0.1}>
              <SkeletonProfileHeader />
            </AnimatedContainer>

            <AnimatedContainer direction="up" delay={0.2}>
              <SkeletonProfileTab />
            </AnimatedContainer>

            <AnimatedContainer direction="up" delay={0.3}>
              <SkeletonProfileForm />
            </AnimatedContainer>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6">
          <AnimatedContainer direction="up" delay={0.1}>
            <ProfileHeader user={user} profile={profile} />
          </AnimatedContainer>

          <div className="space-y-8">
            <AnimatedContainer direction="up" delay={0.2}>
              <Tabs
                value={activeTab}
                onValueChange={value => setActiveTab(value as 'profile' | 'career' | 'skills')}
                className="w-full"
              >
                <TabsList className="bg-transparent border-b border-border-subtle rounded-none w-full justify-start h-auto p-0 gap-8">
                  <TabsTrigger
                    value="profile"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-3 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                  >
                    Profile Information
                  </TabsTrigger>
                  <TabsTrigger
                    value="career"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-3 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                  >
                    Career History
                  </TabsTrigger>
                  <TabsTrigger
                    value="skills"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-3 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                  >
                    Skills & Expertise
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </AnimatedContainer>

            <AnimatedContainer direction="up" delay={0.3}>
              <div className="bg-background-surface rounded-[5px] border border-border-default">
                {profile && (
                  <>
                    <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
                      <ProfileInformationTab profile={profile} onUpdate={handleProfileUpdate} />
                    </div>
                    <div className={activeTab === 'career' ? 'block' : 'hidden'}>
                      <CareerHistoryTab
                        experiences={profile.work_experiences}
                        educations={profile.educations}
                      />
                    </div>
                    <div className={activeTab === 'skills' ? 'block' : 'hidden'}>
                      <SkillsExpertiseTab
                        skills={profile.skills}
                        certifications={profile.certifications}
                      />
                    </div>
                  </>
                )}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
