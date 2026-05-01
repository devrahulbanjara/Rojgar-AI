'use client'

import { useMemo, useState } from 'react'

import {
  AUDIT_CATEGORIES,
  type AuditLogItem,
  type CompanyAuditParams,
  useGetCompanyAuditLogsQuery,
} from '@/store/services/auditApi'
import { useGetCompanyRecruitersQuery } from '@/store/services/companyApi'

const CATEGORY_LABELS: Record<string, string> = {
  auth: 'Auth & Access',
  jobs: 'Jobs',
  pipeline: 'Pipeline',
  outreach: 'Outreach',
  interviews: 'Interviews',
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: '#6366f1',
  jobs: '#0891b2',
  pipeline: '#16a34a',
  outreach: '#d97706',
  interviews: '#9333ea',
}

function formatAbsolute(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < hour) {
    const m = Math.max(1, Math.floor(diffMs / minute))
    return `${m}m ago`
  }
  if (diffMs < day) {
    const h = Math.max(1, Math.floor(diffMs / hour))
    return `${h}h ago`
  }
  const d = Math.floor(diffMs / day)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  return formatAbsolute(iso)
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  const color = CATEGORY_COLORS[category] ?? '#6b7280'
  const label = CATEGORY_LABELS[category] ?? category
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 7px',
        borderRadius: '4px',
        fontSize: '0.69rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        background: `${color}1A`,
        color,
        border: `1px solid ${color}33`,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

