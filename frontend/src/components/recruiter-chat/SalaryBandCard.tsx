'use client'

import type { SalaryResearchResult } from '@/lib/types/recruiterChat'

import { formatMoney, getConfidenceTone } from './utils'

export function SalaryBandCard({ data }: { data: SalaryResearchResult }) {
  const hasRange = data.recommended_min != null && data.recommended_max != null
  const ceiling = hasRange ? Math.max(data.recommended_max ?? 0, 1) * 1.2 : 1
  const startPercent = hasRange ? ((data.recommended_min ?? 0) / ceiling) * 100 : 0
  const endPercent = hasRange ? ((data.recommended_max ?? 0) / ceiling) * 100 : 0

  return (
    <section className="recruiter-chat-card recruiter-chat-card--salary">
      <div className="recruiter-chat-salary-header">
        <div>
          <div className="recruiter-chat-card-title">{data.role}</div>
          <div className="recruiter-chat-card-subtitle">
            {data.country} · {data.year_context}
          </div>
        </div>

        <span
          className={`recruiter-chat-badge recruiter-chat-badge--${getConfidenceTone(data.confidence)}`}
        >
          {data.confidence}
        </span>
      </div>

      {hasRange ? (
        <div className="recruiter-chat-salary-range">
          <div className="recruiter-chat-salary-track">
            <div
              className="recruiter-chat-salary-fill"
              style={{
                left: `${startPercent}%`,
                width: `${Math.max(endPercent - startPercent, 8)}%`,
              }}
            />
          </div>
          <div className="recruiter-chat-salary-values">
            <span>{formatMoney(data.recommended_min, data.currency)}</span>
            <span>{formatMoney(data.recommended_max, data.currency)}</span>
          </div>
        </div>
      ) : null}

      {data.insufficient_evidence ? (
        <div className="recruiter-chat-muted-copy">
          <p>Insufficient data for a reliable salary band.</p>
          <p>{data.rationale}</p>
        </div>
      ) : (
        <p className="recruiter-chat-muted-copy">{data.rationale}</p>
      )}

      {data.sources.length ? (
        <div className="recruiter-chat-sources">
          <div className="recruiter-chat-sources-label">Sources</div>
          <div className="recruiter-chat-sources-list">
            {data.sources.map((source) => (
              <a
                key={`${source.source_name}-${source.url}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="recruiter-chat-source-link"
              >
                {source.source_name}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
