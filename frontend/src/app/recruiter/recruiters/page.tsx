'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getInitials } from '@/lib/mediaValidation'
import { useAppSelector } from '@/store/hooks'
import {
  useGetCompanyRecruitersQuery,
  useRemoveRecruiterMutation,
  useUpdateRecruiterStatusMutation,
} from '@/store/services/companyApi'
import type { RecruiterMember } from '@/store/services/companyApi'
import { Mail, Search, UserRound, X } from 'lucide-react'

function getAvatarColor(name: string): string {
  const colors = ['#0f766e', '#2563eb', '#dc2626', '#9333ea', '#d97706', '#0891b2']
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return colors[seed % colors.length]
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusDot({ status }: { status: RecruiterMember['status'] }) {
  const map = {
    active: { label: 'Active', color: '#0cce6b' },
    pending: { label: 'Pending', color: '#f59e0b' },
    rejected: { label: 'Rejected', color: '#ef4444' },
  }
  const { label, color } = map[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: '0.84rem', fontWeight: 500, color: '#374151' }}>{label}</span>
    </span>
  )
}

function RecruitersTableSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="dash-card">
      <div className="table-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Recruiter</th>
              <th>Status</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, index) => (
              <tr key={index}>
                <td>
                  <div className="cell-user">
                    <div className="skeleton-block cell-user__avatar" />
                    <div className="recruiter-candidates-table__identity">
                      <div
                        className="skeleton-block"
                        style={{ width: `${110 + (index % 3) * 20}px`, height: '1.125rem' }}
                      />
                      <div
                        className="skeleton-block"
                        style={{
                          width: `${140 + (index % 2) * 30}px`,
                          height: '0.875rem',
                          marginTop: '4px',
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <div
                      className="skeleton-block"
                      style={{ width: 7, height: 7, borderRadius: '50%' }}
                    />
                    <div className="skeleton-block" style={{ width: '52px', height: '0.875rem' }} />
                  </div>
                </td>
                <td>
                  <div className="skeleton-block" style={{ width: '100px', height: '1.125rem' }} />
                </td>
                <td>
                  <div
                    className="skeleton-block"
                    style={{ width: '80px', height: '2rem', borderRadius: '999px' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const STATUS_FILTER_OPTIONS: Array<{ value: 'all' | RecruiterMember['status']; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

export default function RecruitersPage() {
  const router = useRouter()
  const { user } = useAppSelector((s) => s.auth)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RecruiterMember['status']>('all')

  useEffect(() => {
    if (user && user.primary_role !== 'recruiter_admin') {
      toast.error('Only company admins can manage recruiters.')
      router.replace('/recruiter')
    }
  }, [user, router])

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetCompanyRecruitersQuery(undefined, {
    skip: user?.primary_role !== 'recruiter_admin',
  })

  const [updateStatus, { isLoading: isUpdating }] = useUpdateRecruiterStatusMutation()
  const [removeRecruiter, { isLoading: isRemoving }] = useRemoveRecruiterMutation()

  const recruiters: RecruiterMember[] = useMemo(() => response?.data ?? [], [response?.data])

  const filteredRecruiters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return recruiters.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!normalizedSearch) return true
      return [r.full_name, r.email].some((v) => v.toLowerCase().includes(normalizedSearch))
    })
  }, [recruiters, searchTerm, statusFilter])

  const activeCount = recruiters.filter((r) => r.status === 'active').length
  const pendingCount = recruiters.filter((r) => r.status === 'pending').length

  if (!user || user.primary_role !== 'recruiter_admin') return null

  async function handleApprove(membershipId: string) {
    try {
      await updateStatus({ membershipId, status: 'active' }).unwrap()
      toast.success('Recruiter approved.')
    } catch {
      toast.error('Failed to approve recruiter.')
    }
  }

  async function handleReject(membershipId: string) {
    try {
      await updateStatus({ membershipId, status: 'rejected' }).unwrap()
      toast.success('Recruiter request rejected.')
    } catch {
      toast.error('Failed to reject recruiter.')
    }
  }

  async function handleRemove(membershipId: string) {
    try {
      await removeRecruiter(membershipId).unwrap()
      toast.success('Recruiter removed.')
    } catch {
      toast.error('Failed to remove recruiter.')
    }
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Recruiters</h2>
          <p className="dash-page-header__subtitle">
            Manage your company&apos;s recruiting team members, approve requests, and control
            access.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className="page-header-hint">
            {isLoading
              ? 'Loading...'
              : `${activeCount} active${pendingCount > 0 ? ` · ${pendingCount} pending` : ''}`}
          </span>
          <Link href="/recruiter/company/settings" className="btn btn--primary btn--sm">
            Invite recruiter
          </Link>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__body recruiter-candidates-toolbar">
          <div className="dash-page-toolbar__search recruiter-candidates-toolbar__search">
            <span className="dash-page-toolbar__icon">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              type="text"
              className="dash-page-toolbar__input"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            {searchTerm ? (
              <button
                type="button"
                className="dash-page-toolbar__clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <select
            className="resume-field__input recruiter-candidates-toolbar__select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | RecruiterMember['status'])
            }
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <RecruitersTableSkeleton count={4} />
      ) : isError ? (
        <div className="dash-card">
          <div className="dash-card__body">
            Failed to load recruiters.{' '}
            <button className="auth__inline-link" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        </div>
      ) : filteredRecruiters.length === 0 ? (
        <div className="dash-card">
          <div className="dash-card__body dash-empty-state">
            <UserRound className="dash-empty-state__icon" />
            <p>No recruiters match these filters.</p>
          </div>
        </div>
      ) : (
        <div className="dash-card">
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Recruiter</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRecruiters.map((recruiter) => (
                  <RecruiterRow
                    key={recruiter.membership_id}
                    recruiter={recruiter}
                    isBusy={isUpdating || isRemoving}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRemove={handleRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function RecruiterRow({
  recruiter,
  isBusy,
  onApprove,
  onReject,
  onRemove,
}: {
  recruiter: RecruiterMember
  isBusy: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onRemove: (id: string) => void
}) {
  const initials = getInitials(recruiter.full_name, 'R')
  const color = getAvatarColor(recruiter.full_name)

  return (
    <tr>
      <td>
        <div className="cell-user">
          <div
            className="cell-user__avatar"
            style={
              {
                '--avatar-bg': color + '1A',
                '--avatar-color': color,
                backgroundImage: recruiter.avatar_url ? `url(${recruiter.avatar_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } as CSSProperties
            }
          >
            {!recruiter.avatar_url && initials}
          </div>
          <div className="recruiter-candidates-table__identity">
            <div className="recruiter-candidates-table__name">{recruiter.full_name}</div>
            <div className="recruiter-candidates-table__meta">
              <span>
                <Mail size={12} aria-hidden="true" />
                {recruiter.email}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td>
        <StatusDot status={recruiter.status} />
      </td>
      <td className="cell-muted">{formatDate(recruiter.joined_at)}</td>
      <td>
        <div className="cell-actions" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
          {recruiter.status === 'pending' && (
            <>
              <button
                className="btn btn--success btn--sm"
                disabled={isBusy}
                onClick={() => onApprove(recruiter.membership_id)}
              >
                Approve
              </button>
              <button
                className="btn btn--danger btn--sm"
                disabled={isBusy}
                onClick={() => onReject(recruiter.membership_id)}
              >
                Reject
              </button>
            </>
          )}
          {recruiter.status === 'active' && (
            <button
              className="btn btn--ghost btn--sm recruiters-remove-btn"
              disabled={isBusy}
              onClick={() => onRemove(recruiter.membership_id)}
            >
              Remove
            </button>
          )}
          {recruiter.status === 'rejected' && (
            <button
              className="btn btn--outline btn--sm"
              disabled={isBusy}
              onClick={() => onApprove(recruiter.membership_id)}
            >
              Re-approve
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
