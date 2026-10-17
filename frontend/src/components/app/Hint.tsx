'use client'

import type { ReactElement, ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * A short tooltip on hover or keyboard focus. Wrap one focusable element
 * (usually an IconButton). The element keeps its own aria-label; the hint only
 * repeats it for sighted mouse and keyboard users.
 */
export function Hint({
  label,
  side = 'top',
  children,
}: {
  label: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactElement
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} sideOffset={6}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
