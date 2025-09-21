import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { authService } from '../../services/authService';
import { ROUTES } from '../../config/constants';
import { 
  User, 
  FileText, 
  Calendar,
  LogOut,
  Sparkles,
  Search,
  Target
} from 'lucide-react';

interface DashboardUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  picture?: string;
}

export default function CandidateDashboard() {
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

        if (userData.role !== 'candidate') {
          // Redirect to appropriate dashboard or role selection
          if (userData.role === 'recruiter') {
            navigate(ROUTES.RECRUITER.DASHBOARD);
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
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">ConvexHire</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-medium">{user.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    Candidate
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {user.name}! 🚀
            </h1>
            <p className="text-muted-foreground">
              Ready to find your next opportunity? Let's get started on your career journey.
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Active applications</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Job Matches</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">New matches this week</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Upcoming this week</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon Section */}
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-16 w-16 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Candidate Dashboard Coming Soon!</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We're building an incredible experience for job seekers with AI-powered job matching, 
                application tracking, interview preparation tools, and career insights. 
                Your dream job is just around the corner!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">AI Job Matching</Badge>
                <Badge variant="outline">Application Tracking</Badge>
                <Badge variant="outline">Interview Prep</Badge>
                <Badge variant="outline">Career Insights</Badge>
                <Badge variant="outline">Skill Assessment</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
