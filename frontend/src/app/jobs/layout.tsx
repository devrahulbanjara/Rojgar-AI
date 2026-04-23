import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Jobs — ConvexHire',
  description:
    'Explore active job openings from companies hiring on ConvexHire. Sign in to apply, track your progress, and get AI-powered resume feedback.',
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
