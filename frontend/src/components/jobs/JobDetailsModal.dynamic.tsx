/**
 * Dynamic Import Wrapper for JobDetailsModal
 * Provides code splitting for better performance
 */

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const JobDetailsModal = dynamic(
  () => import('./JobDetailsModal').then(mod => ({ default: mod.JobDetailsModal })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" message="Loading job details..." />
      </div>
    ),
    ssr: false, // Disable SSR for modal components
  }
);
