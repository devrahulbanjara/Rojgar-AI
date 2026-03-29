import {
  type ApplicationLifecycleStatus,
  type JobLifecycleStatus,
  getApplicationStatusLabel,
  getApplicationStatusVariant,
  getJobStatusLabel,
  getJobStatusVariant,
} from '@/lib/statusMetadata'

type StatusPillProps =
  | {
      kind: 'application'
      status: ApplicationLifecycleStatus
      className?: string
    }
  | {
      kind: 'job'
      status: JobLifecycleStatus
      className?: string
    }

export default function StatusPill(props: StatusPillProps) {
  const label =
    props.kind === 'application'
      ? getApplicationStatusLabel(props.status)
      : getJobStatusLabel(props.status)
  const variant =
    props.kind === 'application'
      ? getApplicationStatusVariant(props.status)
      : getJobStatusVariant(props.status)

  return (
    <span className={`badge badge--${variant}${props.className ? ` ${props.className}` : ''}`}>
      {label}
    </span>
  )
}
