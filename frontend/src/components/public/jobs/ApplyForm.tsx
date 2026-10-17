'use client'

import { useState } from 'react'

import Link from 'next/link'

import { BRAND } from '@/lib/brand'
import { type ApplySource, PublicApiError, publicApi } from '@/lib/publicApi'

import { FileDrop } from '@/components/app/FileDrop'
import { FormField } from '@/components/app/FormField'
import { AlertIcon, MailCheckIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_CV_BYTES = 10 * 1024 * 1024

type Errors = Partial<Record<'cv' | 'fullName' | 'email' | 'consent' | `q${number}`, string>>

export function ApplyForm({
  slug,
  companyName,
  questions,
  source,
}: {
  slug: string
  companyName: string
  questions: string[]
  source: ApplySource
}) {
  const [cv, setCv] = useState<File | null>(null)
  const [reading, setReading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  async function handleCv(file: File) {
    setCv(file)
    setErrors((e) => ({ ...e, cv: undefined }))
    setReading(true)
    try {
      const found = await publicApi.prefill(file)
      // Fill only what the applicant has not typed yet.
      if (found.full_name) setFullName((v) => v || found.full_name!)
      if (found.email) setEmail((v) => v || found.email!)
      if (found.phone) setPhone((v) => v || found.phone!)
    } catch {
      // Autofill is a convenience; the applicant can still type the details.
    } finally {
      setReading(false)
    }
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!cv) next.cv = 'Add your CV.'
    if (!fullName.trim()) next.fullName = 'Enter your name.'
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email.'
    questions.forEach((_, i) => {
      if (!answers[i]?.trim()) next[`q${i}`] = 'Answer this question.'
    })
    if (!consent) next.consent = 'Tick the box to apply.'
    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    setSending(true)
    try {
      const result = await publicApi.apply(slug, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        cv: cv!,
        answers: questions.map((question, i) => ({ question, answer: answers[i].trim() })),
        src: source,
      })
      setSentTo(result.email)
    } catch (err) {
      if (err instanceof PublicApiError && err.status === 409) {
        setAlreadyApplied(true)
        setSentTo(email.trim())
      } else {
        setFormError(err instanceof Error ? err.message : 'Could not send. Try again.')
      }
    } finally {
      setSending(false)
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <MailCheckIcon className="size-6 text-success" aria-hidden="true" />
        <h2 className="font-heading text-xl font-bold text-foreground">
          {alreadyApplied ? 'You already applied' : 'Application sent'}
        </h2>
        <p className="text-sm text-foreground">
          We emailed <strong>{sentTo}</strong> a link to check your status. {companyName} will
          reply either way.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/signin">See all my applications</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">Apply</h2>
      {formError ? (
        <Alert variant="destructive">
          <AlertIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FileDrop
        id="cv"
        label="Upload CV"
        accept="application/pdf,.pdf"
        acceptLabel="PDF"
        maxBytes={MAX_CV_BYTES}
        file={cv}
        onFile={handleCv}
        busy={reading}
        busyLabel="Reading your CV…"
        error={errors.cv}
      />

      <FormField id="fullName" label="Full name" error={errors.fullName}>
        <Input
          id="fullName"
          autoComplete="name"
          className="h-10"
          value={fullName}
          maxLength={255}
          aria-invalid={!!errors.fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </FormField>

      <FormField id="email" label="Email" error={errors.email}>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="h-10"
          value={email}
          maxLength={255}
          aria-invalid={!!errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormField>

      <FormField id="phone" label="Phone (optional)">
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="h-10"
          value={phone}
          maxLength={30}
          onChange={(e) => setPhone(e.target.value)}
        />
      </FormField>

      {questions.map((question, i) => (
        <FormField key={question} id={`q${i}`} label={question} error={errors[`q${i}`]}>
          <Textarea
            id={`q${i}`}
            rows={3}
            maxLength={2000}
            value={answers[i]}
            aria-invalid={!!errors[`q${i}`]}
            onChange={(e) =>
              setAnswers((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))
            }
          />
        </FormField>
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="consent" className="flex items-start gap-3 text-sm text-foreground">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(v) => {
              setConsent(v === true)
              setErrors((e) => ({ ...e, consent: undefined }))
            }}
            aria-invalid={!!errors.consent}
            className="mt-0.5"
          />
          <span>
            {companyName} and {BRAND.name} may use my CV for this job. A person makes the decision.{' '}
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
          </span>
        </label>
        {errors.consent ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" loading={sending}>
        Send application
      </Button>
    </form>
  )
}
