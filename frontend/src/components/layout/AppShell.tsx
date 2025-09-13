import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks';
import { motion } from 'framer-motion';

export function AppShell() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex h-[calc(100vh-64px)] pt-16">
        <Sidebar isOpen={sidebarOpen} role={user?.role || 'candidate'} />
        
        <motion.main 
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
}