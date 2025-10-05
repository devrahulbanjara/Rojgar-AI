/**
 * Dynamic Import Wrapper for ApplicationTrackingBoard
 * Provides code splitting for better performance
 */

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ApplicationTrackingBoard = dynamic(
  () => import('./ApplicationTrackingBoard').then(mod => ({ default: mod.ApplicationTrackingBoard })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" message="Loading application tracking..." />
      </div>
    ),
    ssr: false, // Disable SSR for this component since it's interactive
  }
);
