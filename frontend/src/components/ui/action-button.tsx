'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const actionButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white border-none hover:bg-primary-700 dark:hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm shadow-sm',
        secondary:
          'bg-white dark:bg-background-surface text-primary border-2 border-primary hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white hover:shadow-md',
        outline:
          'bg-transparent border-2 border-border-default text-text-primary hover:bg-background-subtle hover:border-border-strong dark:hover:bg-background-muted',
        ghost:
          'bg-transparent text-text-primary hover:bg-background-subtle dark:hover:bg-background-muted',
        destructive:
          'bg-error text-white hover:bg-error-600 dark:hover:bg-error-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm shadow-sm',
      },
      size: {
        sm: 'px-4 py-2 text-sm h-9',
        md: 'px-6 py-2.5 text-base h-10',
        lg: 'px-8 py-3 text-lg h-12',
        xl: 'px-10 py-3.5 text-lg h-14',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof actionButtonVariants> {
  asChild?: boolean
  loading?: boolean
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(actionButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
ActionButton.displayName = 'ActionButton'

export { ActionButton, actionButtonVariants }
