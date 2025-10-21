import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import type { UserType } from '../../types/index';
import {
  LayoutDashboard,
  BriefcaseIcon,
  Users,
  Search,
  FileText,
  Calendar,
  BarChart3,
  MessageSquare,
  User
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  role: UserType;
}

export function Sidebar({ isOpen, role }: SidebarProps) {
  const pathname = usePathname();
  
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
    { title: 'Profile', path: '/candidate/profile', icon: User },
  ];

  const items = role === 'recruiter' ? recruiterItems : candidateItems;

  return (
    <aside
      className={cn(
        'fixed left-0 h-[calc(100vh-72px)] bg-white border-r border-[#E5E7EB] transition-all duration-300 z-40',
        'top-[72px]',
        isOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
      )}
    >
      <nav className="py-8 px-4 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center gap-3 h-11 px-4 rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'bg-[#3056F5]/8 text-[#3056F5]'
                  : 'text-[#475569] hover:bg-[#F9FAFB] hover:text-[#0F172A]'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3056F5] rounded-r-full" />
              )}
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[15px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
