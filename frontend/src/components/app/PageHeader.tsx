import { Fragment, type ReactNode } from 'react'

import Link from 'next/link'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export type Crumb = { label: string; href?: string }

/**
 * The page skeleton every page shares:
 * breadcrumb → large light title + inline status → ONE line of facts → ≤2 actions.
 * There is intentionally no free-text subtitle prop: `facts` are joined with " · "
 * and must be facts ("Kathmandu", "Closes 30 Oct", "48 applicants"), never prose.
 */
export function PageHeader({
  title,
  breadcrumb,
  status,
  facts,
  primaryAction,
  secondaryAction,
}: {
  title: ReactNode
  breadcrumb?: Crumb[]
  status?: ReactNode
  facts?: (string | null | undefined | false)[]
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
}) {
  const factLine = (facts ?? []).filter(Boolean).join(' · ')
  return (
    <header className="flex flex-col gap-2">
      {breadcrumb && breadcrumb.length > 1 ? (
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            {breadcrumb.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-muted-foreground">{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-normal tracking-tight text-foreground">
              {title}
            </h1>
            {status}
          </div>
          {factLine ? <p className="text-sm text-muted-foreground">{factLine}</p> : null}
        </div>
        {primaryAction || secondaryAction ? (
          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </header>
  )
}
