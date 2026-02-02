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
        className={`h-12 rounded-xl border-[1.5px] flex items-center justify-center gap-2 text-[15px] font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
          value === USER_TYPES.CANDIDATE
            ? 'bg-[#3056F5] border-[#3056F5] text-white shadow-md'
            : 'bg-white border-[#E5E7EB] text-[#475569] hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'
        }`}
      >
        <User className="h-4 w-4" />
        Candidate
      </button>
      <button
        type="button"
        onClick={() => onChange('organization' as UserType)}
        disabled={disabled}
        className={`h-12 rounded-xl border-[1.5px] flex items-center justify-center gap-2 text-[15px] font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
          value === 'organization'
            ? 'bg-[#3056F5] border-[#3056F5] text-white shadow-md'
            : 'bg-white border-[#E5E7EB] text-[#475569] hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'
        }`}
      >
        <Building2 className="h-4 w-4" />
        Organization
      </button>
    </div>
  )
}
