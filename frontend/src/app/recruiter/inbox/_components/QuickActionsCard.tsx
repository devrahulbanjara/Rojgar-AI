'use client'

import Link from 'next/link'

import { Calendar, ChevronRight, Mail } from 'lucide-react'

import styles from '../page.module.scss'

const ACTIONS = [
  {
    href: '/recruiter/interviews',
    icon: Calendar,
    title: 'Upcoming interviews',
    copy: "Open the calendar to see today's and upcoming bookings.",
  },
  {
    href: '/recruiter/outreach',
    icon: Mail,
    title: 'Outreach drafts',
    copy: 'Review and approve drafted emails before they send.',
  },
] as const

export default function QuickActionsCard() {
  return (
    <section className={styles.card} aria-label="Quick actions">
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Pending</div>
          <h2 className={styles.cardTitle}>Quick actions</h2>
        </div>
      </div>
      <p className={styles.cardCopy}>Routine work that may need your attention today.</p>
      <div className={styles.list}>
        {ACTIONS.map(({ href, icon: Icon, title, copy }) => (
          <Link key={href} href={href} className={styles.row}>
            <span className={styles.rowIcon} aria-hidden="true">
              <Icon size={16} />
            </span>
            <div className={styles.rowBody}>
              <p className={styles.rowTitle}>{title}</p>
              <p className={styles.rowCopy}>{copy}</p>
            </div>
            <ChevronRight size={16} className={styles.rowChevron} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
