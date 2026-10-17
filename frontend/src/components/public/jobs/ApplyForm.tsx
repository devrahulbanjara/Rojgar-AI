'use client'

import { useState } from 'react'

import Link from 'next/link'

import { useT } from '@/lib/i18n/client'
import { type ApplySource, PublicApiError, publicApi } from '@/lib/publicApi'

import { FileDrop } from '@/components/app/FileDrop'
import { FormField } from '@/components/app/FormField'
import { AlertIcon, MailCheckIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { PhoneInput, toE164 } from './PhoneInput'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_MB = 10
const CV_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const CV_ACCEPT = `${CV_TYPES.join(',')},.pdf,.jpg,.jpeg,.png,.webp`
const ext = (file: File) => file.name.split('.').pop()?.toLowerCase() ?? ''

type Errors = Partial<Record<'cv' | 'fullName' | 'phone' | 'email' | `q${number}`, string>>
type Sent = { phone: string; email?: string | null; again: boolean }

/** Phone-first apply: name, mobile, optional CV (PDF or photo), job questions, optional email. */
export function ApplyForm({
  slug,
  companyName,
  questions,
  source,
  refToken,
}: {
  slug: string
  companyName: string
  questions: string[]
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
    questions.forEach((_, i) => {
      if (!answers[i]?.trim()) next[`q${i}`] = t.apply.answerRequired
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
        answers: questions.map((question, i) => ({ question, answer: answers[i].trim() })),
        src: source,
        ref: refToken,
      })
      setSent({ phone: result.phone, email: result.email, again: false })
    } catch (err) {
      if (err instanceof PublicApiError && err.status === 409) {
        setSent({ phone: e164, email: email.trim() || null, again: true })
      } else {
        setFormError(err instanceof Error ? err.message : t.common.error)
      }
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <MailCheckIcon className="size-6 text-success" aria-hidden="true" />
        <h2 className="font-heading text-xl font-bold text-foreground">
          {sent.again ? t.apply.alreadyTitle : t.apply.sentTitle}
        </h2>
        <p className="text-sm text-foreground">
          {t.apply.sentSms(sent.phone)} {sent.email ? t.apply.sentEmail(sent.email) : null}{' '}
          {t.apply.replyEither(companyName)}
        </p>
        <div className="flex flex-col gap-2">
          {sent.email ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/signin">{t.apply.seeAll}</Link>
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
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{t.apply.title}</h2>
        <p className="text-xs text-muted-foreground">{t.apply.time}</p>
      </div>
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
          onChange={(e) => setFullName(e.target.value)}
        />
      </FormField>

      <FormField id="phone" label={t.apply.phone} error={errors.phone}>
        <PhoneInput
          id="phone"
          value={phone}
          invalid={!!errors.phone}
          onChange={(value) => {
            setPhone(value)
            if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }))
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
        <FormField key={question} id={`q${i}`} label={question} error={errors[`q${i}`]}>
          <Textarea
            id={`q${i}`}
            rows={2}
            maxLength={2000}
            className="text-base"
            value={answers[i]}
            aria-invalid={!!errors[`q${i}`]}
            onChange={(e) =>
              setAnswers((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))
            }
          />
        </FormField>
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
          onChange={(e) => setEmail(e.target.value)}
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
