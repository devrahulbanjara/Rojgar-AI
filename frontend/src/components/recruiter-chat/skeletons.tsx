function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`recruiter-chat-skeleton ${className}`.trim()} />
}

export function RecruiterChatPanelSkeleton() {
  return (
    <div className="recruiter-chat-panel-skeleton" aria-hidden="true">
      <div className="recruiter-chat-panel-skeleton__messages">
        <div className="recruiter-chat-panel-skeleton__hero">
          <div className="recruiter-chat-panel-skeleton__hero-copy">
            <SkeletonLine className="recruiter-chat-skeleton--w-30 recruiter-chat-skeleton--title" />
            <SkeletonLine className="recruiter-chat-skeleton--w-55" />
          </div>
          <div className="recruiter-chat-panel-skeleton__hero-actions">
            <SkeletonLine className="recruiter-chat-skeleton--pill" />
            <SkeletonLine className="recruiter-chat-skeleton--pill" />
          </div>
        </div>

        <div className="recruiter-chat-panel-skeleton__cards">
          <div className="recruiter-chat-panel-skeleton__card">
            <SkeletonLine className="recruiter-chat-skeleton--w-40 recruiter-chat-skeleton--title-sm" />
            <SkeletonLine className="recruiter-chat-skeleton--w-85" />
            <SkeletonLine className="recruiter-chat-skeleton--w-70" />
          </div>
          <div className="recruiter-chat-panel-skeleton__card">
            <SkeletonLine className="recruiter-chat-skeleton--w-35 recruiter-chat-skeleton--title-sm" />
            <SkeletonLine className="recruiter-chat-skeleton--w-80" />
            <SkeletonLine className="recruiter-chat-skeleton--w-55" />
          </div>
        </div>

        <div className="recruiter-chat-panel-skeleton__conversation">
          <div className="recruiter-chat-panel-skeleton__message recruiter-chat-panel-skeleton__message--assistant">
            <SkeletonLine className="recruiter-chat-skeleton--w-55" />
            <SkeletonLine className="recruiter-chat-skeleton--w-80" />
            <SkeletonLine className="recruiter-chat-skeleton--w-45" />
          </div>

          <div className="recruiter-chat-panel-skeleton__message recruiter-chat-panel-skeleton__message--user">
            <SkeletonLine className="recruiter-chat-skeleton--w-40" />
            <SkeletonLine className="recruiter-chat-skeleton--w-70" />
          </div>

          <div className="recruiter-chat-panel-skeleton__message recruiter-chat-panel-skeleton__message--assistant">
            <SkeletonLine className="recruiter-chat-skeleton--w-35" />
            <SkeletonLine className="recruiter-chat-skeleton--w-85" />
            <SkeletonLine className="recruiter-chat-skeleton--w-60" />
          </div>
        </div>
      </div>

      <div className="recruiter-chat-panel-skeleton__input">
        <div className="recruiter-chat-panel-skeleton__input-box">
          <SkeletonLine className="recruiter-chat-skeleton--w-85" />
        </div>
      </div>
    </div>
  )
}

export function CandidateCardGridSkeleton() {
  return (
    <div className="recruiter-chat-candidate-grid">
      {[1, 2, 3].map((item) => (
        <div key={item} className="recruiter-chat-card recruiter-chat-card--candidate">
          <div className="recruiter-chat-skeleton-row recruiter-chat-skeleton-row--start">
            <div className="recruiter-chat-skeleton recruiter-chat-skeleton--avatar" />
            <div className="recruiter-chat-skeleton-stack recruiter-chat-skeleton-stack--grow">
              <SkeletonLine className="recruiter-chat-skeleton--w-70" />
              <SkeletonLine className="recruiter-chat-skeleton--w-50" />
            </div>
          </div>
          <div className="recruiter-chat-chip-row">
            <SkeletonLine className="recruiter-chat-skeleton--chip" />
            <SkeletonLine className="recruiter-chat-skeleton--chip" />
            <SkeletonLine className="recruiter-chat-skeleton--chip" />
          </div>
          <SkeletonLine />
        </div>
      ))}
    </div>
  )
}

export function SalaryCardSkeleton() {
  return (
    <div className="recruiter-chat-card recruiter-chat-card--salary">
      <div className="recruiter-chat-skeleton-row recruiter-chat-skeleton-row--between">
        <SkeletonLine className="recruiter-chat-skeleton--w-50" />
        <SkeletonLine className="recruiter-chat-skeleton--pill" />
      </div>
      <SkeletonLine className="recruiter-chat-skeleton--w-35" />
      <SkeletonLine className="recruiter-chat-skeleton--bar" />
      <SkeletonLine />
      <SkeletonLine className="recruiter-chat-skeleton--w-80" />
    </div>
  )
}

export function CandidateDetailSkeleton() {
  return (
    <div className="recruiter-chat-card recruiter-chat-card--detail">
      <div className="recruiter-chat-skeleton-row recruiter-chat-skeleton-row--start">
        <div className="recruiter-chat-skeleton recruiter-chat-skeleton--avatar-lg" />
        <div className="recruiter-chat-skeleton-stack recruiter-chat-skeleton-stack--grow">
          <SkeletonLine className="recruiter-chat-skeleton--w-40" />
          <SkeletonLine className="recruiter-chat-skeleton--w-55" />
          <SkeletonLine className="recruiter-chat-skeleton--pill" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine className="recruiter-chat-skeleton--w-85" />
    </div>
  )
}

export function JobEditDiffCardSkeleton() {
  return (
    <div className="recruiter-chat-card recruiter-chat-card--job-edit">
      <SkeletonLine className="recruiter-chat-skeleton--w-45" />
      <SkeletonLine className="recruiter-chat-skeleton--w-75" />
      <div className="recruiter-chat-diff-grid recruiter-chat-diff-grid--preview">
        <div className="recruiter-chat-diff-pane">
          <SkeletonLine className="recruiter-chat-skeleton--w-30" />
          <SkeletonLine className="recruiter-chat-skeleton--block" />
          <SkeletonLine className="recruiter-chat-skeleton--block" />
        </div>
        <div className="recruiter-chat-diff-pane">
          <SkeletonLine className="recruiter-chat-skeleton--w-30" />
          <SkeletonLine className="recruiter-chat-skeleton--block" />
          <SkeletonLine className="recruiter-chat-skeleton--block" />
        </div>
      </div>
    </div>
  )
}
