import * as React from 'react'

import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { SpinnerIcon } from '@/components/icons'

/**
 * The one button. See docs/DESIGN_SYSTEM.md → "Buttons" for which variant to use.
 * Icons go in children (from @/components/icons, auto-sized to 16px): <Button><PlusIcon />Post a job</Button>.
 */
const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none',
    'transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98]',
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /** The single main action of a screen or dialog. */
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/85',
        /** Neutral filled — a strong alternative next to a primary. */
        secondary:
          'bg-foreground/[0.06] text-foreground hover:bg-foreground/10 active:bg-foreground/[0.14]',
        /** Supporting actions: Share, Edit, Cancel, Decline. */
        outline:
          'border border-border bg-card text-foreground hover:bg-accent active:bg-foreground/[0.08]',
        /** Low-emphasis and icon-only toolbar actions. */
        ghost: 'text-foreground hover:bg-accent active:bg-foreground/[0.08]',
        /** Irreversible actions only (delete, remove member). */
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/85 focus-visible:ring-destructive/30',
        /** Navigation that looks like text (table "Open →"). */
        link: 'h-auto rounded-sm px-0 text-primary underline-offset-4 hover:underline active:scale-100',
        /** @deprecated shadcn alias for `primary`; kept for generated components. */
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/85',
      },
      size: {
        sm: 'h-8 px-3 text-sm has-[>svg]:px-2.5',
        md: 'h-10 px-4 text-sm has-[>svg]:px-3.5',
        lg: 'h-12 min-h-11 px-6 text-base has-[>svg]:px-5',
        icon: 'size-10',
        'icon-sm': 'size-8',
        /** @deprecated shadcn aliases kept for generated components. */
        default: 'h-10 px-4 text-sm has-[>svg]:px-3.5',
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-lg': 'size-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0 has-[>svg]:px-0' }],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. <Link>) with button styles. */
    asChild?: boolean
    /** Shows a spinner, sets aria-busy and disables the button without changing its width. */
    loading?: boolean
  }

function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, fullWidth, className }))

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={classes}
        {...props}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="invisible inline-flex items-center gap-2">{children}</span>
          <span className="absolute inset-0 inline-flex items-center justify-center">
            <SpinnerIcon className="animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading</span>
          </span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

type IconButtonProps = Omit<ButtonProps, 'size' | 'aria-label'> & {
  /** Required accessible name — icon-only buttons have no visible text. */
  label: string
  size?: 'sm' | 'md'
}

/** Icon-only button: always has an accessible label; defaults to ghost. */
function IconButton({ label, size = 'md', variant = 'ghost', ...props }: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      title={label}
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      variant={variant}
      {...props}
    />
  )
}

export { Button, IconButton, buttonVariants }
export type { ButtonProps }
