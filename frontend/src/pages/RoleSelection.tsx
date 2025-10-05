/**
 * Role Selection Page
 * Minimal role selection for new Google OAuth users
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
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
    // Remove any token from URL for security
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
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">ConvexHire</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Choose your role
          </h1>
          <p className="text-muted-foreground">
            Select how you'll use ConvexHire
          </p>
        </div>

        {/* Role Options */}
        <div className="space-y-4 mb-8">
          {/* Candidate Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                selectedRole === 'candidate' 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:shadow-md hover:bg-card-hover'
              }`}
              onClick={() => setSelectedRole('candidate')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <User className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Candidate</h3>
                    <p className="text-sm text-muted-foreground">Find your next job</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recruiter Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                selectedRole === 'recruiter' 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:shadow-md hover:bg-card-hover'
              }`}
              onClick={() => setSelectedRole('recruiter')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Recruiter</h3>
                    <p className="text-sm text-muted-foreground">Hire top talent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={handleRoleSelect}
            disabled={!selectedRole || isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Continue'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
