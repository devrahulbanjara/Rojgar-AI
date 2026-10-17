import type { Dict } from '@/lib/i18n'

import { EntityAvatar } from '@/components/app/EntityAvatar'
import { StatusPill, Tag } from '@/components/app/StatusPill'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/button'
import { CheckIcon, CloseIcon } from '@/components/icons'

// Portraits from Unsplash (Unsplash License: free for commercial use, no
// attribution needed), cropped to 160px WebP: vivek (@vivekrb), Aalok Atreya,
// Shashank Thapa (Kirtipur), Samrat Khadka (Langtang).
const PHOTOS = ['/landing/sita.webp', '/landing/bikash.webp', '/landing/anita.webp', '/landing/kamal.webp']

/** A static, clearly-labelled example of the applicants view. Not live data. */
export function ApplicantsPreview({ t }: { t: Dict }) {
  const p = t.landing.preview
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-30px_rgba(28,25,23,0.25)]">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <span className="block truncate font-heading text-base font-semibold text-foreground">
            {p.title}
          </span>
          <span className="block text-xs text-muted-foreground">{p.facts}</span>
        </div>
        <Badge variant="outline">{t.common.example}</Badge>
      </div>

      <ul className="divide-y">
        {p.rows.map((person, index) => (
          <li key={person.name} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
            <EntityAvatar name={person.name} src={PHOTOS[index]} className="size-10" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-foreground">{person.name}</span>
              <span className="truncate text-xs text-muted-foreground">{person.job}</span>
              <span className="text-xs text-foreground">{person.reason}</span>
              {index === 1 || index === 3 ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Tag>{index === 1 ? p.suggestedBy : p.noCv}</Tag>
                </div>
              ) : null}
            </div>
            {index === 0 ? (
              <StatusPill tone="success">{p.shortlisted}</StatusPill>
            ) : (
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <IconButton label={p.shortlist} variant="outline" size="sm" tabIndex={-1}>
                  <CheckIcon className="text-success" />
                </IconButton>
                <IconButton label={p.notNow} variant="outline" size="sm" tabIndex={-1}>
                  <CloseIcon className="text-danger" />
                </IconButton>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
