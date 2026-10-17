import { MailCheck, UserCheck, UserRoundX } from 'lucide-react'

const PROMISES = [
  { icon: UserCheck, text: 'A person makes every decision' },
  { icon: MailCheck, text: 'Every candidate hears back' },
  { icon: UserRoundX, text: 'No account needed to apply' },
]

export function Promises() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <ul className="grid gap-4 sm:grid-cols-3">
        {PROMISES.map((item) => (
          <li key={item.text} className="flex items-center gap-3">
            <item.icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-medium text-foreground">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
