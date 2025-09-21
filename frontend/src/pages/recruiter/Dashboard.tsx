import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { authService } from '../../services/authService';
import { ROUTES } from '../../config/constants';
import { 
  LogOut,
  Sparkles,
  User
} from 'lucide-react';

interface DashboardUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  picture?: string;
}

export default function RecruiterDashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (!userData) {
          navigate(ROUTES.LOGIN);
          return;
        }

        if (userData.role !== 'recruiter') {
          // Redirect to appropriate dashboard or role selection
          if (userData.role === 'candidate') {
            navigate(ROUTES.CANDIDATE.DASHBOARD);
          } else {
            navigate(ROUTES.SELECT_ROLE);
          }
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
        navigate(ROUTES.LOGIN);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Logout error:', error);
      navigate(ROUTES.HOME);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* ConvexHire Logo */}
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">ConvexHire</span>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary/70" />
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{user.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-slate-900">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Empty for now */}
      <main className="container mx-auto px-6 py-8">
        {/* Empty content area */}
      </main>
    </div>
  );
}
