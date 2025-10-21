import React from 'react';
import { User } from '../../types/index';
import { User as UserIcon, Mail } from 'lucide-react';

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
      <div className="p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="w-24 h-24 bg-gradient-to-br from-[#3056F5] to-[#1E40AF] rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user.name)
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
                {user.name}
              </h1>
              
              <div className="flex items-center gap-2 text-[#475569] mb-3">
                <Mail className="w-4 h-4" />
                <span className="text-lg">{user.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#3056F5]/10 text-[#3056F5] rounded-full text-sm font-medium">
                  <UserIcon className="w-4 h-4" />
                  {user.role === 'candidate' ? 'Candidate' : 'Recruiter'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
