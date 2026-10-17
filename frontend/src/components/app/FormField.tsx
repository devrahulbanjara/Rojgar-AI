import type { ReactNode } from 'react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'

/**
 * Label + control + inline error. The control must carry the same `id` and
 * `aria-invalid={!!error}`; `aside` sits right-aligned next to the label
 * (e.g. a "Forgot password?" link).
 */
export function FormField({
  id,
  label,
  error,
  aside,
  children,
}: {
  id: string
  label: string
  error?: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <Field data-invalid={!!error || undefined} className="gap-2">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id} className="text-foreground">
          {label}
        </FieldLabel>
        {aside}
      </div>
      {children}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  )
}
