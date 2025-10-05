import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { UserType } from '../../types/index';
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
  BarChart3,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  role: UserType;
}

export function Sidebar({ isOpen, role }: SidebarProps) {
  const recruiterItems = [
    { title: 'Dashboard', path: '/dashboard/recruiter', icon: LayoutDashboard },
    { title: 'Jobs', path: '/recruiter/jobs', icon: BriefcaseIcon },
    { title: 'Shortlist', path: '/recruiter/shortlist', icon: Users },
    { title: 'Interviews', path: '/recruiter/interviews', icon: Calendar },
    { title: 'Final Selection', path: '/recruiter/final-selection', icon: BarChart3 },
    { title: 'Candidate Pool', path: '/recruiter/candidate-pool', icon: MessageSquare },
  ];

  const candidateItems = [
    { title: 'Dashboard', path: '/dashboard/candidate', icon: LayoutDashboard },
    { title: 'Jobs', path: '/candidate/browse-jobs', icon: Search },
    { title: 'Resumes', path: '/candidate/resumes', icon: FileText },
  ];

  const items = role === 'recruiter' ? recruiterItems : candidateItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-slate-200 transition-all duration-300 z-40',
        isOpen ? 'w-64' : 'w-0 overflow-hidden'
      )}
    >
      <nav className="p-4 space-y-2">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            {role === 'recruiter' ? 'Recruiter Portal' : 'Candidate Portal'}
          </h3>
        </div>
        
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard/recruiter' || item.path === '/dashboard/candidate'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
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
