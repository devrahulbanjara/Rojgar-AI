import Link from 'next/link'

import { ago, closingLabel } from '@/lib/dates'
import type { RecruiterHomeRole } from '@/store/services/dashboardApi'
import { Share2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { ActionTile } from './ActionTile'
import { ShareJobDialog } from './ShareJobDialog'
import { JobStatusPill } from './StatusPill'

/** One role and the work waiting on it, Hirely-style. */
export function RoleCard({ role, companyName }: { role: RecruiterHomeRole; companyName: string }) {
  const jobHref = `/recruiter/jobs/${role.job_id}`
  const isOpen = role.status === 'active'
  const meta = [`Posted ${ago(role.created_at)}`, closingLabel(role.expires_at)]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={jobHref}
            className="line-clamp-2 font-semibold text-foreground underline-offset-4 hover:underline"
          >
            {role.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <JobStatusPill status={role.status} />
            <span>
              {meta}
              {role.upcoming_interviews > 0
                ? ` · ${role.upcoming_interviews} interview${role.upcoming_interviews === 1 ? '' : 's'} booked`
                : ''}
            </span>
          </div>
        </div>
        {isOpen ? (
          <ShareJobDialog
            job={{
              slug: role.share_slug,
              title: role.title,
              companyName,
              location: role.location,
              locationType: role.location_type,
            }}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Share ${role.title}`}>
                <Share2 />
              </Button>
            }
          />
        ) : null}
      </div>

      <div className="flex gap-2">
        <ActionTile
          count={role.to_review}
          label={role.strong > 0 ? `to review · ${role.strong} strong` : 'to review'}
          href={`${jobHref}?stage=applied`}
          tone="primary"
        />
        <ActionTile
          count={role.to_contact}
          label="to contact"
          href={`${jobHref}?stage=shortlist`}
          tone="warning"
        />
        <ActionTile
          count={role.to_decide}
          label="to decide"
          href={`${jobHref}?stage=interview`}
          tone="warning"
        />
      </div>
    </article>
  )
}
