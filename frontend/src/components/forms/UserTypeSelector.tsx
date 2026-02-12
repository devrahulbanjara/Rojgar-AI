import React from 'react'
import { Building2, User } from 'lucide-react'
import type { UserType } from '../../types'
import { USER_TYPES } from '../../config/constants'

interface UserTypeSelectorProps {
  value: UserType
  onChange: (userType: UserType) => void
  disabled?: boolean
  className?: string
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(USER_TYPES.CANDIDATE as UserType)}
        disabled={disabled}
        className={`h-12 rounded-[5px] border-[1.5px] flex items-center justify-center gap-2 text-[15px] font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
          value === USER_TYPES.CANDIDATE
            ? 'bg-primary border-primary text-primary-foreground shadow-md'
            : 'bg-background-surface border-border-default text-text-secondary hover:border-border-strong hover:bg-background-subtle'
        }`}
      >
        <User className="h-4 w-4" />
        Candidate
      </button>
      <button
        type="button"
        onClick={() => onChange('organization' as UserType)}
        disabled={disabled}
        className={`h-12 rounded-[5px] border-[1.5px] flex items-center justify-center gap-2 text-[15px] font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
          value === 'organization'
            ? 'bg-primary border-primary text-primary-foreground shadow-md'
            : 'bg-background-surface border-border-default text-text-secondary hover:border-border-strong hover:bg-background-subtle'
        }`}
      >
        <Building2 className="h-4 w-4" />
        Organization
      </button>
    </div>
  )
}
