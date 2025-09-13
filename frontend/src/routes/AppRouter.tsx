/**
 * Application Router
 * Main router component with route definitions
 */

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routeDefinitions } from './routeDefinitions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Loading fallback component
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

export function AppRouter() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {routeDefinitions.map((route, index) => (
          <Route key={index} path={route.path} element={route.element}>
            {route.children?.map((child, childIndex) => (
              <Route
                key={childIndex}
                index={child.index}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ))}
      </Routes>
    </Suspense>
  );
}
