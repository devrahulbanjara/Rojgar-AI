'use client'

import { useState } from 'react'

import Link from 'next/link'

import { useT } from '@/lib/i18n/client'
import { publicApi } from '@/lib/publicApi'

import { FormField } from '@/components/app/FormField'
import { AlertIcon, CheckCircleIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { SendLink } from '../shared/SendLink'
import { PhoneInput, toE164 } from './PhoneInput'

type Field = 'referrerName' | 'referrerPhone' | 'name' | 'phone'

/** "Suggest someone you know": who you are, who they are, why. */
export function SuggestForm({
  slug,
  jobTitle,
  companyName,
  refToken,
  referrer,
}: {
  slug: string
  jobTitle: string
  companyName: string
  refToken?: string
  /** The share link's owner, who is most likely the one suggesting. */
  referrer: string
}) {
  const t = useT()
  const [referrerName, setReferrerName] = useState(referrer)
  const [referrerPhone, setReferrerPhone] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ name: string; jobUrl: string } | null>(null)

  function validate() {
    const next: Partial<Record<Field, string>> = {}
    if (!referrerName.trim()) next.referrerName = t.apply.nameRequired
    if (referrerPhone.trim() && !toE164(referrerPhone)) next.referrerPhone = t.apply.phoneInvalid
    if (!name.trim()) next.name = t.apply.nameRequired
    if (!phone.trim()) next.phone = t.apply.phoneRequired
    else if (!toE164(phone)) next.phone = t.apply.phoneInvalid
    else if (referrerPhone.trim() && toE164(referrerPhone) === toE164(phone)) {
      next.phone = t.suggest.sameNumber
    }
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
    try {
      const result = await publicApi.recommend(slug, {
        referrerName: referrerName.trim(),
        referrerPhone: referrerPhone.trim() ? toE164(referrerPhone)! : undefined,
        name: name.trim(),
        phone: toE164(phone)!,
        note: note.trim() || undefined,
        ref: refToken,
      })
      const fallback = `/jobs/${slug}?src=referral${refToken ? `&ref=${encodeURIComponent(refToken)}` : ''}`
      setDone({
        name: name.trim(),
        jobUrl: result.job_url ?? new URL(fallback, window.location.origin).toString(),
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <CheckCircleIcon className="size-7 text-success" weight="fill" aria-hidden="true" />
        <h2 className="font-heading text-xl font-bold text-foreground">{t.suggest.doneTitle}</h2>
        <p className="text-sm text-foreground">{t.suggest.doneLine(done.name)}</p>
        <SendLink text={t.careers.shareText(jobTitle, companyName)} url={done.jobUrl} />
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              // Keep who is suggesting; clear the person suggested.
              setName('')
              setPhone('')
              setNote('')
              setDone(null)
            }}
          >
            {t.suggest.another}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href={`/jobs/${slug}`}>{t.suggest.seeJob}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError ? (
        <Alert variant="destructive">
          <AlertIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField id="name" label={t.suggest.theirName} error={errors.name}>
        <Input
          id="name"
          autoComplete="off"
          className="h-12 text-base"
          value={name}
          maxLength={255}
          aria-invalid={!!errors.name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>
      <FormField id="phone" label={t.suggest.theirPhone} error={errors.phone}>
        <PhoneInput
          id="phone"
          autoComplete="off"
          value={phone}
          invalid={!!errors.phone}
          onChange={setPhone}
        />
      </FormField>
      <FormField id="note" label={t.suggest.note}>
        <Textarea
          id="note"
          rows={2}
          maxLength={500}
          className="text-base"
          placeholder={t.suggest.notePlaceholder}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormField>

      <div className="flex flex-col gap-5 border-t pt-5">
        <FormField id="referrerName" label={t.suggest.yourName} error={errors.referrerName}>
          <Input
            id="referrerName"
            autoComplete="name"
            className="h-12 text-base"
            value={referrerName}
            maxLength={255}
            aria-invalid={!!errors.referrerName}
            onChange={(e) => setReferrerName(e.target.value)}
          />
        </FormField>
        <FormField
          id="referrerPhone"
          label={`${t.suggest.yourPhone} (${t.common.optional})`}
          error={errors.referrerPhone}
        >
          <PhoneInput
            id="referrerPhone"
            value={referrerPhone}
            invalid={!!errors.referrerPhone}
            onChange={setReferrerPhone}
          />
        </FormField>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={sending}>
        {t.suggest.submit}
      </Button>
    </form>
  )
}
