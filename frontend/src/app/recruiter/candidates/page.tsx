'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, SkeletonLoader } from '../../../components/common'
import { useAuth } from '../../../hooks/useAuth'
import { useCandidates, useCandidateSearch } from '../../../hooks/queries/useCandidates'
import {
  CandidateFilters,
  CandidateDetailModal,
  CandidatesTable,
  SkeletonTableRow,
  EmptyTableState,
} from '../../../components/candidates'
import { CandidateApplication } from '../../../types/candidate'
import { Search, FolderOpen, Users } from 'lucide-react'

function CandidatesTableSkeleton() {
  return (
    <div
      className="bg-background-surface border border-border-default rounded-2xl overflow-hidden"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.02)',
      }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-background-subtle to-background-subtle/50 border-b border-border-default">
            <th className="py-4 px-6 text-left" style={{ width: '40%' }}>
              <SkeletonLoader variant="rectangular" width={84} height={12} className="rounded-sm" />
            </th>
            <th className="py-4 px-6 text-left" style={{ width: '25%' }}>
              <SkeletonLoader variant="rectangular" width={90} height={12} className="rounded-sm" />
            </th>
            <th className="py-4 px-6 text-left" style={{ width: '25%' }}>
              <SkeletonLoader variant="rectangular" width={64} height={12} className="rounded-sm" />
            </th>
            <th className="py-4 px-6 text-left" style={{ width: '15%' }}>
              <SkeletonLoader variant="rectangular" width={58} height={12} className="rounded-sm" />
            </th>
            <th className="py-4 px-6 text-center" style={{ width: '8%' }}>
              <SkeletonLoader variant="rectangular" width={52} height={12} className="rounded-sm mx-auto" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonTableRow key={index} />
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-background-subtle to-background-subtle/50 border-t border-border-default">
        <SkeletonLoader variant="rectangular" width={180} height={14} className="rounded-sm" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLoader key={index} variant="rectangular" width={36} height={36} className="rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

function RecruiterCandidatesPageSkeleton() {
  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <SkeletonLoader variant="text" width="34%" height={34} />
              <SkeletonLoader variant="text" width="58%" height={18} />
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-background-surface rounded-lg border border-border-default shadow-sm min-w-[124px]">
              <SkeletonLoader variant="rectangular" width={36} height={36} className="rounded-lg" />
              <div className="space-y-2">
                <SkeletonLoader variant="text" width={36} height={20} />
                <SkeletonLoader variant="text" width={44} height={10} />
              </div>
            </div>
          </div>
          <div className="border-b border-border-default/60" />

          <div className="space-y-8">
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-background-surface border border-border-default rounded-2xl shadow-sm">
                <SkeletonLoader variant="rectangular" height={48} className="rounded-xl w-full lg:w-[420px]" />
                <div className="flex flex-wrap items-center gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonLoader key={index} variant="rectangular" width={90} height={34} className="rounded-full" />
                  ))}
                </div>
              </div>
            </div>

            <CandidatesTableSkeleton />
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}

