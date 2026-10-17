'use client'

import { type FormEvent, useState } from 'react'

import { parseApiError } from '@/lib/apiError'
import { notify } from '@/lib/notify'
import { localPhone } from '@/lib/session'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  useChangeMyPasswordMutation,
  useDeleteAccountMutation,
  useRemoveMyAuthAvatarMutation,
  useUpdateMeMutation,
  useUpdateMyAuthAvatarMutation,
} from '@/store/services/authApi'
import {
  useGetRecruiterPreferencesQuery,
  useUpdateRecruiterPreferencesMutation,
} from '@/store/services/recruiterPreferencesApi'
import { updateUser } from '@/store/slices/authSlice'

import { useLogout } from '@/components/app/AccountMenu'
import { ConfirmDialog } from '@/components/app/Feedback'
import { FormField } from '@/components/app/FormField'
import { ImagePicker } from '@/components/app/ImagePicker'
import { PasswordInput } from '@/components/app/PasswordInput'
import { PasswordRules, passwordMeetsRules } from '@/components/app/PasswordRules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

import { SettingsCard } from './SettingsShell'

function ProfileCard() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const [name, setName] = useState(user?.full_name ?? '')
  const [updateMe, saveState] = useUpdateMeMutation()
  const [uploadAvatar, uploadState] = useUpdateMyAuthAvatarMutation()
  const [removeAvatar, removeState] = useRemoveMyAuthAvatarMutation()
  if (!user) return null

  const trimmed = name.trim()
  const changed = trimmed !== user.full_name

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!trimmed) return
    try {
      await updateMe({ full_name: trimmed }).unwrap()
      notify.success('Saved')
    } catch (error) {
      notify.error(parseApiError(error, {}, "Couldn't save. Try again.").message)
    }
  }

  async function pick(file: File) {
    const body = new FormData()
    body.append('file', file)
    try {
      await uploadAvatar(body).unwrap()
      notify.success('Photo updated')
    } catch (error) {
      notify.error(parseApiError(error, {}, "Couldn't upload the photo. Try again.").message)
    }
  }

  async function remove() {
    if (!user) return
    try {
      await removeAvatar().unwrap()
      dispatch(updateUser({ ...user, avatar_url: null }))
    } catch {
      notify.error("Couldn't remove the photo. Try again.")
    }
  }

  return (
    <form onSubmit={(event) => void save(event)}>
      <SettingsCard
        title="Profile"
        footer={
          <Button type="submit" disabled={!changed || !trimmed} loading={saveState.isLoading}>
            Save
          </Button>
        }
      >
        <ImagePicker
          name={user.full_name}
          src={user.avatar_url}
          onPick={pick}
          onRemove={remove}
          busy={uploadState.isLoading || removeState.isLoading}
        />
        <FormField id="profile-name" label="Name" error={trimmed ? undefined : 'Enter your name.'}>
          <Input
            id="profile-name"
            value={name}
            maxLength={120}
            autoComplete="name"
            aria-invalid={!trimmed}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        {user.email ? (
          <FormField id="profile-email" label="Email">
            <Input id="profile-email" value={user.email} readOnly disabled />
          </FormField>
        ) : null}
        {user.phone ? (
          <FormField id="profile-phone" label="Mobile number">
            <Input id="profile-phone" value={localPhone(user.phone) ?? ''} readOnly disabled />
          </FormField>
        ) : null}
      </SettingsCard>
    </form>
  )
}

function PasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [change, state] = useChangeMyPasswordMutation()
  const [error, setError] = useState<string | null>(null)

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!passwordMeetsRules(next)) {
      setError('Use at least 8 characters with upper and lower case and a number.')
      return
    }
    setError(null)
    try {
      await change({ current_password: current || null, new_password: next }).unwrap()
      setCurrent('')
      setNext('')
      notify.success('Password changed')
    } catch (err) {
      setError(
        parseApiError(err, {}, "Couldn't change the password. Check your current one.").message,
      )
    }
  }

  return (
    <form onSubmit={(event) => void save(event)}>
      <SettingsCard
        title="Password"
        footer={
          <Button type="submit" variant="outline" disabled={!next} loading={state.isLoading}>
            Change password
          </Button>
        }
      >
        <FormField id="password-current" label="Current password">
          <PasswordInput
            id="password-current"
            value={current}
            autoComplete="current-password"
            onChange={(event) => setCurrent(event.target.value)}
          />
        </FormField>
        <FormField id="password-new" label="New password" error={error ?? undefined}>
          <PasswordInput
            id="password-new"
            value={next}
            autoComplete="new-password"
            aria-invalid={!!error}
            onChange={(event) => setNext(event.target.value)}
          />
          <PasswordRules value={next} />
        </FormField>
      </SettingsCard>
    </form>
  )
}

function NotificationsCard() {
  const { data, isLoading } = useGetRecruiterPreferencesQuery()
  const [update] = useUpdateRecruiterPreferencesMutation()
  const prefs = data?.data

  async function toggle(
    key: 'notification_email_enabled' | 'notification_in_app_enabled',
    value: boolean,
  ) {
    try {
      await update({ [key]: value }).unwrap()
    } catch {
      notify.error("Couldn't save. Try again.")
    }
  }

  const rows = [
    { key: 'notification_email_enabled' as const, label: 'Email me new applicants and bookings' },
    { key: 'notification_in_app_enabled' as const, label: 'Show them under the bell' },
  ]

  return (
    <SettingsCard title="Notifications">
      {isLoading || !prefs ? (
        <div className="flex flex-col gap-4" aria-hidden="true">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={row.key} className="font-normal text-foreground">
                {row.label}
              </Label>
              <Switch
                id={row.key}
                checked={prefs[row.key]}
                onCheckedChange={(value) => void toggle(row.key, value)}
              />
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  )
}

function DeleteAccount() {
  const [remove, state] = useDeleteAccountMutation()
  const logout = useLogout()

  async function confirm() {
    try {
      await remove().unwrap()
      await logout()
    } catch {
      notify.error("Couldn't delete your account. Try again.")
    }
  }

  return (
    <div className="flex justify-center">
      <ConfirmDialog
        trigger={
          <Button variant="link" className="text-muted-foreground">
            Delete my account
          </Button>
        }
        title="Delete your account?"
        consequence="You lose access straight away. This can't be undone."
        confirmLabel="Delete account"
        busy={state.isLoading}
        onConfirm={confirm}
      />
    </div>
  )
}

/** Personal settings: name and photo, password (email accounts), notifications. */
export function ProfileSettings() {
  // People who sign in with a mobile code have no password to change.
  const hasEmail = Boolean(useAppSelector((s) => s.auth.user?.email))
  return (
    <>
      <ProfileCard />
      {hasEmail ? <PasswordCard /> : null}
      <NotificationsCard />
      <DeleteAccount />
    </>
  )
}
