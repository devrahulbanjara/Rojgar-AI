'use client'

import { useMemo, useState } from 'react'

import type { AuditLogItem } from '@/store/services/auditApi'

type AuditTrailCardProps = {
  title: string
  subtitle: string
  items: AuditLogItem[]
  emptyText: string
}

type AuditTrailCardSkeletonProps = {
  title: string
  subtitle: string
  itemCount?: number
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2)
}

export function AuditTrailCardSkeleton({
  title,
  subtitle,
  itemCount = 6,
}: AuditTrailCardSkeletonProps) {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__title">{title}</div>
          <div className="dash-card__subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="dash-card__body">
        <div className="audit-trail">
          <div className="audit-trail__list">
            {Array.from({ length: itemCount }).map((_, index) => (
              <div key={index} className="audit-trail__item audit-trail__item--skeleton">
                <div className="skeleton-block audit-trail__itemTitleSkeleton" />
                <div className="skeleton-block audit-trail__itemMetaSkeleton" />
              </div>
            ))}
          </div>

          <div className="audit-trail__detail audit-trail__detail--skeleton">
            <div className="audit-trail__headline">
              <div className="audit-trail__headlineStack">
                <div className="skeleton-block audit-trail__headlinePrimarySkeleton" />
                <div className="skeleton-block audit-trail__headlineSecondarySkeleton" />
              </div>
              <div className="skeleton-block audit-trail__headlineMetaSkeleton" />
            </div>

            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="audit-trail__section">
                <div className="skeleton-block audit-trail__sectionLabelSkeleton" />
                <div className="skeleton-block audit-trail__codeSkeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuditTrailCard({ title, subtitle, items, emptyText }: AuditTrailCardProps) {
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(items[0]?.id ?? null)
  const selectedAudit = useMemo(
    () => items.find((item) => item.id === selectedAuditId) ?? items[0] ?? null,
    [items, selectedAuditId],
  )

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__title">{title}</div>
          <div className="dash-card__subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="dash-card__body">
        {items.length === 0 ? (
          <div className="dash-navbar__notifications-empty">{emptyText}</div>
        ) : (
          <div className="audit-trail">
            <div className="audit-trail__list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`audit-trail__item${selectedAudit?.id === item.id ? ' audit-trail__item--active' : ''}`}
                  onClick={() => setSelectedAuditId(item.id)}
                >
                  <div className="audit-trail__itemTitle">
                    {item.action_type.replaceAll('_', ' ')} | {item.entity_type}
                  </div>
                  <div className="audit-trail__itemMeta">
                    {formatDateTime(item.created_at)}
                    {item.actor_role ? ` | ${item.actor_role}` : ''}
                  </div>
                </button>
              ))}
            </div>

            {selectedAudit ? (
              <div className="audit-trail__detail">
                <div className="audit-trail__headline">
                  <div>
                    <strong>{selectedAudit.action_type.replaceAll('_', ' ')}</strong>
                    <div className="cell-muted">
                      {selectedAudit.entity_type}
                      {selectedAudit.entity_id ? ` #${selectedAudit.entity_id}` : ''}
                    </div>
                  </div>
                  <div className="cell-muted">{formatDateTime(selectedAudit.created_at)}</div>
                </div>

                {selectedAudit.diff_json ? (
                  <div className="audit-trail__section">
                    <div className="recruiter-candidate-detail__label">Field changes</div>
                    <pre className="audit-trail__code">{prettyJson(selectedAudit.diff_json)}</pre>
                  </div>
                ) : null}

                {selectedAudit.before_json ? (
                  <div className="audit-trail__section">
                    <div className="recruiter-candidate-detail__label">Before</div>
                    <pre className="audit-trail__code">{prettyJson(selectedAudit.before_json)}</pre>
                  </div>
                ) : null}

                {selectedAudit.after_json ? (
                  <div className="audit-trail__section">
                    <div className="recruiter-candidate-detail__label">After</div>
                    <pre className="audit-trail__code">{prettyJson(selectedAudit.after_json)}</pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
