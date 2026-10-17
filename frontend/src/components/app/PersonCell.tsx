// replaced by feat/public at merge
import type { ReactNode } from 'react'

import { EntityAvatar } from './EntityAvatar'

/** Avatar + bold name + muted meta — the first cell of people tables. */
export function PersonCell({
  name,
  meta,
  src,
}: {
  name: string
  meta?: ReactNode
  src?: string | null
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <EntityAvatar name={name} src={src} className="size-8" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{name}</span>
        {meta ? <span className="truncate text-xs text-muted-foreground">{meta}</span> : null}
      </span>
    </span>
  )
}
