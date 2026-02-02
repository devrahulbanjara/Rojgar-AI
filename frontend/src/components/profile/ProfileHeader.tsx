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
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg shadow-blue-500/5 overflow-hidden relative group hover:shadow-blue-500/10 transition-all duration-300">
      {/* Decorative Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-blue-500/5 opacity-50" />

      <div className="p-8 relative">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Profile Picture with Gradient Ring */}
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-2 bg-gradient-to-br from-[#3056F5]/20 to-blue-200/20 rounded-full blur-md" />
            <div className="relative p-1 bg-white rounded-full ring-1 ring-blue-100">
              <UserAvatar
                name={user.name}
                src={user.picture}
                className="w-32 h-32 text-4xl border-4 border-white shadow-sm"
              />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 flex flex-col justify-center space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">
              {profile?.full_name || user.name}
            </h1>

            {/* Professional Headline */}
            {profile?.professional_headline ? (
              <p className="text-xl font-semibold text-[#3056F5]">
                {profile.professional_headline}
              </p>
            ) : (
              <p className="text-xl text-gray-400 font-medium italic">
                Add a professional headline
              </p>
            )}

            {profile?.professional_summary && (
              <p className="text-[#475569] leading-relaxed max-w-3xl mt-2 line-clamp-2">
                {profile.professional_summary}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
