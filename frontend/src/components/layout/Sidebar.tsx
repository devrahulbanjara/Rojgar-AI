import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  BriefcaseIcon,
  Users,
  Building2,
  Search,
  FileText,
  User,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  role: UserRole;
}

export function Sidebar({ isOpen, role }: SidebarProps) {
  const recruiterItems = [
    { title: 'Dashboard', path: '/recruiter', icon: LayoutDashboard },
    { title: 'Jobs', path: '/recruiter/jobs', icon: BriefcaseIcon },
    { title: 'Shortlist', path: '/recruiter/shortlist', icon: Users },
    { title: 'Interviews', path: '/recruiter/interviews', icon: Calendar },
    { title: 'Final Selection', path: '/recruiter/final-selection', icon: BarChart3 },
  ];

  const candidateItems = [
    { title: 'Dashboard', path: '/candidate', icon: LayoutDashboard },
    { title: 'Browse Jobs', path: '/candidate/browse', icon: Search },
    { title: 'My Applications', path: '/candidate/applications', icon: FileText },
    { title: 'Profile', path: '/candidate/profile', icon: User },
  ];

  const items = role === 'recruiter' ? recruiterItems : candidateItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-64px)] bg-card border-r border-border transition-all duration-300 z-40',
        isOpen ? 'w-64' : 'w-0 overflow-hidden'
      )}
    >
      <nav className="p-4 space-y-2">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            {role === 'recruiter' ? 'Recruiter Portal' : 'Candidate Portal'}
          </h3>
        </div>
        
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/recruiter' || item.path === '/candidate'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-secondary'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}