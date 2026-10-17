'use client'

import { useState } from 'react'

import {
  type Interview,
  RECOMMENDATION_LABEL,
  type Recommendation,
  useGetScorecardTemplateQuery,
  useSubmitScorecardMutation,
} from '@/lib/api/interviews'
import { notify } from '@/lib/notify'

import { FilterChips } from '@/components/app/FilterChips'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const RATINGS = [
  { value: '1', label: 'Poor' },
  { value: '2', label: 'Fair' },
  { value: '3', label: 'Good' },
  { value: '4', label: 'Strong' },
]

const RECOMMENDATIONS = (['strong_no', 'no', 'yes', 'strong_yes'] as Recommendation[]).map(
  (value) => ({ value, label: RECOMMENDATION_LABEL[value] }),
)

function ScorecardForm({ interview, onDone }: { interview: Interview; onDone: () => void }) {
  const template = useGetScorecardTemplateQuery(interview.id)
  const [submit, submitState] = useSubmitScorecardMutation()
  const [ratings, setRatings] = useState<Record<string, string>>({})
  const [recommendation, setRecommendation] = useState<Recommendation | ''>('')
  const [notes, setNotes] = useState('')
  const [tried, setTried] = useState(false)

  if (template.isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const criteria = template.data?.criteria ?? []

  async function save() {
    if (!recommendation) {
      setTried(true)
      return
    }
    try {
      await submit({
        id: interview.id,
        scorecard: {
          ratings: Object.fromEntries(
            Object.entries(ratings).map(([criterion, value]) => [criterion, Number(value)]),
          ),
          recommendation,
          notes,
        },
      }).unwrap()
      notify.success(`Notes saved for ${interview.candidate.name}`)
      onDone()
    } catch {
      notify.error("Couldn't save the notes. Try again.")
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {criteria.map((criterion) => (
          <div key={criterion} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{criterion}</p>
            <FilterChips
              label={criterion}
              value={ratings[criterion] ?? ''}
              onChange={(value) => setRatings((prev) => ({ ...prev, [criterion]: value }))}
              options={RATINGS}
            />
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Would you hire them?</p>
          <FilterChips
            label="Recommendation"
            value={recommendation}
            onChange={(value) => setRecommendation(value as Recommendation)}
            options={RECOMMENDATIONS}
          />
          {tried && !recommendation ? <p className="text-sm text-danger">Pick one.</p> : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="scorecard-notes">Notes</Label>
          <Textarea
            id="scorecard-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={4000}
          />
        </div>
      </div>
      <DialogFooter>
        <Button loading={submitState.isLoading} onClick={() => void save()}>
          Save notes
        </Button>
      </DialogFooter>
    </>
  )
}

/** Ratings per must-have (Poor–Strong), a hire recommendation and notes. */
export function ScorecardDialog({
  interview,
  onOpenChange,
}: {
  interview: Interview | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!interview} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>
            {interview ? `How did it go with ${interview.candidate.name}?` : ''}
          </DialogTitle>
        </DialogHeader>
        {interview ? (
          <ScorecardForm
            key={interview.id}
            interview={interview}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
