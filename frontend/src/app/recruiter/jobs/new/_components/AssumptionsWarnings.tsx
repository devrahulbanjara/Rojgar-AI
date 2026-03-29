'use client'

type AssumptionsWarningsProps = {
  assumptions: string[]
  warnings: string[]
  missingFields: string[]
}

function InfoList({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'default' | 'warning' | 'danger'
}) {
  if (items.length === 0) return null

  return (
    <section className={`job-ai-card assumptions-panel assumptions-panel--${tone} dash-card`}>
      <div className="job-ai-card__header dash-card__header">
        <div>
          <h2 className="job-ai-card__title dash-card__title">{title}</h2>
        </div>
      </div>

      <div className="job-ai-card__body dash-card__body">
        <ul className="assumptions-panel__list">
          {items.map((item) => (
            <li key={item} className="assumptions-panel__item">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function AssumptionsWarnings({
  assumptions,
  warnings,
  missingFields,
}: AssumptionsWarningsProps) {
  return (
    <div className="job-ai-stack">
      <InfoList title="Warnings" items={warnings} tone="warning" />
      <InfoList title="Missing Fields" items={missingFields} tone="danger" />
      <InfoList title="Assumptions" items={assumptions} tone="default" />
    </div>
  )
}
