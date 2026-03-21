'use client'

import type { RecruiterChatSalaryPayload } from '@/store/services/recruiterChatApi'

import { formatMoney, getConfidenceTone } from './utils'

export default function SalaryBandCard({
  data,
}: {
  data: RecruiterChatSalaryPayload
}) {
  const minValue = data.min ?? data.recommended_min ?? null
  const maxValue = data.max ?? data.recommended_max ?? null
  const medianValue =
    data.median ?? (minValue != null && maxValue != null ? (minValue + maxValue) / 2 : null)
  const rangeSpan =
    minValue != null && maxValue != null && maxValue > minValue ? maxValue - minValue : null
  const markerPercent =
    rangeSpan != null && medianValue != null
      ? Math.min(100, Math.max(0, ((medianValue - minValue!) / rangeSpan) * 100))
      : 50

  return (
    <section className="recruiter-chat-card recruiter-chat-card--salary">
      <div className="recruiter-chat-card__header">
        <div>
          <div className="recruiter-chat-card__title">Salary research</div>
          <div className="recruiter-chat-card__subtitle">
            {data.role} in {data.country}
            {data.year_context ? ` • ${data.year_context}` : ''}
          </div>
        </div>
        <span className={`recruiter-chat-pill recruiter-chat-pill--${getConfidenceTone(data.confidence)}`}>
          {data.confidence} confidence
        </span>
      </div>

      {minValue == null && maxValue == null ? (
        <p className="recruiter-chat-card__body-copy">Insufficient data for a reliable salary band.</p>
      ) : (
        <div className="recruiter-chat-salary-band">
          <div className="recruiter-chat-salary-band__labels">
            <span>{formatMoney(minValue, data.currency)}</span>
            <span>{formatMoney(maxValue, data.currency)}</span>
          </div>
          <div className="recruiter-chat-salary-band__track">
            <div className="recruiter-chat-salary-band__fill" />
            {medianValue != null ? (
              <div className="recruiter-chat-salary-band__marker" style={{ left: `${markerPercent}%` }}>
                <span>{formatMoney(medianValue, data.currency)}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {data.rationale ? <p className="recruiter-chat-card__body-copy">{data.rationale}</p> : null}

      {data.sources.length > 0 ? (
        <div className="recruiter-chat-card__sources">
          {data.sources.map((source) => (
            <a
              key={`${source.url}-${source.title ?? source.source_name ?? 'source'}`}
              className="recruiter-chat-source"
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.title ?? source.source_name ?? 'Source'}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  )
}
