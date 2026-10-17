'use client'

import { notify } from '@/lib/notify'
import {
  type ApprovalItem,
  useApproveBusinessMutation,
  useGetApprovalsQuery,
  useRejectBusinessMutation,
  useRequestBusinessInfoMutation,
} from '@/store/services/adminApi'
import { formatDistanceToNowStrict } from 'date-fns'

import { PageContainer } from '@/components/app/AppShell'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { PageHeader } from '@/components/app/PageHeader'
import { StatusPill } from '@/components/app/StatusPill'
import { FileIcon, FilePdfIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { ReasonDialog } from './ReasonDialog'
import { adminError } from './adminError'

const ASK_LINES = [
  'Please add your PAN number.',
  'Please add a clear photo of your registration certificate.',
  'We could not reach you on the business phone. Please call us.',
]

const REJECT_LINES = [
  'We could not confirm this business.',
  'The PAN number does not match the business name.',
  'This looks like a duplicate of another business.',
]

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm text-foreground">{children}</dd>
    </div>
  )
}

function ApprovalCard({ item }: { item: ApprovalItem }) {
  const [approve, approving] = useApproveBusinessMutation()
  const [ask] = useRequestBusinessInfoMutation()
  const [reject] = useRejectBusinessMutation()

  async function onApprove() {
    try {
      await approve(item.id).unwrap()
      notify.success(`${item.name} approved`)
    } catch (error) {
      notify.error(adminError(error))
    }
  }

  async function run(action: Promise<unknown>, done: string) {
    try {
      await action
      notify.success(done)
    } catch (error) {
      notify.error(adminError(error))
      throw error
    }
  }

  return (
    <li className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">{item.name}</h2>
          <p className="text-sm text-muted-foreground">
            {[
              item.business_type,
              item.district,
              `Waiting ${formatDistanceToNowStrict(new Date(item.created_at))}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {item.info_requested ? <StatusPill tone="warning">Asked for more</StatusPill> : null}
      </div>

      <dl className="grid gap-3 sm:grid-cols-4">
        <Detail label="Business phone">{item.phone ?? '—'}</Detail>
        <Detail label="PAN number">{item.pan_number ?? 'Not given'}</Detail>
        <Detail label="Created by">
          {[item.created_by_name, item.created_by_contact].filter(Boolean).join(' · ') || '—'}
        </Detail>
        <Detail label="Certificate">
          {item.document_url ? (
            <a
              href={item.document_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {item.document_is_pdf ? <FilePdfIcon /> : <FileIcon />}
              Open
            </a>
          ) : (
            'Not given'
          )}
        </Detail>
      </dl>

      {item.info_requested ? (
        <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-foreground">
          We asked: {item.info_requested}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button loading={approving.isLoading} onClick={() => void onApprove()}>
          Approve
        </Button>
        <ReasonDialog
          trigger={<Button variant="outline">Ask for more info</Button>}
          title={`Ask ${item.name} for more`}
          label="Message (sent by SMS and email)"
          suggestions={ASK_LINES}
          confirmLabel="Send"
          onConfirm={(message) =>
            run(ask({ id: item.id, message }).unwrap(), `Message sent to ${item.name}`)
          }
        />
        <ReasonDialog
          trigger={<Button variant="ghost">Reject</Button>}
          title={`Reject ${item.name}?`}
          label="Reason (the owner sees this)"
          suggestions={REJECT_LINES}
          confirmLabel="Reject"
          destructive
          onConfirm={(reason) =>
            run(reject({ id: item.id, reason }).unwrap(), `${item.name} rejected`)
          }
        />
      </div>
    </li>
  )
}

/** Businesses waiting for approval, oldest first, each with everything needed to decide. */
export function ApprovalsView() {
  const { data, isLoading, isError, isFetching, refetch } = useGetApprovalsQuery()
  const items = data?.data ?? []

  return (
    <PageContainer>
      <PageHeader
        title="Approvals"
        facts={items.length ? [`${items.length} waiting`] : undefined}
      />
      {isLoading ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load the businesses waiting for approval.
        </ErrorState>
      ) : items.length === 0 ? (
        <EmptyState>No businesses waiting.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <ApprovalCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </PageContainer>
  )
}