export default function RecruiterCandidatesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const pageSize = 20

  const isSearchMode = debouncedSearchQuery.trim().length > 0

  const {
    data: candidatesData,
    isLoading: isLoadingCandidates,
    error: candidatesError,
    refetch: refetchCandidates,
  } = useCandidates(
    currentPage,
    pageSize,
    { status: activeFilters.length > 0 ? activeFilters[0] : undefined },
    !isSearchMode && isAuthenticated && !isAuthLoading
  )

  const {
    data: searchData,
    isLoading: isLoadingSearch,
    error: searchError,
    refetch: refetchSearch,
  } = useCandidateSearch(
    debouncedSearchQuery,
    currentPage,
    pageSize,
    isSearchMode && isAuthenticated && !isAuthLoading
  )

  const data = isSearchMode ? searchData : candidatesData
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingCandidates
  const error = isSearchMode ? searchError : candidatesError

  const candidates = useMemo(() => data?.candidates || [], [data?.candidates])
  const totalCandidates = data?.total || 0

  const statusCounts = useMemo(() => {
    const counts = {
      applied: 0,
      interviewing: 0,
      outcome: 0,
    }
    candidates.forEach(candidate => {
      const status = candidate.current_status.toLowerCase()
      if (status === 'applied') counts.applied++
      else if (status === 'interviewing') counts.interviewing++
      else if (status === 'outcome') counts.outcome++
    })
    return counts
  }, [candidates])

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/signin'
    }
  }, [isAuthenticated, isAuthLoading])

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && pathname === '/recruiter/candidates') {
      if (isSearchMode) {
        refetchSearch()
      } else {
        refetchCandidates()
      }
    }
  }, [isAuthenticated, isAuthLoading, pathname, isSearchMode, refetchCandidates, refetchSearch])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/recruiter/candidates') {
        if (isSearchMode) {
          refetchSearch()
        } else {
          refetchCandidates()
        }
      }
    }

    const handleFocus = () => {
      if (pathname === '/recruiter/candidates') {
        if (isSearchMode) {
          refetchSearch()
        } else {
          refetchCandidates()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [pathname, isSearchMode, refetchCandidates, refetchSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleFilterToggle = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(filterId) ? prev.filter(f => f !== filterId) : [filterId]

      setCurrentPage(1)

      return newFilters
    })
  }, [])

  const handleClearFilters = useCallback(() => {
    setActiveFilters([])
    setCurrentPage(1)
  }, [])

  const handleCandidateClick = useCallback((candidate: CandidateApplication) => {
    setSelectedCandidate(candidate)
    setIsDetailModalOpen(true)
  }, [])

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false)
    setTimeout(() => setSelectedCandidate(null), 300)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  if (isAuthLoading) {
    return <RecruiterCandidatesPageSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          {/* Minimalist Page Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-[32px] max-lg:text-[28px] font-bold text-text-primary leading-tight tracking-tight">
                  Candidates
                </h1>
                <p className="text-base text-text-secondary">
                  Review and manage candidate applications for your job postings
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-background-surface rounded-lg border border-border-default shadow-sm">
                <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary leading-tight">
                    {totalCandidates}
                  </p>
                  <p className="text-xs text-text-muted">Total</p>
                </div>
              </div>
            </div>
            <div className="mt-6 border-b border-border-default/60" />
          </AnimatedContainer>

          {/* Content */}
          <div className="space-y-8">
            <AnimatedContainer direction="up" delay={0.15}>
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-background-surface border border-border-default rounded-2xl shadow-sm">
                  <div className="relative w-full lg:w-[420px]">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, skills, or job title..."
                      className="w-full pl-12 pr-4 py-3 text-sm bg-background-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted font-medium"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <CandidateFilters
                      activeFilters={activeFilters}
                      onFilterToggle={handleFilterToggle}
                      onClearAll={handleClearFilters}
                      statusCounts={statusCounts}
                    />
                  </div>
                </div>
              </div>
            </AnimatedContainer>

            <AnimatedContainer direction="up" delay={0.2}>
              <div className="w-full">
                {isLoading ? (
                  <CandidatesTableSkeleton />
                ) : error ? (
                  <div
                    className="bg-background-surface border border-border-default rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-error-50 dark:bg-error-950/30 border border-error-100 dark:border-error-800 rounded-2xl flex items-center justify-center mb-6">
                        <FolderOpen className="w-8 h-8 text-error-400 dark:text-error-300" />
                      </div>
                      <h3 className="text-xl font-semibold text-text-primary mb-2">
                        Error loading candidates
                      </h3>
                      <p className="text-sm text-text-tertiary max-w-md mb-6 leading-relaxed">
                        There was an error loading the candidates. Please try again.
                      </p>
                      <button
                        onClick={() => {
                          if (isSearchMode) {
                            refetchSearch()
                          } else {
                            refetchCandidates()
                          }
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : candidates.length === 0 ? (
                  <EmptyTableState isSearchMode={isSearchMode} searchQuery={debouncedSearchQuery} />
                ) : (
                  <CandidatesTable
                    candidates={candidates}
                    onCandidateClick={handleCandidateClick}
                    currentPage={currentPage}
                    totalCandidates={totalCandidates}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>

      {}
      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </AppShell>
  )
}
