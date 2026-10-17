'use client'

import { type FormEvent, useState } from 'react'

import { PLANS, planPrice, usageLine, useGetCompanyPlanQuery } from '@/lib/api/company'
import { parseApiError } from '@/lib/apiError'
import { notify } from '@/lib/notify'
import {
  type CompanyProfileData,
  useGetMyCompanyQuery,
  useRemoveCompanyLogoMutation,
  useUpdateCompanyMutation,
  useUploadCompanyLogoMutation,
} from '@/store/services/companyApi'

import { ErrorState } from '@/components/app/Feedback'
import { FormField } from '@/components/app/FormField'
import { ImagePicker } from '@/components/app/ImagePicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

import { SettingsCard } from './SettingsShell'

type Form = {
  name: string
  industry: string
  location: string
  website_url: string
  description: string
}

const fromCompany = (c: CompanyProfileData): Form => ({
  name: c.name,
  industry: c.industry ?? '',
  location: c.location ?? '',
  website_url: c.website_url ?? '',
  description: c.description ?? '',
})

const isUrl = (value: string) => !value || /^https?:\/\/\S+\.\S+$/i.test(value)

function CompanyForm({ company }: { company: CompanyProfileData }) {
  const [form, setForm] = useState<Form>(() => fromCompany(company))
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [update, saveState] = useUpdateCompanyMutation()
  const [uploadLogo, uploadState] = useUploadCompanyLogoMutation()
  const [removeLogo, removeState] = useRemoveCompanyLogoMutation()

  const initial = fromCompany(company)
  // Cal.com link: only while native scheduling is off and the backend still has the field.
  const changed = (Object.keys(form) as (keyof Form)[]).some((k) => form[k].trim() !== initial[k])
  const set = (key: keyof Form) => (event: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  async function save(event: FormEvent) {
    event.preventDefault()
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Enter the company name.'
    if (!isUrl(form.website_url.trim()))
      next.website_url = 'Use a full link, like https://example.com'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      await update({
        name: form.name.trim(),
        industry: form.industry.trim() || null,
        location: form.location.trim() || null,
        website_url: form.website_url.trim() || null,
        description: form.description.trim() || null,
      }).unwrap()
      notify.success('Saved')
    } catch (error) {
      notify.error(parseApiError(error, {}, "Couldn't save. Try again.").message)
    }
  }

  async function pick(file: File) {
    const body = new FormData()
    body.append('file', file)
    try {
      await uploadLogo(body).unwrap()
      notify.success('Logo updated')
    } catch (error) {
      notify.error(parseApiError(error, {}, "Couldn't upload the logo. Try again.").message)
    }
  }

  return (
    <form onSubmit={(event) => void save(event)}>
      <SettingsCard
        footer={
          <Button type="submit" disabled={!changed} loading={saveState.isLoading}>
            Save
          </Button>
        }
      >
        <ImagePicker
          kind="company"
          name={form.name || company.name}
          src={company.logo_url}
          onPick={pick}
          onRemove={async () => {
            try {
              await removeLogo().unwrap()
            } catch {
              notify.error("Couldn't remove the logo. Try again.")
            }
          }}
          busy={uploadState.isLoading || removeState.isLoading}
        />
        <FormField id="company-name" label="Name" error={errors.name}>
          <Input
            id="company-name"
            value={form.name}
            maxLength={200}
            aria-invalid={!!errors.name}
            onChange={set('name')}
          />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="company-industry" label="Industry">
            <Input
              id="company-industry"
              value={form.industry}
              maxLength={100}
              placeholder="Banking, hospital, hotel, school…"
              onChange={set('industry')}
            />
          </FormField>
          <FormField id="company-location" label="Location">
            <Input
              id="company-location"
              value={form.location}
              maxLength={200}
              placeholder="Kathmandu"
              onChange={set('location')}
            />
          </FormField>
        </div>
        <FormField id="company-website" label="Website" error={errors.website_url}>
          <Input
            id="company-website"
            type="url"
            value={form.website_url}
            placeholder="https://"
            aria-invalid={!!errors.website_url}
            onChange={set('website_url')}
          />
        </FormField>
        <FormField id="company-about" label="About the company">
          <Textarea
            id="company-about"
            value={form.description}
            rows={4}
            maxLength={2000}
            onChange={set('description')}
          />
        </FormField>
      </SettingsCard>
    </form>
  )
}

function PlanCard() {
  const { data: plan } = useGetCompanyPlanQuery()
  if (!plan) return null
  return (
    <SettingsCard title="Plan">
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{PLANS[plan.plan].name}</p>
        <p className="text-sm text-muted-foreground">{planPrice(plan.plan)}</p>
      </div>
      {plan.usage.length ? (
        <ul className="flex flex-col gap-2 text-sm text-foreground">
          {plan.usage.map((usage) => (
            <li key={usage.label}>{usageLine(usage)}</li>
          ))}
        </ul>
      ) : null}
    </SettingsCard>
  )
}

/** Admins: company details shown on job pages and the careers page, plus plan and usage. */
export function CompanySettings() {
  const { data, isLoading, isError, isFetching, refetch } = useGetMyCompanyQuery()
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-6" aria-hidden="true">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    )
  }
  if (isError || !data?.data) {
    return (
      <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
        Couldn&apos;t load company details.
      </ErrorState>
    )
  }
  return (
    <>
      <PlanCard />
      <CompanyForm key={data.data.updated_at} company={data.data} />
    </>
  )
}
