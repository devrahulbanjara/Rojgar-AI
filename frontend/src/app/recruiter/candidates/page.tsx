'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, LoadingSpinner } from '../../../components/common'
import { useAuth } from '../../../hooks/useAuth'
import { JobSearchBar } from '../../../components/jobs'
import { useCandidates, useCandidateSearch } from '../../../hooks/queries/useCandidates'
import {
  CandidateCard,
  CandidateFilters,
  CandidateDetailModal,
  SkeletonCandidateCard,
} from '../../../components/candidates'
import { CandidateApplication } from '../../../types/candidate'
import { FolderOpen, Users } from 'lucide-react'

export default function RecruiterCandidatesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const isSearchMode = debouncedSearchQuery.trim().length > 0

  // Query for regular candidates or search results
  const {
    data: candidatesData,
    isLoading: isLoadingCandidates,
    error: candidatesError,
    refetch: refetchCandidates,
  } = useCandidates(
    currentPage,
    20,
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
    20,
    isSearchMode && isAuthenticated && !isAuthLoading
  )

  const data = isSearchMode ? searchData : candidatesData
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingCandidates
  const error = isSearchMode ? searchError : candidatesError

  const candidates = useMemo(() => data?.candidates || [], [data?.candidates])
  const totalCandidates = data?.total || 0

  // Calculate status counts
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
      window.location.href = '/login'
    }
  }, [isAuthenticated, isAuthLoading])

  // Refetch when page becomes visible or focused
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

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleDebouncedSearchChange = useCallback((value: string) => {
    setDebouncedSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }, [])

  const handleFilterToggle = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [filterId] // Only allow one status filter at a time
      setCurrentPage(1) // Reset to first page on filter change
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

  if (isAuthLoading || !isAuthenticated) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <div className="space-y-6 pb-12">
          {/* Enhanced Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 transition-all duration-300 ease-out">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">
                      Candidates
                    </h1>
                    <p className="text-lg text-[#475569] max-w-2xl">
                      Review and manage candidate applications for your job postings
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-[#0F172A]">{totalCandidates}</span>
                    <span className="text-sm text-[#475569]">Total</span>
                  </div>
                </div>

                {/* Search Bar Section */}
                <div className="space-y-6 bg-white rounded-2xl p-6 border border-slate-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <JobSearchBar
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onDebouncedChange={handleDebouncedSearchChange}
                    loading={isLoading}
                    placeholder="Search by candidate name, email, skills, or job title..."
                  />

                  {/* Filters */}
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

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <AnimatedContainer direction="up" delay={0.2}>
              {/* Loading State */}
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonCandidateCard key={index} index={index} />
                  ))}
                </div>
              ) : error ? (
                /* Error State */
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-200">
                  <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-6">
                    <FolderOpen className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Error loading candidates</h3>
                  <p className="text-base text-gray-500 max-w-md mb-8">
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
                    className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 shadow-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : candidates.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSearchMode ? 'No candidates found' : 'No candidates yet'}
                  </h3>
                  <p className="text-base text-gray-500 max-w-md">
                    {isSearchMode
                      ? `No candidates match your search for "${debouncedSearchQuery}". Try adjusting your search terms.`
                      : 'Candidates who apply to your job postings will appear here.'}
                  </p>
                </div>
              ) : (
                /* Candidates List - Full Width Cards */
                <div className="space-y-4">
                  {candidates.map((candidate, index) => (
                    <CandidateCard
                      key={candidate.application_id}
                      candidate={candidate}
                      onClick={() => handleCandidateClick(candidate)}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>

      {/* Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </AppShell>
  )
}
