import { PageContainer } from '@/components/app/AppShell'
import { Skeleton } from '@/components/ui/skeleton'

import { CandidatePanelSkeleton } from './CandidatePanel'

function RowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 lg:border-transparent lg:bg-transparent lg:px-3 lg:py-3">
      <Skeleton className="size-11 rounded-full lg:hidden" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

/** List on the left, candidate on the right. */
export function PipelineSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[minmax(300px,380px)_1fr]" aria-busy="true">
      <div className="flex flex-col gap-3 lg:gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
      <div className="hidden lg:block">
        <CandidatePanelSkeleton />
      </div>
    </div>
  )
}

export function JobPageSkeleton() {
  return (
    <PageContainer className="max-w-7xl gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-40" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-9 w-72 max-w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-1">
        {[16, 24, 20, 14, 14, 18].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <PipelineSkeleton />
    </PageContainer>
  )
}
