'use client'

import React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

interface SelectDropdownProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder: string
  disabled?: boolean
  className?: string
}

export function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
}: SelectDropdownProps) {
  const selectedOption = options.find(option => option.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'w-full h-12 pl-4 pr-10 py-3 border rounded-xl bg-background-surface text-left focus:outline-none text-base text-text-primary transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between',
            disabled
              ? 'opacity-50 cursor-not-allowed border-border-default'
              : 'border-border-default hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-primary-50/30 hover:shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            className
          )}
        >
          <span
            className={cn(selectedOption ? 'font-medium text-text-primary' : 'text-text-tertiary')}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] z-[9999]"
        sideOffset={5}
      >
        {options.map(option => (
          <DropdownMenuItem
            key={option.value}
            disabled={option.disabled}
            onClick={() => !option.disabled && onChange(option.value)}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="font-medium">{option.label}</span>
            {value === option.value && <Check className="w-4 h-4 text-primary-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
