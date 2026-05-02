'use client'

import { useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { notify } from '@/lib/notify'
import { useAppSelector } from '@/store/hooks'
import {
  useGetCompanyRecruitersQuery,
  useRemoveRecruiterMutation,
  useUpdateRecruiterStatusMutation,
} from '@/store/services/companyApi'
import type { RecruiterMember } from '@/store/services/companyApi'
import { Mail, UserRound } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import { FilterSelect, SearchInput, Toolbar, ToolbarCount } from '@/components/common/Toolbar'

import styles from './RecruitersPanel.module.scss'

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
    <span className={styles.status}>
      <span className={styles.statusDot} style={{ backgroundColor: color }} />
      <span className={styles.statusLabel}>{label}</span>
    </span>
  )
}

function RecruitersGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.skeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} />
      ))}
    </div>
  )
}

const STATUS_FILTER_OPTIONS: Array<{ value: 'all' | RecruiterMember['status']; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

export default function RecruitersPanel() {
  const router = useRouter()
  const { user } = useAppSelector((s) => s.auth)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RecruiterMember['status']>('all')

  useEffect(() => {
    if (user && user.primary_role !== 'recruiter_admin') {
      notify.error('Only company admins can manage recruiters.')
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

  if (!user || user.primary_role !== 'recruiter_admin') return null

  async function handleApprove(membershipId: string) {
    try {
      await updateStatus({ membershipId, status: 'active' }).unwrap()
      notify.success('Recruiter approved.')
    } catch {
      notify.error('Failed to approve recruiter.')
    }
  }

  async function handleReject(membershipId: string) {
    try {
      await updateStatus({ membershipId, status: 'rejected' }).unwrap()
      notify.success('Recruiter request rejected.')
    } catch {
      notify.error('Failed to reject recruiter.')
    }
  }

  async function handleRemove(membershipId: string) {
    try {
      await removeRecruiter(membershipId).unwrap()
      notify.success('Recruiter removed.')
    } catch {
      notify.error('Failed to remove recruiter.')
    }
  }

  return (
    <>
      <Toolbar>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name or email"
        />
        <FilterSelect<'all' | RecruiterMember['status']>
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Filter by status"
          options={STATUS_FILTER_OPTIONS}
        />
        <ToolbarCount>
          {filteredRecruiters.length} recruiter{filteredRecruiters.length === 1 ? '' : 's'} found
        </ToolbarCount>
      </Toolbar>

      {isLoading ? (
        <RecruitersGridSkeleton count={6} />
      ) : isError ? (
        <div className={styles.empty}>
          <UserRound size={28} aria-hidden="true" />
          <p>Failed to load recruiters.</p>
          <button className="btn btn--secondary btn--sm" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      ) : filteredRecruiters.length === 0 ? (
        <div className={styles.empty}>
          <UserRound size={28} aria-hidden="true" />
          <p>No recruiters match these filters.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredRecruiters.map((recruiter) => (
            <RecruiterCard
              key={recruiter.membership_id}
              recruiter={recruiter}
              isBusy={isUpdating || isRemoving}
              onApprove={handleApprove}
              onReject={handleReject}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </>
  )
}

function RecruiterCard({
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
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Avatar
          name={recruiter.full_name}
          src={recruiter.avatar_url}
          seed={recruiter.user_id}
          className={styles.avatar}
          sizes="44px"
        />
        <div className={styles.identity}>
          <p className={styles.name}>{recruiter.full_name}</p>
          <p className={styles.email}>
            <Mail size={14} aria-hidden="true" />
            {recruiter.email}
          </p>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          <StatusDot status={recruiter.status} />
          <span className={styles.joined}>{formatDate(recruiter.joined_at)}</span>
        </div>

        <div className={styles.cardActions}>
          {recruiter.status === 'pending' && (
            <>
              <button
                className="btn btn--primary btn--sm"
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
              className="btn btn--danger btn--sm"
              disabled={isBusy}
              onClick={() => onRemove(recruiter.membership_id)}
            >
              Remove
            </button>
          )}
          {recruiter.status === 'rejected' && (
            <button
              className="btn btn--secondary btn--sm"
              disabled={isBusy}
              onClick={() => onApprove(recruiter.membership_id)}
            >
              Re-approve
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
