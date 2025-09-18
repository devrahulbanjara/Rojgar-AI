/**
 * User Type Selector Component
 * Reusable component for selecting user type (recruiter/candidate)
 */

import React from 'react';
import { Building2, User } from 'lucide-react';
import { Label } from '../ui/label';
import type { UserType } from '../../types';
import { USER_TYPES } from '../../config/constants';

interface UserTypeSelectorProps {
  value: UserType;
  onChange: (userType: UserType) => void;
  className?: string;
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>I am a</Label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(USER_TYPES.RECRUITER as UserType)}
          className={`p-3 rounded-lg border transition-all ${
            value === USER_TYPES.RECRUITER
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          <Building2 className="h-5 w-5 mx-auto mb-1" />
          <span className="text-sm font-medium">Recruiter</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(USER_TYPES.CANDIDATE as UserType)}
          className={`p-3 rounded-lg border transition-all ${
            value === USER_TYPES.CANDIDATE
              ? 'border-accent bg-accent/10 text-accent' 
              : 'border-border hover:border-accent/50'
          }`}
        >
          <User className="h-5 w-5 mx-auto mb-1" />
          <span className="text-sm font-medium">Candidate</span>
        </button>
      </div>
    </div>
  );
};
