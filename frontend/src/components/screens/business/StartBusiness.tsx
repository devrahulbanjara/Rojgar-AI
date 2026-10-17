'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import { notify } from '@/lib/notify'
import { useAppSelector } from '@/store/hooks'
import { useLazyGetMeQuery, useUpdateMeMutation } from '@/store/services/authApi'
import {
  useCreateBusinessMutation,
  useGetBusinessOptionsQuery,
  useGetMyCompanyQuery,
  useUpdateVerificationMutation,
} from '@/store/services/companyApi'

import { FileUpload } from '@/components/app/FileUpload'
import { FormField } from '@/components/app/FormField'
import { AlertIcon } from '@/components/icons'
import { AuthCard } from '@/components/public/auth/AuthCard'
import { SignedInAs } from '@/components/public/auth/SignedInAs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Field = 'fullName' | 'name' | 'type' | 'district' | 'phone'
type Errors = Partial<Record<Field, string>>

const DOC_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp'

function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <AlertIcon />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

/** A person with no business yet: name, type, district and phone. Pending until approved. */
function CreateBusinessForm() {
  const t = useT()
  const router = useRouter()
  const user = useAppSelector((s) => s.auth.user)
  const { data: options } = useGetBusinessOptionsQuery()
  const [createBusiness, creating] = useCreateBusinessMutation()
  const [updateMe, savingName] = useUpdateMeMutation()
  const [getMe] = useLazyGetMeQuery()

  const needsName = !user?.full_name
  const [fullName, setFullName] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [district, setDistrict] = useState('')
  const [phone, setPhone] = useState(() => user?.phone?.replace(/^\+977/, '') ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const districts = useMemo(
    () => [...(options?.data.districts ?? [])].sort((a, b) => a.localeCompare(b)),
    [options],
  )

  function clear(field: Field) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    const found: Errors = {}
    if (needsName && fullName.trim().length < 2) found.fullName = t.auth.nameRequired
    if (name.trim().length < 2) found.name = t.auth.start.nameRequired
    if (!type) found.type = t.auth.start.typeRequired
    if (!district) found.district = t.auth.start.districtRequired
    if (phone.replace(/\D/g, '').length < 7) found.phone = t.auth.start.phoneRequired
    setErrors(found)
    if (Object.keys(found).length) return

    try {
      if (needsName) await updateMe({ full_name: fullName.trim() }).unwrap()
      const body = new FormData()
      body.append('name', name.trim())
      body.append('business_type', type)
      body.append('district', district)
      body.append('phone', phone.trim())
      await createBusiness(body).unwrap()
      await getMe().unwrap()
      notify.success(t.auth.start.created)
      router.replace('/recruiter')
    } catch (err) {
      const parsed = parseApiError(
        err,
        {
          full_name: 'fullName',
          name: 'name',
          business_type: 'type',
          district: 'district',
          phone: 'phone',
        },
        t.common.error,
      )
      if (Object.keys(parsed.fieldErrors).length) setErrors(parsed.fieldErrors as Errors)
      else setFormError(parsed.message)
    }
  }

  return (
    <AuthCard title={t.auth.start.title} below={<SignedInAs />}>
      <FormAlert message={formError} />
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-5">
        {needsName ? (
          <FormField id="full-name" label={t.auth.start.yourName} error={errors.fullName}>
            <Input
              id="full-name"
              autoComplete="name"
              className="h-10"
              value={fullName}
              maxLength={120}
              aria-invalid={!!errors.fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                clear('fullName')
              }}
            />
          </FormField>
        ) : null}
        <FormField id="business-name" label={t.auth.start.name} error={errors.name}>
          <Input
            id="business-name"
            autoComplete="organization"
            className="h-10"
            value={name}
            maxLength={120}
            aria-invalid={!!errors.name}
            onChange={(e) => {
              setName(e.target.value)
              clear('name')
            }}
          />
        </FormField>
        <FormField id="business-type" label={t.auth.start.type} error={errors.type}>
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value)
              clear('type')
            }}
          >
            <SelectTrigger id="business-type" className="h-10 w-full" aria-invalid={!!errors.type}>
              <SelectValue placeholder={t.auth.start.choose} />
            </SelectTrigger>
            <SelectContent>
              {(options?.data.types ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="district" label={t.auth.start.district} error={errors.district}>
          <Select
            value={district}
            onValueChange={(value) => {
              setDistrict(value)
              clear('district')
            }}
          >
            <SelectTrigger id="district" className="h-10 w-full" aria-invalid={!!errors.district}>
              <SelectValue placeholder={t.auth.start.choose} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {districts.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="business-phone" label={t.auth.start.phone} error={errors.phone}>
          <Input
            id="business-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98XXXXXXXX"
            className="h-10"
            value={phone}
            maxLength={20}
            aria-invalid={!!errors.phone}
            onChange={(e) => {
              setPhone(e.target.value)
              clear('phone')
            }}
          />
        </FormField>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={creating.isLoading || savingName.isLoading}
        >
          {t.auth.start.submit}
        </Button>
      </form>
    </AuthCard>
  )
}

/** Owner of a pending or not-approved business: PAN and the registration certificate. */
function VerificationForm({ businessId }: { businessId: string }) {
  const t = useT()
  const router = useRouter()
  const { data: company } = useGetMyCompanyQuery()
  const [save, saving] = useUpdateVerificationMutation()
  const [getMe] = useLazyGetMeQuery()
  const [pan, setPan] = useState<string | null>(null)
  const [doc, setDoc] = useState<File | null>(null)
  const [panError, setPanError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)

  const panValue = pan ?? company?.data.pan_number ?? ''

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    const digits = panValue.replace(/\D/g, '')
    if (digits && digits.length !== 9) return setPanError(t.auth.start.panInvalid)
    if (!digits && !doc && !company?.data.has_registration_doc) {
      return setFormError(t.auth.start.nothing)
    }
    const body = new FormData()
    body.append('pan_number', digits)
    if (doc) body.append('registration_doc', doc)
    try {
      await save({ businessId, body }).unwrap()
      await getMe().unwrap()
      notify.success(t.auth.start.sent)
      router.replace('/recruiter')
    } catch (err) {
      setFormError(parseApiError(err, {}, t.common.error).message)
    }
  }

  return (
    <AuthCard title={t.auth.start.detailsTitle} below={<SignedInAs />}>
      <FormAlert message={formError} />
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-5">
        <FormField id="pan" label={t.auth.start.pan} error={panError}>
          <Input
            id="pan"
            inputMode="numeric"
            className="h-10"
            value={panValue}
            maxLength={12}
            aria-invalid={!!panError}
            onChange={(e) => {
              setPan(e.target.value)
              setPanError(undefined)
            }}
          />
        </FormField>
        <FileUpload
          value={doc}
          onChange={setDoc}
          accept={DOC_TYPES}
          label={t.auth.start.certificate}
        />
        <Button type="submit" size="lg" className="w-full" loading={saving.isLoading}>
          {t.auth.start.send}
        </Button>
      </form>
    </AuthCard>
  )
}

/** /start: create a business, or (?step=details) add what staff need to approve it. */
export function StartBusiness() {
  const router = useRouter()
  const params = useSearchParams()
  const active = useAppSelector((s) => s.auth.user?.active_business ?? null)
  const wantsDetails = params.get('step') === 'details'
  const canAddDetails =
    active?.role === 'owner' &&
    active.business_status !== 'active' &&
    active.business_status !== 'suspended'

  // People who already work in a business have nothing to create here.
  const done = Boolean(active) && !(wantsDetails && canAddDetails)
  useEffect(() => {
    if (done) router.replace('/recruiter')
  }, [done, router])

  if (done) return null
  if (wantsDetails && active) return <VerificationForm businessId={active.business_id} />
  return <CreateBusinessForm />
}
