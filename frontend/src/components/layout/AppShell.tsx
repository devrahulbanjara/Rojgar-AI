'use client';

import React from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
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
          <div className="container mx-auto px-12 py-12 max-lg:px-6 max-lg:py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
