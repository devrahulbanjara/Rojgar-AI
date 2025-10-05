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
    <div className="min-h-screen bg-slate-50">
      <Topbar 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        user={user}
      />
      
      <div className="flex min-h-[calc(100vh-64px)] pt-16">
        <Sidebar 
          isOpen={sidebarOpen} 
          role={user?.role || 'candidate'} 
        />
        
        <main 
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="container mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}