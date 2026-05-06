'use client'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { notify } from '@/lib/notify'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useDeleteAccountMutation } from '@/store/services/authApi'
import {
  useGetRecruiterPreferencesQuery,
  useUpdateRecruiterPreferencesMutation,
} from '@/store/services/recruiterPreferencesApi'
import { clearCredentials } from '@/store/slices/authSlice'

import DashboardErrorState from '@/components/common/DashboardErrorState'

import CommunicationCard from './_components/CommunicationCard'
import { RecruiterSettingsDataSkeleton } from './_components/RecruiterSettingsSkeletons'
import SettingsDangerZone from './_components/SettingsDangerZone'
import WorkspaceCard from './_components/WorkspaceCard'
import { type SettingsForm, toSettingsForm } from './_components/settingsForm'
import styles from './page.module.scss'

export default function RecruiterSettingsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.primary_role === 'recruiter_admin'
  const { data, isLoading, isError, error, isFetching, refetch } = useGetRecruiterPreferencesQuery()
  const [updatePreferences, { isLoading: isSaving }] = useUpdateRecruiterPreferencesMutation()
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation()
  const [draftForm, setDraftForm] = useState<SettingsForm | null>(null)

  const baseForm = useMemo(() => toSettingsForm(data?.data), [data?.data])
  const form = draftForm ?? baseForm
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseForm), [form, baseForm])

  async function handleSave() {
    try {
      await updatePreferences({
        timezone: form.timezone || null,
        default_interview_duration_minutes: form.default_interview_duration_minutes,
        default_interview_buffer_minutes: form.default_interview_buffer_minutes,
        outreach_signature: form.outreach_signature || null,
        chat_default_scope: form.chat_default_scope,
      }).unwrap()
      setDraftForm(null)
      notify.success('Recruiter settings updated.')
    } catch (err) {
      const parsed = parseApiError(err, {}, 'Could not save recruiter settings.')
      notify.error(parsed.message)
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount().unwrap()
      dispatch(clearCredentials())
      router.push('/login')
    } catch {
      notify.error('Failed to delete account. Please try again.')
    }
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Recruiter Settings</h2>
          <p className="dash-page-header__subtitle">
            Personal workspace defaults for outreach and interviews.
          </p>
        </div>
        {!isLoading && !isError && (
          <div className="dash-page-header__right">
            {isDirty && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setDraftForm(null)}
                disabled={isSaving}
              >
                Discard
              </button>
            )}
            <button
              type="button"
              className={`btn btn--primary btn--sm${isSaving ? ' btn--loading' : ''}`}
              disabled={isSaving || !isDirty}
              onClick={() => void handleSave()}
            >
              Save changes
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <RecruiterSettingsDataSkeleton />
      ) : isError ? (
        <DashboardErrorState error={error} isRetrying={isFetching} onRetry={() => void refetch()} />
      ) : (
        <div className={styles.page}>
          <WorkspaceCard form={form} onChange={setDraftForm} />
          <CommunicationCard form={form} isAdmin={isAdmin} onChange={setDraftForm} />
          <SettingsDangerZone isDeleting={isDeleting} onDelete={handleDeleteAccount} />
        </div>
      )}
    </div>
  )
}
