function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`recruiter-chat-skeleton ${className}`.trim()} />
}

function ThreadBubbleSkeleton({
  type,
  withCard = false,
}: {
  type: 'assistant' | 'user'
  withCard?: boolean
}) {
  if (type === 'user') {
    return (
      <div className="recruiter-chat-panel-skeleton__row recruiter-chat-panel-skeleton__row--user">
        <div className="recruiter-chat-panel-skeleton__user-bubble">
          <SkeletonLine className="recruiter-chat-skeleton--w-75" />
          <SkeletonLine className="recruiter-chat-skeleton--w-45" />
        </div>
      </div>
    )
  }

  return (
    <div className="recruiter-chat-panel-skeleton__row recruiter-chat-panel-skeleton__row--assistant">
      <div className="recruiter-chat-skeleton recruiter-chat-skeleton--avatar-sm" />
      <div className="recruiter-chat-panel-skeleton__assistant-stack">
        <div className="recruiter-chat-panel-skeleton__assistant-bubble">
          <SkeletonLine className="recruiter-chat-skeleton--w-35" />
          <SkeletonLine className="recruiter-chat-skeleton--w-85" />
          <SkeletonLine className="recruiter-chat-skeleton--w-55" />
        </div>

        {withCard ? (
          <div className="recruiter-chat-panel-skeleton__tool-card">
            <SkeletonLine className="recruiter-chat-skeleton--w-25" />
            <div className="recruiter-chat-panel-skeleton__mini-card-list">
              {[1, 2].map((item) => (
                <div key={item} className="recruiter-chat-panel-skeleton__mini-card">
                  <SkeletonLine className="recruiter-chat-skeleton--w-70 recruiter-chat-skeleton--title-sm" />
                  <SkeletonLine className="recruiter-chat-skeleton--w-40" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function RecruiterChatPanelSkeleton() {
  return (
    <div className="recruiter-chat-panel-skeleton" aria-hidden="true">
      <div className="recruiter-chat-panel-skeleton__thread">
        <div className="recruiter-chat-panel-skeleton__scroll-view">
          <div className="recruiter-chat-panel-skeleton__message-view">
            <ThreadBubbleSkeleton type="assistant" />
            <ThreadBubbleSkeleton type="user" />
            <ThreadBubbleSkeleton type="assistant" withCard />
            <ThreadBubbleSkeleton type="assistant" />
          </div>
        </div>
      </div>

      <div className="recruiter-chat-panel-skeleton__composer">
        <div className="recruiter-chat-panel-skeleton__input-shell">
          <SkeletonLine className="recruiter-chat-skeleton--w-85 recruiter-chat-panel-skeleton__input-line" />
          <div className="recruiter-chat-skeleton recruiter-chat-skeleton--send" />
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
