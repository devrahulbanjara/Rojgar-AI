'use client'

import { type FormEvent, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import { notify } from '@/lib/notify'
import { useMounted } from '@/lib/useMounted'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useLazyGetMeQuery, useUpdateMeMutation } from '@/store/services/authApi'
import { baseApi } from '@/store/services/baseApi'
import { useAcceptInviteMutation, useGetInvitePreviewQuery } from '@/store/services/companyApi'

import { Spinner } from '@/components/app/Ai'
import { FormField } from '@/components/app/FormField'
import { AlertIcon } from '@/components/icons'
import { AuthCard } from '@/components/public/auth/AuthCard'
import { PhoneCodeForm } from '@/components/public/auth/PhoneCodeForm'
import { SignedInAs } from '@/components/public/auth/SignedInAs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** /invite/[token]: see who invited you, sign in with your mobile if needed, and join. */
export function JoinBusiness({ token }: { token: string }) {
  const t = useT()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const mounted = useMounted()
  const stored = useAppSelector((s) => s.auth.user)
  const user = mounted ? stored : null
  const { data, isLoading, isError } = useGetInvitePreviewQuery(token)
  const [accept, accepting] = useAcceptInviteMutation()
  const [updateMe, savingName] = useUpdateMeMutation()
  const [getMe] = useLazyGetMeQuery()
  const [fullName, setFullName] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)

  const invite = data?.data

  async function join(needsName: boolean) {
    setFormError(null)
    try {
      if (needsName) await updateMe({ full_name: fullName.trim() }).unwrap()
      await accept(token).unwrap()
      // Lists cached for another business must not show in this one.
      dispatch(baseApi.util.resetApiState())
      await getMe().unwrap()
      if (invite) notify.success(t.auth.invite.joined(invite.business_name))
      router.replace('/recruiter')
    } catch (err) {
      setFormError(parseApiError(err, {}, t.common.error).message)
    }
  }

  if (isLoading || !mounted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  if (isError || !invite) {
    return (
      <AuthCard title={t.auth.verify.invalid}>
        <p className="text-sm text-foreground">{t.auth.invite.broken}</p>
      </AuthCard>
    )
  }

  const role = t.auth.invite.roles[invite.role]
  const title = t.auth.invite.title(invite.business_name)

  if (invite.problem) {
    return (
      <AuthCard title={title}>
        <p className="text-sm text-foreground">{invite.problem}</p>
        {user ? (
          <Button asChild variant="outline" className="w-full">
            <Link href="/">{t.nav.openApp}</Link>
          </Button>
        ) : null}
      </AuthCard>
    )
  }

  const alert = formError ? (
    <Alert variant="destructive">
      <AlertIcon />
      <AlertDescription>{formError}</AlertDescription>
    </Alert>
  ) : null

  if (!user) {
    return (
      <AuthCard
        title={title}
        below={
          <Link
            href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="font-medium text-foreground hover:underline"
          >
            {t.auth.phone.useEmail}
          </Link>
        }
      >
        <p className="text-sm text-foreground">{t.auth.invite.as(role, invite.invited_by)}</p>
        {alert}
        <PhoneCodeForm
          onSignedIn={(signedIn) => {
            // New numbers have no name yet: the next screen asks for it before joining.
            if (signedIn.user.full_name) void join(false)
          }}
        />
      </AuthCard>
    )
  }

  const needsName = !user.full_name

  function submit(event: FormEvent) {
    event.preventDefault()
    if (needsName && fullName.trim().length < 2) return setNameError(t.auth.nameRequired)
    void join(needsName)
  }

  return (
    <AuthCard title={title} below={<SignedInAs to={`/invite/${token}`} />}>
      <p className="text-sm text-foreground">{t.auth.invite.as(role, invite.invited_by)}</p>
      {alert}
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {needsName ? (
          <FormField id="full-name" label={t.auth.start.yourName} error={nameError}>
            <Input
              id="full-name"
              autoComplete="name"
              className="h-10"
              value={fullName}
              maxLength={120}
              aria-invalid={!!nameError}
              onChange={(e) => {
                setFullName(e.target.value)
                setNameError(undefined)
              }}
            />
          </FormField>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={accepting.isLoading || savingName.isLoading}
        >
          {t.auth.invite.join}
        </Button>
      </form>
    </AuthCard>
  )
}
