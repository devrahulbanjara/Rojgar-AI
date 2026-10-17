import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Jobs — Rojgar AI',
  description:
    'Explore active job openings from companies hiring on Rojgar AI. Sign in to apply, track your progress, and get AI-powered resume feedback.',
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
