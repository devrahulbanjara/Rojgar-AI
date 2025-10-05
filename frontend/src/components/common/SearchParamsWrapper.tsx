'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchParamsWrapperProps {
  children: (searchParams: URLSearchParams) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function SearchParamsWrapper({ children, fallback = null }: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <SearchParamsContent>{children}</SearchParamsContent>
    </Suspense>
  );
}

function SearchParamsContent({ children }: { children: (searchParams: URLSearchParams) => React.ReactNode }) {
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}