function DiffTable({ data }: { data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) return <p className="cell-muted">—</p>
  return (
    <table
      style={{
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        fontSize: '0.8rem',
      }}
    >
      <colgroup>
        <col style={{ width: '28%' }} />
        <col style={{ width: '36%' }} />
        <col style={{ width: '36%' }} />
      </colgroup>
      <tbody>
        {Object.entries(data).map(([key, val]) => {
          const entry = val as { before?: unknown; after?: unknown }
          const hasDiff =
            typeof val === 'object' && val !== null && ('before' in val || 'after' in val)
          return (
            <tr key={key} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td
                style={{
                  padding: '4px 8px 4px 0',
                  color: 'var(--color-muted)',
                  verticalAlign: 'top',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {key}
              </td>
              {hasDiff ? (
                <>
                  <td
                    style={{
                      padding: '4px 6px',
                      color: '#ef4444',
                      verticalAlign: 'top',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      overflow: 'hidden',
                    }}
                  >
                    {JSON.stringify(entry.before)}
                  </td>
                  <td
                    style={{
                      padding: '4px 0 4px 6px',
                      color: '#22c55e',
                      verticalAlign: 'top',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      overflow: 'hidden',
                    }}
                  >
                    {JSON.stringify(entry.after)}
                  </td>
                </>
              ) : (
                <td
                  colSpan={2}
                  style={{
                    padding: '4px 0 4px 6px',
                    verticalAlign: 'top',
                    wordBreak: 'break-all',
                    overflowWrap: 'anywhere',
                    overflow: 'hidden',
                  }}
                >
                  {JSON.stringify(val)}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function JsonTable({ data }: { data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) return <p className="cell-muted">—</p>
  return (
    <table
      style={{
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        fontSize: '0.8rem',
      }}
    >
      <colgroup>
        <col style={{ width: '35%' }} />
        <col style={{ width: '65%' }} />
      </colgroup>
      <tbody>
        {Object.entries(data).map(([key, val]) => (
          <tr key={key} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td
              style={{
                padding: '4px 8px 4px 0',
                color: 'var(--color-muted)',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.75rem',
                verticalAlign: 'top',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {key}
            </td>
            <td
              style={{
                padding: '4px 0 4px 6px',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                overflow: 'hidden',
                verticalAlign: 'top',
              }}
            >
              {JSON.stringify(val)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function AuditDetailPanel({ item }: { item: AuditLogItem }) {
  const [showIds, setShowIds] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.925rem' }}>
          {item.message ?? item.action_type}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <CategoryBadge category={item.category} />
          <span className="cell-muted" style={{ fontSize: '0.8rem' }}>
            {formatAbsolute(item.created_at)}
          </span>
        </div>
      </div>

      {item.diff_json && Object.keys(item.diff_json).length > 0 ? (
        <div>
          <div className="dash-card__label" style={{ marginBottom: '0.4rem' }}>
            Field changes
          </div>
          <DiffTable data={item.diff_json} />
        </div>
      ) : null}

      {item.before_json && Object.keys(item.before_json).length > 0 ? (
        <div>
          <div className="dash-card__label" style={{ marginBottom: '0.4rem' }}>
            Before
          </div>
          <JsonTable data={item.before_json} />
        </div>
      ) : null}

      {item.after_json && Object.keys(item.after_json).length > 0 ? (
        <div>
          <div className="dash-card__label" style={{ marginBottom: '0.4rem' }}>
            After
          </div>
          <JsonTable data={item.after_json} />
        </div>
      ) : null}

      {item.metadata && Object.keys(item.metadata).length > 0 ? (
        <div>
          <div className="dash-card__label" style={{ marginBottom: '0.4rem' }}>
            Details
          </div>
          <JsonTable data={item.metadata} />
        </div>
      ) : null}

      <div>
        <button
          type="button"
          className="auth__inline-link"
          onClick={() => setShowIds((v) => !v)}
          style={{ fontSize: '0.8rem' }}
        >
          {showIds ? 'Hide' : 'Show'} entity IDs
        </button>
        {showIds ? (
          <div style={{ marginTop: '0.5rem' }}>
            <JsonTable
              data={{
                id: item.id,
                entity_type: item.entity_type,
                entity_id: item.entity_id,
                actor_user_id: item.actor_user_id,
                target_user_id: item.target_user_id,
                company_id: item.company_id,
                request_id: item.request_id,
                ip_address: item.ip_address,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function RecruiterAuditPage() {
  const [category, setCategory] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const params: CompanyAuditParams = useMemo(
    () => ({
      limit: 300,
      category: category || undefined,
      actor_user_id: actorUserId || undefined,
      start_at: startAt || undefined,
      end_at: endAt || undefined,
    }),
    [category, actorUserId, startAt, endAt],
  )

  const {
    data: logsResp,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetCompanyAuditLogsQuery(params)
  const { data: recruitersResp } = useGetCompanyRecruitersQuery()

  const logs = useMemo(() => logsResp?.data ?? [], [logsResp?.data])
  const recruiters = recruitersResp?.data ?? []

  const selectedItem = useMemo(
    () => (selectedId ? (logs.find((l) => l.id === selectedId) ?? null) : null),
    [selectedId, logs],
  )

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Audit Trail</h2>
          <p className="dash-page-header__subtitle">
            Business-meaningful events for your company — who did what and when.
          </p>
        </div>
        <div className="dash-page-header__actions">
          {logs.length > 0 ? <span className="page-header-hint">{logs.length} events</span> : null}
        </div>
      </div>

      {/* Filters */}
      <div className="dash-card">
        <div
          className="dash-card__body"
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <label className="auth__field" style={{ flex: '1 1 160px', minWidth: 0 }}>
            <span className="auth__label">Category</span>
            <select
              className="resume-field__input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {AUDIT_CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="auth__field" style={{ flex: '1 1 180px', minWidth: 0 }}>
            <span className="auth__label">Recruiter</span>
            <select
              className="resume-field__input"
              value={actorUserId}
              onChange={(e) => setActorUserId(e.target.value)}
            >
              <option value="">All recruiters</option>
              {recruiters.map((r) => (
                <option key={r.user_id} value={r.user_id}>
                  {r.full_name}
                </option>
              ))}
            </select>
          </label>

          <label className="auth__field" style={{ flex: '1 1 150px', minWidth: 0 }}>
            <span className="auth__label">From</span>
            <input
              type="date"
              className="resume-field__input"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value ? `${e.target.value}T00:00:00Z` : '')}
            />
          </label>

          <label className="auth__field" style={{ flex: '1 1 150px', minWidth: 0 }}>
            <span className="auth__label">To</span>
            <input
              type="date"
              className="resume-field__input"
              value={endAt.slice(0, 10)}
              onChange={(e) => setEndAt(e.target.value ? `${e.target.value}T23:59:59Z` : '')}
            />
          </label>

          {category || actorUserId || startAt || endAt ? (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => {
                setCategory('')
                setActorUserId('')
                setStartAt('')
                setEndAt('')
              }}
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {/* Two-panel layout */}
      <div
        className="dash-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Left: event list */}
        <div
          className="dash-card"
          style={{ maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}
        >
          <div className="dash-card__header" style={{ flexShrink: 0 }}>
            <div>
              <div className="dash-card__title">Events</div>
              <div className="dash-card__subtitle">Newest first. Click to inspect.</div>
            </div>
          </div>
          <div className="dash-card__body" style={{ overflowY: 'auto', padding: 0, flexGrow: 1 }}>
            {isLoading ? (
              <div style={{ padding: '1rem' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton-block"
                    style={{ height: 56, marginBottom: 4, borderRadius: 6 }}
                  />
                ))}
              </div>
            ) : isError ? (
              <div style={{ padding: '1rem' }}>
                <div className="empty-state__desc">Could not load audit events.</div>
                <button
                  className="btn btn--outline btn--sm"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => void refetch()}
                  disabled={isFetching}
                >
                  {isFetching ? 'Retrying…' : 'Retry'}
                </button>
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <p className="cell-muted">No audit events match the current filters.</p>
              </div>
            ) : (
              <div className="activity-list activity-list--panel">
                {logs.map((item) => {
                  const active = selectedId === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(active ? null : item.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: active
                          ? 'var(--color-surface-raised, rgba(99,102,241,0.06))'
                          : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        padding: '0.65rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <CategoryBadge category={item.category} />
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            color: 'var(--color-text)',
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.message ?? item.action_type}
                        </span>
                      </div>
                      <span
                        className="cell-muted"
                        style={{ fontSize: '0.75rem' }}
                        title={formatAbsolute(item.created_at)}
                      >
                        {formatRelative(item.created_at)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div
          className="dash-card"
          style={{ maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}
        >
          <div className="dash-card__header" style={{ flexShrink: 0 }}>
            <div>
              <div className="dash-card__title">Event detail</div>
              <div className="dash-card__subtitle">
                {selectedItem
                  ? 'Field changes, before / after, entity IDs.'
                  : 'Select an event to inspect it.'}
              </div>
            </div>
          </div>
          <div className="dash-card__body" style={{ overflowY: 'auto', flexGrow: 1 }}>
            {selectedItem ? (
              <AuditDetailPanel item={selectedItem} />
            ) : (
              <div className="profile-empty">
                <p className="cell-muted">Select an event on the left to see details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
