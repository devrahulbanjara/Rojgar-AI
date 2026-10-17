import type { Dict } from '@/lib/i18n'

import { LocationIcon, MailCheckIcon, NoAccountIcon, PersonDecidesIcon } from '@/components/icons'

const ICONS = [PersonDecidesIcon, MailCheckIcon, NoAccountIcon, LocationIcon]

/** Trust strip: four promises. */
export function Promises({ t }: { t: Dict }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 pb-4 sm:px-6">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.landing.trust.map((text, index) => {
          const Icon = ICONS[index]
          return (
            <li key={text} className="flex items-center gap-3">
              <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="font-medium text-foreground">{text}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
