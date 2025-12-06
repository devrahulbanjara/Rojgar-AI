'use client';

import React from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { MainContentContainer } from '../common/MainContentContainer';
import { useAuth } from '../../hooks/useAuth';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      <Topbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />

      <div className="flex min-h-[calc(100vh-72px)] pt-[72px]">
        <Sidebar
          isOpen={sidebarOpen}
          role={user?.role || 'candidate'}
        />

        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-[260px]' : 'ml-0'
          } max-lg:ml-0`}
        >
          <MainContentContainer>
            {children}
          </MainContentContainer>
        </main>
      </div>
    </div>
  );
}
