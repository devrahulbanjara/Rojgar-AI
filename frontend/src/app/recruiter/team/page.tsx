'use client'

import { useCallback } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { notify } from '@/lib/notify'
import { useGetMyCompanyQuery } from '@/store/services/companyApi'

import AuditPanel from './_components/AuditPanel'
import RecruitersPanel from './_components/RecruitersPanel'

const TABS = ['recruiters', 'audit'] as const
type TeamTab = (typeof TABS)[number]

const TAB_LABELS: Record<TeamTab, string> = {
  recruiters: 'Recruiters',
  audit: 'Audit Trail',
}

export default function RecruiterTeamPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const param = searchParams.get('tab')
  const activeTab: TeamTab = (TABS as readonly string[]).includes(param ?? '')
    ? (param as TeamTab)
    : 'recruiters'

  const { data: companyResp } = useGetMyCompanyQuery()
  const companyName = companyResp?.data?.name

  async function copyInviteLink() {
    if (!companyName) return
    const link = `${window.location.origin}/signup?join=${encodeURIComponent(companyName)}`
    try {
      await navigator.clipboard.writeText(link)
      notify.success('Invite link copied.')
    } catch {
      window.prompt('Copy this invite link:', link)
    }
  }

  const setTab = useCallback(
    (tab: TeamTab) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Team</h2>
        </div>
        {activeTab === 'recruiters' ? (
          <div className="dash-page-header__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={!companyName}
              onClick={() => void copyInviteLink()}
            >
              Copy invite link
            </button>
          </div>
        ) : null}
      </div>

      <div className="team-tabs" role="tablist" aria-label="Team sections">
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`team-tabs__btn ${isActive ? 'team-tabs__btn--active' : ''}`}
              onClick={() => setTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          )
        })}
      </div>

      {activeTab === 'recruiters' ? <RecruitersPanel /> : <AuditPanel />}
    </div>
  )
}
