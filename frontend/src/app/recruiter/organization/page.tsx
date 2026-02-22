'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { Settings, Globe, Link2 } from 'lucide-react'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer } from '../../../components/common'
import { Card, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { useAuth } from '../../../hooks/useAuth'

const SETTINGS_SECTIONS = [
  {
    title: 'Reference Job Descriptions',
    description: 'Upload reference JDs for AI-powered job drafting.',
    icon: Globe,
    status: 'coming_soon',
  },
  {
    title: 'Integrations',
    description: 'Cal.com calendar, SMTP email, and webhooks.',
    icon: Link2,
    status: 'coming_soon',
  },
  {
    title: 'Preferences',
    description: 'Default settings, notifications, and branding.',
    icon: Settings,
    status: 'coming_soon',
  },
]

export default function OrganizationPage() {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/signin'
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) return null

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          {/* Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Organization Settings
              </h1>
              <p className="text-sm text-text-secondary">
                Configure recruitment preferences, integrations, and job assets.
              </p>
            </div>
          </AnimatedContainer>

          {/* Settings Grid */}
          <AnimatedContainer direction="up" delay={0.2}>
            <div className="grid gap-4 md:grid-cols-2">
              {SETTINGS_SECTIONS.map((section, i) => {
                const Icon = section.icon
                const isComingSoon = section.status === 'coming_soon'

                return (
                  <Card
                    key={i}
                    className={`border-border-default transition-all duration-300 ${
                      isComingSoon
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 cursor-pointer group'
                    }`}
                  >
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5 text-primary-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-text-primary">{section.title}</h3>
                          {isComingSoon && (
                            <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">
                              Soon
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-tertiary mt-0.5">{section.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  )
}
