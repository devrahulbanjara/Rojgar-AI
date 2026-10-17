import type { Dict } from '@/lib/i18n'

import { ClickIcon, ShareIcon, EditIcon } from '@/components/icons'

const ICONS = [EditIcon, ShareIcon, ClickIcon]

export function HowItWorks({ t }: { t: Dict }) {
  return (
    <section id="how" className="scroll-mt-20 bg-card py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          {t.landing.how.title}
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {t.landing.how.steps.map((step, index) => {
            const Icon = ICONS[index]
            return (
              <li key={step.title} className="flex flex-col gap-4 rounded-2xl border bg-background p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-heading text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.line}</p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
