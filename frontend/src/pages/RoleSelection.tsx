/**
 * Role Selection Page
 * Allows new users to select their role after Google OAuth
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { authService } from '../services/authService';
import { ROUTES } from '../config/constants';
import { Building2, User, Sparkles } from 'lucide-react';

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Remove any token from URL for security (not needed with cookies)
    const token = searchParams.get('token');
    if (token) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Check if user is authenticated
    const checkAuth = async () => {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        navigate(ROUTES.LOGIN);
      }
    };
    
    checkAuth();
  }, [navigate, searchParams]);

  const handleRoleSelect = async () => {
    if (!selectedRole) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.selectRole(selectedRole);
      
      // Navigate to the dashboard URL returned by the backend
      navigate(response.redirect_url);
    } catch (error) {
      console.error('Role selection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to select role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">ConvexHire</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to ConvexHire!
          </h1>
          
          <p className="text-xl text-muted-foreground mb-2">
            To get started, please select your role:
          </p>
          
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            Choose your path
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Candidate Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 card-hover ${
                selectedRole === 'candidate' 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedRole('candidate')}
            >
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-accent/10 rounded-full w-fit mx-auto mb-4">
                  <User className="h-12 w-12 text-accent" />
                </div>
                
                <h3 className="text-2xl font-semibold mb-3">
                  Candidate 👤
                </h3>
                
                <p className="text-muted-foreground mb-4">
                  Looking for your next career opportunity? Find jobs that match your skills and aspirations.
                </p>
                
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Browse job opportunities
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Get AI-powered job matches
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Track application status
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Receive transparent feedback
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recruiter Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 card-hover ${
                selectedRole === 'recruiter' 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedRole('recruiter')}
            >
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <Building2 className="h-12 w-12 text-primary" />
                </div>
                
                <h3 className="text-2xl font-semibold mb-3">
                  Recruiter 🏢
                </h3>
                
                <p className="text-muted-foreground mb-4">
                  Hiring top talent for your organization? Streamline your recruitment process with AI.
                </p>
                
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    AI-powered job descriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Smart candidate screening
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Interview scheduling
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Analytics and insights
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={handleRoleSelect}
            disabled={!selectedRole || isLoading}
            className="px-12"
          >
            {isLoading ? 'Setting up your account...' : 'Continue'}
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            You can change your role later in your account settings
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
