import React from 'react';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="absolute left-0 top-0 -translate-y-full focus:translate-y-0 z-[9999] px-6 py-3 bg-[var(--color-primary-purple)] text-white rounded-br-lg shadow-lg transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      Skip to main content
    </a>
  );
}
