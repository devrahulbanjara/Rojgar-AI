/**
 * Common Components Index
 * Centralized exports for common components with optimized imports
 */

export { StatCard } from './StatCard';
export { ErrorBoundary } from './ErrorBoundary';
export { LoadingSpinner } from './LoadingSpinner';
export { Logo, LogoLink } from './Logo';
export { SectionHeader } from './SectionHeader';
export { EmptyState } from './EmptyState';
export { PageTransition } from './PageTransition';
export { SkeletonLoader, SkeletonCard, SkeletonJobCard, SkeletonStats } from './SkeletonLoader';
export { AnimatedContainer, StaggerContainer } from './AnimatedContainer';
export { MainContentContainer } from './MainContentContainer';
export { PageHeader } from './PageHeader';
export { default as AIPoweredBadge } from './AIPoweredBadge';

// Re-export types for better developer experience
export type { StatCardProps } from './StatCard';
