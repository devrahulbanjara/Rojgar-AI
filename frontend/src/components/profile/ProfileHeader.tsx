'use client'

import React from 'react'
import { User } from '../../types/index'
import { CandidateProfile } from '../../types/profile'
import { UserAvatar } from '../ui/UserAvatar'
import { Badge } from '../ui/badge'
import { MapPin, Mail } from 'lucide-react'

interface ProfileHeaderProps {
  user: User
  profile?: CandidateProfile | null
}

export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  return (
    <div className="bg-background-surface rounded-[5px] border border-border-default overflow-hidden">
      <div className="px-10 py-8">
        <div className="flex items-start gap-6">
          <UserAvatar
            name={user.name}
            src={user.picture}
            className="w-24 h-24 text-3xl flex-shrink-0"
          />
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                {profile?.full_name || user.name}
              </h1>
              {profile?.professional_headline && (
                <p className="text-text-secondary font-medium mt-1">
                  {profile.professional_headline}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {profile?.location_city && profile?.location_country && (
                <Badge
                  variant="secondary"
                  className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  {profile.location_city}, {profile.location_country}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                {profile?.email || user.email}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
