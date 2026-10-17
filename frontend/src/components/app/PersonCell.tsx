import { cn } from '@/lib/utils'

import { EntityAvatar } from '@/components/app/EntityAvatar'

/** Avatar + bold name + one muted line. The first cell of any people table or list. */
export function PersonCell({
  name,
  meta,
  src,
  className,
}: {
  name: string
  meta?: string | null
  src?: string | null
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <EntityAvatar name={name} src={src} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </div>
  )
}
