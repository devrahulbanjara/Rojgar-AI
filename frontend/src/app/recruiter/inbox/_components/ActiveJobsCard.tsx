'use client'

import Link from 'next/link'

import { Briefcase, ChevronRight } from 'lucide-react'

import styles from '../page.module.scss'

interface JobLite {
  id: string
  title: string
  location_type: string | null
  applications_count: number
}

interface Props {
  jobs: JobLite[]
}

export default function ActiveJobsCard({ jobs }: Props) {
  if (jobs.length === 0) return null

  const visible = jobs.slice(0, 6)

  return (
    <section className={styles.card} aria-label="Active jobs">
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Pipelines</div>
          <h2 className={styles.cardTitle}>Active jobs</h2>
        </div>
        <span className={styles.cardCount}>{jobs.length}</span>
      </div>
      <p className={styles.cardCopy}>
        Jump into a pipeline. Evaluation, interviews, and outreach live inside the job.
      </p>
      <div className={styles.list}>
        {visible.map((job) => (
          <Link key={job.id} href={`/recruiter/jobs/${job.id}`} className={styles.row}>
            <span className={styles.rowIcon} aria-hidden="true">
              <Briefcase size={16} />
            </span>
            <div className={styles.rowBody}>
              <p className={styles.rowTitle}>{job.title}</p>
              <p className={styles.rowCopy}>
                {job.location_type ?? 'Remote'} · {job.applications_count} applicant
                {job.applications_count === 1 ? '' : 's'}
              </p>
            </div>
            <ChevronRight size={16} className={styles.rowChevron} aria-hidden="true" />
          </Link>
        ))}
        {jobs.length > visible.length && (
          <Link href="/recruiter/jobs" className={`btn btn--ghost btn--sm ${styles.rowMore}`}>
            View all {jobs.length} active jobs
          </Link>
        )}
      </div>
    </section>
  )
}
