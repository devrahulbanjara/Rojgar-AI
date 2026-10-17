import { FileSearch, Link2, MousePointerClick } from 'lucide-react'

const STEPS = [
  {
    icon: Link2,
    title: 'Share your link',
    line: 'One apply link for LinkedIn, Facebook, Merojob or your site.',
  },
  {
    icon: FileSearch,
    title: 'Every CV gets read',
    line: 'Applicants are ranked, each with a one-line reason.',
  },
  {
    icon: MousePointerClick,
    title: 'Decide in one click',
    line: 'Shortlist or pass. Candidates get an email either way.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-card py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          How it works
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-4 rounded-2xl border bg-background p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-heading text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.line}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
