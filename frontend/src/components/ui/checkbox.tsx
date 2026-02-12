import React from 'react'
import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          onChange={e => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'h-5 w-5 shrink-0 rounded-md border-2 border-border-strong bg-background-surface',
            'flex items-center justify-center',
            'transition-all duration-200 ease-out',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'peer-checked:bg-primary peer-checked:border-primary',
            'hover:border-primary/60 peer-checked:hover:bg-primary-600',
            className
          )}
        >
          <Check
            className={cn(
              'h-3.5 w-3.5 text-white transition-all duration-200',
              checked ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            )}
            strokeWidth={3}
          />
        </div>
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'
