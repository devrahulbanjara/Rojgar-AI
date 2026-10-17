import { cn } from '@/lib/utils'

/** Placeholder with a soft left-to-right sheen. Match the shape of the content it replaces. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('skeleton-sheen rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
