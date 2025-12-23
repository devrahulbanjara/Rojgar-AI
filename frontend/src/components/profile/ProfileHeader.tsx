"use client";

import React from 'react';
import { Mail } from "lucide-react";
import { User } from '../../types/index';
import { CandidateProfile } from '../../types/profile';
import { UserAvatar } from '../ui/UserAvatar';

interface ProfileHeaderProps {
  user: User;
  profile?: CandidateProfile | null;
}

export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
      <div className="p-8">
        <div className="flex items-center gap-6">
          {/* Profile Picture */}
          <UserAvatar
            name={user.name}
            src={user.picture}
            className="w-24 h-24 text-3xl border-2 border-white shadow-lg"
          />

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-1">
              {profile?.full_name || user.name}
            </h1>

            {/* Professional Headline - Featured Prominently */}
            {profile?.professional_headline && (
              <p className="text-xl text-[#3056F5] font-medium mb-2">
                {profile.professional_headline}
              </p>
            )}

            <div className="flex items-center gap-2 text-[#64748B]">
              <Mail className="w-4 h-4" />
              <span className="text-base">{user.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
