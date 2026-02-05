'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, LoadingSpinner } from '../../../components/common'
import { useAuth } from '../../../hooks/useAuth'
import { ShortlistJobCard } from '../../../components/shortlist/ShortlistJobCard'
import { ShortlistCandidateCard } from '../../../components/shortlist/ShortlistCandidateCard'
import { CheckCircle2, Users, Sparkles } from 'lucide-react'
import type { ShortlistJob, ShortlistCandidate } from '../../../types/shortlist'

// Dummy data generator
const generateDummyCandidates = (jobTitle: string, count: number): ShortlistCandidate[] => {
  const names = [
    'Rahul Banjara',
    'Sarah Johnson',
    'Michael Chen',
    'Emily Rodriguez',
    'David Kim',
    'Jessica Martinez',
    'James Wilson',
    'Maria Garcia',
    'Robert Taylor',
    'Lisa Anderson',
  ]

  const emails = names.map(name => `${name.toLowerCase().replace(' ', '.')}@example.com`)

  const analysisTemplates = [
    'Strong technical background in React and Node.js. 5+ years experience aligns well with job requirements. Communication skills evident in portfolio presentation. Minor gap: lacks specific experience with GraphQL mentioned in job description.',
    'Excellent problem-solving abilities demonstrated through previous projects. Strong portfolio showcasing modern web development practices. Good cultural fit based on background. Areas for improvement: could benefit from more team collaboration experience.',
    'Impressive educational background with relevant certifications. Shows strong initiative and self-learning capabilities. Technical skills match job requirements well. Consideration: limited industry experience but high potential for growth.',
    'Proven track record in similar roles with measurable achievements. Strong leadership qualities and team collaboration skills. Technical expertise covers all required areas. Note: salary expectations may need discussion.',
    'Outstanding portfolio with innovative project implementations. Excellent communication skills and professional presentation. Strong alignment with company values and culture. Recommendation: top candidate for this position.',
    'Solid technical foundation with room for growth. Shows enthusiasm and willingness to learn. Good problem-solving approach demonstrated in projects. Consideration: may need mentorship initially but shows promise.',
    'Experienced professional with diverse skill set. Strong analytical thinking and attention to detail. Good understanding of industry best practices. Note: may be overqualified, discuss career goals.',
    'Fresh perspective with modern development practices. Strong academic performance and relevant coursework. Good potential for long-term growth. Consideration: entry-level but shows exceptional promise.',
  ]

  return Array.from({ length: count }, (_, i) => {
    const score = Math.floor(Math.random() * 31) + 65 // 65-95 range
    const nameIndex = i % names.length
    const appliedHoursAgo = Math.floor(Math.random() * 168) + 2 // 2 hours to 1 week

    return {
      application_id: `app-${i + 1}`,
      candidate_id: `cand-${i + 1}`,
      name: names[nameIndex],
      email: emails[nameIndex],
      phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      picture: null,
      professional_headline: i % 3 === 0 ? 'Senior Software Engineer' : undefined,
      applied_at: new Date(Date.now() - appliedHoursAgo * 60 * 60 * 1000).toISOString(),
      ai_score: score,
      ai_analysis: analysisTemplates[i % analysisTemplates.length],
      ai_recommendation: score >= 75 ? 'approve' : score >= 60 ? 'review' : 'reject',
      job_title: jobTitle,
    }
  })
}

const dummyJobs: ShortlistJob[] = [
  {
    job_id: 'job-1',
    title: 'UI UX Developer',
    department: 'Design',
    applicant_count: 12,
    pending_ai_reviews: 3,
    candidates: generateDummyCandidates('UI UX Developer', 12),
  },
  {
    job_id: 'job-2',
    title: 'Full Stack Developer',
    department: 'Engineering',
    applicant_count: 18,
    pending_ai_reviews: 5,
    candidates: generateDummyCandidates('Full Stack Developer', 18),
  },
  {
    job_id: 'job-3',
    title: 'Product Manager',
    department: 'Product',
    applicant_count: 8,
    pending_ai_reviews: 2,
    candidates: generateDummyCandidates('Product Manager', 8),
  },
  {
    job_id: 'job-4',
    title: 'Data Scientist',
    department: 'Analytics',
    applicant_count: 15,
    pending_ai_reviews: 4,
    candidates: generateDummyCandidates('Data Scientist', 15),
  },
]

export default function ShortlistPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(dummyJobs[0]?.job_id || null)

  const selectedJob = useMemo(
    () => dummyJobs.find(job => job.job_id === selectedJobId) || null,
    [selectedJobId]
  )

  const recommendedCandidates = useMemo(() => {
    if (!selectedJob) return []
    return selectedJob.candidates.filter(c => c.ai_score >= 75)
  }, [selectedJob])

  const handleApprove = useCallback((_candidateId: string) => {
    // TODO: Implement approve logic
  }, [])

  const handleReject = useCallback((_candidateId: string) => {
    // TODO: Implement reject logic
  }, [])

  const handleBulkApprove = useCallback(() => {
    recommendedCandidates.forEach(candidate => {
      handleApprove(candidate.candidate_id)
    })
  }, [recommendedCandidates, handleApprove])

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
        <div className="space-y-8 pb-12">
          {/* Enhanced Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">
                      Shortlist
                    </h1>
                    <p className="text-lg text-[#475569] mt-2 max-w-2xl">
                      Review AI-analyzed candidates and make hiring decisions
                    </p>
                  </div>
                  {recommendedCandidates.length > 0 && (
                    <button
                      onClick={handleBulkApprove}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Approve All AI Recommendations ({recommendedCandidates.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex gap-8">
              {/* Left Sidebar - Job Selection */}
              <div className="w-80 flex-shrink-0">
                <AnimatedContainer direction="up" delay={0.2}>
                  <div className="space-y-4">
                    {dummyJobs.map(job => (
                      <ShortlistJobCard
                        key={job.job_id}
                        job={job}
                        isSelected={selectedJobId === job.job_id}
                        onClick={() => setSelectedJobId(job.job_id)}
                      />
                    ))}
                  </div>
                </AnimatedContainer>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                <AnimatedContainer direction="up" delay={0.3}>
                  {selectedJob ? (
                    <div className="space-y-6">
                      {/* Candidates List */}
                      {selectedJob.candidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                          <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-indigo-300" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">No candidates found</h3>
                          <p className="text-base text-gray-500 max-w-md">
                            No candidates have applied for this job yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedJob.candidates
                            .sort((a, b) => b.ai_score - a.ai_score)
                            .map(candidate => (
                              <ShortlistCandidateCard
                                key={candidate.application_id}
                                candidate={candidate}
                                onApprove={handleApprove}
                                onReject={handleReject}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-indigo-300" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Select a job posting</h3>
                      <p className="text-base text-gray-500 max-w-md">
                        Choose a job from the sidebar to start reviewing candidates
                      </p>
                    </div>
                  )}
                </AnimatedContainer>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
