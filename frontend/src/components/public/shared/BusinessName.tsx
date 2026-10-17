import Link from 'next/link'

import type { Dict } from '@/lib/i18n'
import type { PublicCompany } from '@/lib/publicApi'
import { cn } from '@/lib/utils'

import { EntityAvatar } from '@/components/app/EntityAvatar'
import { CheckCircleIcon } from '@/components/icons'

/** "Verified" next to a business that platform staff approved. */
export function VerifiedBadge({ t, className }: { t: Dict; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success',
        className,
      )}
    >
      <CheckCircleIcon className="size-3.5" weight="fill" aria-hidden="true" />
      {t.common.verified}
    </span>
  )
}

/** Logo + name (linking to the careers page) + verified badge. */
export function BusinessName({ company, t }: { company: PublicCompany; t: Dict }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Link
        href={`/c/${company.slug}`}
        className="flex items-center gap-3 text-sm font-medium text-foreground hover:underline"
      >
        <EntityAvatar name={company.name} src={company.logo_url} kind="company" className="size-8" />
        {company.name}
      </Link>
      {company.verified ? <VerifiedBadge t={t} /> : null}
    </div>
  )
}
