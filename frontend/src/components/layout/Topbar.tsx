import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Menu, Building2, LogOut, ToggleLeft, Settings, User } from 'lucide-react';
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
      console.error('Logout failed:', error);
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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold gradient-text">ConvexHire</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1) hover:scale-105">
              {user ? getInitials(user.name) : 'U'}
            </div>
            <span className="hidden md:block font-medium text-slate-700">{user?.name}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
