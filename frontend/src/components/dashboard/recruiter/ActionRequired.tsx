'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Mail, ListChecks, ArrowRight, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'

interface PendingEmail {
  draft_id: string
  application_id: string
  subject: string
  is_approved: boolean
  created_at: string | null
}

interface PendingShortlist {
  job_id: string
  title: string
  department: string | null
  updated_at: string | null
}

export function ActionRequired() {
  const [emails, setEmails] = useState<PendingEmail[]>([])
  const [shortlists, setShortlists] = useState<PendingShortlist[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const [emailRes, shortlistRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/recruiter/action-items/pending-emails`, {
          credentials: 'include',
        }),
        fetch(`${apiUrl}/api/v1/recruiter/action-items/pending-shortlists`, {
          credentials: 'include',
        }),
      ])

      if (emailRes.ok) {
        const data = await emailRes.json()
        setEmails(data.drafts || [])
      }
      if (shortlistRes.ok) {
        const data = await shortlistRes.json()
        setShortlists(data.jobs || [])
      }
    } catch (err) {
      console.error('Failed to load action items:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalItems = emails.length + shortlists.length

  if (loading) {
    return (
      <Card className="border-amber-200 dark:border-amber-800/60">
        <CardContent className="p-6">
          <div className="h-20 bg-background-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (totalItems === 0) return null

  return (
    <Card className="border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Action Required
          </CardTitle>
          <Badge
            variant="secondary"
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold"
          >
            {totalItems}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Pending Emails */}
        {emails.slice(0, 3).map(email => (
          <div
            key={email.draft_id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background-surface border border-border-subtle hover:border-primary-200 dark:hover:border-primary-700 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{email.subject}</p>
                <p className="text-xs text-text-tertiary">
                  {email.is_approved ? 'Ready to send' : 'Needs approval'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Review <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        ))}

        {/* Pending Shortlists */}
        {shortlists.slice(0, 3).map(job => (
          <a
            key={job.job_id}
            href={`/recruiter/jobs?highlight=${job.job_id}`}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background-surface border border-border-subtle hover:border-primary-200 dark:hover:border-primary-700 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <ListChecks className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{job.title}</p>
                <p className="text-xs text-text-tertiary">AI shortlist ready for review</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 group-hover:underline whitespace-nowrap">
              Finalize <ExternalLink className="w-3 h-3 inline ml-0.5" />
            </span>
          </a>
        ))}
      </CardContent>
    </Card>
  )
}
