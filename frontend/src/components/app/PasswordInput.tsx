'use client'

import { type ComponentProps, useState } from 'react'

import { cn } from '@/lib/utils'

import { EyeIcon, EyeOffIcon } from '@/components/icons'
import { IconButton } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Password input with a show/hide toggle. Accepts every <Input> prop. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-11', className)} {...props} />
      <IconButton
        type="button"
        size="sm"
        label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </IconButton>
    </div>
  )
}
