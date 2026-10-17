'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'

import { useT } from '@/lib/i18n/client'
import { type ApplySource, PublicApiError, type PublicQuestion, publicApi } from '@/lib/publicApi'

import { FileDrop } from '@/components/app/FileDrop'
import { FormField } from '@/components/app/FormField'
import { AlertIcon, MailCheckIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { SendLink } from '../shared/SendLink'
import { PhoneInput, toE164 } from './PhoneInput'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_MB = 10
const CV_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const CV_ACCEPT = `${CV_TYPES.join(',')},.pdf,.jpg,.jpeg,.png,.webp`
const ext = (file: File) => file.name.split('.').pop()?.toLowerCase() ?? ''

type Errors = Partial<Record<'cv' | 'fullName' | 'phone' | 'email' | `q${number}`, string>>
type Sent = { email?: string | null; again: boolean; statusUrl?: string | null }

/** Phone-first apply: name, mobile, optional CV (PDF or photo), job questions, optional email. */
export function ApplyForm({
  slug,
  jobTitle,
  companyName,
  questions,
  source,
  refToken,
}: {
  slug: string
  jobTitle: string
  companyName: string
  questions: PublicQuestion[]
  source: ApplySource
  refToken?: string
}) {
  const t = useT()
  const [cv, setCv] = useState<File | null>(null)
  const [reading, setReading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<Sent | null>(null)
  const doneRef = useRef<HTMLDivElement>(null)

  // On a phone the form is long; bring the confirmation into view.
  useEffect(() => {
    if (sent) doneRef.current?.scrollIntoView({ block: 'center' })
  }, [sent])

  const clear = (field: keyof Errors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))

  function checkCv(file: File): string | undefined {
    if (/^hei[cf]$/.test(ext(file)) || /hei[cf]/i.test(file.type)) return t.apply.cvHeic
    const known = CV_TYPES.includes(file.type) || ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext(file))
    if (!known) return t.apply.cvWrongType
    if (file.size > MAX_MB * 1024 * 1024) return t.apply.cvTooBig(MAX_MB)
    return undefined
  }

  async function handleCv(file: File) {
    setCv(file)
    setErrors((e) => ({ ...e, cv: undefined }))
    // Only PDFs can be read while the applicant waits; photos go to the business as they are.
    if (file.type !== 'application/pdf' && ext(file) !== 'pdf') return
    setReading(true)
    try {
      const found = await publicApi.prefill(file)
      // Fill only what the applicant has not typed yet.
      if (found.full_name) setFullName((v) => v || found.full_name!)
      if (found.phone) setPhone((v) => v || found.phone!.replace(/^\+977/, ''))
      if (found.email) setEmail((v) => v || found.email!)
    } catch {
      // Autofill is a convenience; the applicant can still type the details.
    } finally {
      setReading(false)
    }
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!fullName.trim()) next.fullName = t.apply.nameRequired
    if (!phone.trim()) next.phone = t.apply.phoneRequired
    else if (!toE164(phone)) next.phone = t.apply.phoneInvalid
    if (email.trim() && !EMAIL_RE.test(email.trim())) next.email = t.apply.emailInvalid
    questions.forEach((question, i) => {
      if (question.required && !answers[i]?.trim()) next[`q${i}`] = t.apply.answerRequired
    })
    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }

    setSending(true)
    const e164 = toE164(phone)!
    try {
      const result = await publicApi.apply(slug, {
        fullName: fullName.trim(),
        phone: e164,
        email: email.trim().toLowerCase() || undefined,
        cv,
        answers: questions
          .map((question, i) => ({ question: question.label, answer: answers[i].trim() }))
          .filter((answer) => answer.answer),
        src: source,
        ref: refToken,
      })
      setSent({ email: result.email, again: false, statusUrl: result.status_url })
    } catch (err) {
      if (err instanceof PublicApiError && err.status === 409) {
        setSent({ email: email.trim() || null, again: true })
      } else {
        setFormError(err instanceof Error ? err.message : t.common.error)
      }
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    const emailLine = sent.email
      ? sent.again
        ? t.apply.sentAgainEmail
        : t.apply.sentEmail
      : sent.again
        ? t.apply.sentAgainNoEmail
        : null
    return (
      <div ref={doneRef} className="flex flex-col gap-4" role="status">
        <MailCheckIcon className="size-6 text-success" aria-hidden="true" />
        <h2 className="font-heading text-xl font-bold text-foreground">
          {sent.again ? t.apply.alreadyTitle : t.apply.sentTitle}
        </h2>
        <p className="text-sm text-foreground">
          {emailLine} {t.apply.replyEither(companyName)}
        </p>
        {sent.statusUrl ? (
          <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
            <p className="text-sm font-medium text-foreground">{t.apply.saveLink}</p>
            <p className="text-xs break-all text-muted-foreground select-all">{sent.statusUrl}</p>
            <SendLink self text={t.apply.statusText(jobTitle, companyName)} url={sent.statusUrl} />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          {sent.email ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">{t.apply.seeAll}</Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="w-full">
            <Link href={`/jobs/${slug}/suggest${refToken ? `?ref=${encodeURIComponent(refToken)}` : ''}`}>
              {t.job.suggest}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">{t.apply.title}</h2>
      {formError ? (
        <Alert variant="destructive">
          <AlertIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField id="fullName" label={t.apply.name} error={errors.fullName}>
        <Input
          id="fullName"
          autoComplete="name"
          className="h-12 text-base"
          value={fullName}
          maxLength={255}
          aria-invalid={!!errors.fullName}
          onChange={(e) => {
            setFullName(e.target.value)
            clear('fullName')
          }}
        />
      </FormField>

      <FormField id="phone" label={t.apply.phone} error={errors.phone}>
        <PhoneInput
          id="phone"
          value={phone}
          invalid={!!errors.phone}
          onChange={(value) => {
            setPhone(value)
            clear('phone')
          }}
        />
      </FormField>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          {t.apply.cv} <span className="font-normal text-muted-foreground">({t.common.optional})</span>
        </p>
        <FileDrop
          id="cv"
          label={t.apply.addCv}
          accept={CV_ACCEPT}
          hint={t.apply.cvTypes(MAX_MB)}
          check={checkCv}
          replaceLabel={t.apply.replace}
          removeLabel={t.apply.remove}
          onRemove={() => setCv(null)}
          file={cv}
          onFile={handleCv}
          busy={reading}
          busyLabel={t.apply.reading}
          error={errors.cv}
        />
      </div>

      {questions.map((question, i) => (
        <QuestionField
          key={question.label}
          id={`q${i}`}
          question={question}
          value={answers[i]}
          error={errors[`q${i}`]}
          onChange={(value) => {
            setAnswers((prev) => prev.map((a, j) => (j === i ? value : a)))
            clear(`q${i}`)
          }}
        />
      ))}

      <FormField id="email" label={`${t.apply.email} (${t.common.optional})`} error={errors.email}>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="h-12 text-base"
          value={email}
          maxLength={255}
          aria-invalid={!!errors.email}
          onChange={(e) => {
            setEmail(e.target.value)
            clear('email')
          }}
        />
      </FormField>

      <p className="text-sm text-muted-foreground">
        {t.apply.consent(companyName)}{' '}
        <Link href="/privacy" className="underline">
          {t.apply.privacy}
        </Link>
      </p>

      <Button type="submit" size="lg" className="w-full" loading={sending} disabled={reading}>
        {t.apply.submit}
      </Button>
    </form>
  )
}

/** A job's question: a short answer, or Yes / No. */
function QuestionField({
  id,
  question,
  value,
  error,
  onChange,
}: {
  id: string
  question: PublicQuestion
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  const t = useT()
  const label = question.required ? question.label : `${question.label} (${t.common.optional})`
  if (question.type === 'short_text') {
    return (
      <FormField id={id} label={label} error={error}>
        <Input
          id={id}
          className="h-12 text-base"
          value={value}
          maxLength={2000}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        />
      </FormField>
    )
  }
  return (
    <FormField id={id} label={label} error={error}>
      <RadioGroup
        id={id}
        value={value}
        onValueChange={onChange}
        aria-invalid={!!error}
        className="grid-cols-2 gap-2"
      >
        {(['yes', 'no'] as const).map((option) => (
          <Label
            key={option}
            htmlFor={`${id}-${option}`}
            className="flex h-12 cursor-pointer items-center gap-3 rounded-lg border border-input px-4 text-base font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem id={`${id}-${option}`} value={option} />
            {t.apply[option]}
          </Label>
        ))}
      </RadioGroup>
    </FormField>
  )
}
