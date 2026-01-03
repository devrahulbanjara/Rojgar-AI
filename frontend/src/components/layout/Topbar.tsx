import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { LogoLink } from '../common/Logo';
import { authService } from '../../services/authService';
import { ROUTES } from '../../config/constants';

import { UserAvatar } from '../ui/UserAvatar';

interface TopbarProps {
  onMenuClick?: () => void;
  user: {
    name: string;
    email: string;
    role?: string;
    picture?: string | null;
  } | null;
}

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push(ROUTES.HOME);
    } catch {
      router.push(ROUTES.HOME);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-[#E5E7EB] transition-all duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px -5px rgba(48, 86, 245, 0.05)',
      }}
    >
      <div className="flex items-center justify-between h-full px-8 max-w-[1600px] mx-auto">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-6">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2.5 rounded-xl hover:bg-blue-50 text-[#475569] hover:text-[#3056F5] transition-all duration-200"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="hover:scale-[1.02] transition-transform duration-200">
            <LogoLink variant="full" size="lg" />
          </div>
        </div>

        {/* Right: User Profile + Logout */}
        <div className="flex items-center gap-6">
          {/* User Profile Pill */}
          <div className="group flex items-center gap-3 pl-1.5 pr-5 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#3056F5]/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#3056F5] to-blue-300 rounded-full opacity-0 group-hover:opacity-20 blur-[2px] transition-opacity duration-300" />
              {user ? (
                <UserAvatar
                  name={user.name}
                  src={user.picture}
                  className="w-9 h-9 border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-[#3056F5] to-[#6366F1] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                  U
                </div>
              )}
            </div>

            <span className="hidden md:block text-[14px] font-bold text-[#0F172A] group-hover:text-[#3056F5] transition-colors duration-200">
              {user?.name}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#475569] hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-colors duration-200">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
