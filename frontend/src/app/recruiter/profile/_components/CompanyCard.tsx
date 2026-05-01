'use client'

import Link from 'next/link'

import { ArrowRight } from 'lucide-react'

import Avatar from '@/components/common/Avatar'

import styles from '../page.module.scss'

interface Props {
  companyName: string
  domain: string | null
  logoUrl: string | null
  companyId: string | null
}

export default function CompanyCard({ companyName, domain, logoUrl, companyId }: Props) {
  return (
    <section className={styles.card} aria-label="Company">
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Where you hire</div>
          <h2 className={styles.cardTitle}>Company</h2>
        </div>
        <Link
          href="/recruiter/company/settings"
          className="btn btn--secondary btn--sm"
          aria-label="Manage company"
        >
          Manage
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className={styles.companyRow}>
        <Avatar
          name={companyName}
          src={logoUrl}
          seed={companyId ?? companyName}
          kind="company"
          className={styles.companyAvatar}
          sizes="48px"
        />
        <div className={styles.companyMeta}>
          <h3 className={styles.companyName}>{companyName}</h3>
          {domain && <p className={styles.companyDomain}>{domain}</p>}
        </div>
      </div>
    </section>
  )
}
