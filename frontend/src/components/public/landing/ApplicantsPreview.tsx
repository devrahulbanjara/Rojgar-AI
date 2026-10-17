import { Check, X } from 'lucide-react'

import { FitMeter } from '@/components/app/Numbers'
import { PersonCell } from '@/components/app/PersonCell'
import { StatusPill } from '@/components/app/StatusPill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const SAMPLE = [
  { name: 'Sita Gurung', reason: '5 yrs Python & FastAPI · led a payments API', score: 91 },
  { name: 'Arjun Thapa', reason: 'Django at scale · strong on PostgreSQL', score: 84 },
  { name: 'Maya Rai', reason: 'Backend + DevOps · AWS certified', score: 77 },
  { name: 'Bikram Shah', reason: 'Fresh graduate · good final-year project', score: 52 },
]

/** A static, clearly-labelled example of the applicants view. Not live data. */
export function ApplicantsPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-30px_rgba(28,25,23,0.25)]">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold text-foreground">
            Backend Engineer
          </p>
          <p className="text-xs text-muted-foreground">Kathmandu · Hybrid · 48 applicants</p>
        </div>
        <Badge variant="outline">Example</Badge>
      </div>

      <ul className="divide-y">
        {SAMPLE.map((person, index) => (
          <li key={person.name} className="flex items-center gap-3 px-5 py-3.5">
            <PersonCell name={person.name} meta={person.reason} className="flex-1" />
            <div className="hidden sm:block">
              <FitMeter score={person.score} />
            </div>
            {index === 0 ? (
              <StatusPill tone="success" className="hidden sm:inline-flex">
                Shortlisted
              </StatusPill>
            ) : (
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <Button variant="outline" size="icon-sm" tabIndex={-1} aria-label="Shortlist">
                  <Check className="text-success" />
                </Button>
                <Button variant="outline" size="icon-sm" tabIndex={-1} aria-label="Not now">
                  <X className="text-danger" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
