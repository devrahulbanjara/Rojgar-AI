'use client'

import React from 'react'
import { User } from '../../types/index'
import { CandidateProfile } from '../../types/profile'
import { UserAvatar } from '../ui/UserAvatar'

interface ProfileHeaderProps {
  user: User
  profile?: CandidateProfile | null
}

export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  return (
    <div className="bg-background-surface rounded-2xl border border-border-default shadow-lg shadow-primary/5 overflow-hidden relative group hover:shadow-primary/10 transition-all duration-300">
      {}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-500/5 via-ai-500/5 to-primary-500/5 opacity-50" />

      <div className="p-8 relative">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {}
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-primary-200/20 rounded-full blur-md" />
            <div className="relative p-1 bg-background-surface rounded-full ring-1 ring-primary-100">
              <UserAvatar
                name={user.name}
                src={user.picture}
                className="w-32 h-32 text-4xl border-4 border-white shadow-sm"
              />
            </div>
          </div>

          {}
          <div className="flex-1 flex flex-col justify-center space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">
              {profile?.full_name || user.name}
            </h1>

            {}
            {profile?.professional_headline ? (
              <p className="text-xl font-semibold text-primary">{profile.professional_headline}</p>
            ) : (
              <p className="text-xl text-text-muted font-medium italic">
                Add a professional headline
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
