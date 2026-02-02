import React from 'react'
import { cn } from '../../lib/utils'

export function ScrollArea({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('overflow-y-auto relative', className)}>{children}</div>
}
