import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { LogoLink } from '../common/Logo';
import { authService } from '../../services/authService';
import { ROUTES } from '../../config/constants';

interface TopbarProps {
  onMenuClick: () => void;
  user: {
    name: string;
    email: string;
    role?: string;
  } | null;
}

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push(ROUTES.HOME);
    } catch (error) {
      router.push(ROUTES.HOME);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-[#E5E7EB] transition-all duration-300"
      style={{ 
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between h-full px-8">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-[#475569]" />
          </button>
          
          <LogoLink variant="full" size="lg" />
        </div>

        {/* Right: User Profile + Logout */}
        <div className="flex items-center gap-4">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-2 py-2 pr-4 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-all duration-200 hover:scale-[1.02]"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div className="w-10 h-10 bg-[#3056F5] text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {user ? getInitials(user.name) : 'U'}
            </div>
            <span className="hidden md:block text-[15px] font-medium text-[#0F172A]">
              {user?.name}
            </span>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-[#475569] hover:text-[#3056F5] transition-colors pr-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
