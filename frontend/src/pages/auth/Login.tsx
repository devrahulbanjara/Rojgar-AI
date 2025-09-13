/**
 * Simplified Login Page
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Sparkles, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/common/FormField';
import { LoadingButton } from '@/components/common/LoadingButton';
import { detectUserRole } from '@/lib/auth/authService';
import { DEMO_USERS } from '@/lib/constants';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleHint, setRoleHint] = useState('');
  
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Show role hint based on email
    if (value.includes('@')) {
      const role = detectUserRole(value);
      setRoleHint(role === 'recruiter' 
        ? 'Looks like a Recruiter account' 
        : 'Looks like a Candidate account'
      );
    } else {
      setRoleHint('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
    } else {
      toast({
        title: "Welcome back!",
        description: `Logged in as ${result.user?.name}`,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4 relative">
      {/* Back to Home button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-8 left-8"
      >
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate('/')}
          className="group relative overflow-hidden rounded-xl bg-background/50 backdrop-blur-md border border-border/50 hover:bg-background/80 hover:border-primary/50 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="relative">Back to Home</span>
          <Home className="ml-2 h-4 w-4 text-primary" />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="glass">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-brand rounded-xl">
                <Sparkles className="h-8 w-8 text-brand-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                icon={Mail}
                required
                hint={roleHint}
              />

              <FormField
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={Lock}
                required
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-secondary/50 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Demo Credentials:</p>
                <p className="text-muted-foreground">
                  Recruiter: {DEMO_USERS.recruiter.email} / {DEMO_USERS.recruiter.password}
                </p>
                <p className="text-muted-foreground">
                  Candidate: {DEMO_USERS.candidate.email} / {DEMO_USERS.candidate.password}
                </p>
              </div>

              <LoadingButton
                type="submit"
                className="w-full"
                loading={loading}
                loadingText="Logging in..."
                icon={LogIn}
              >
                Login
              </LoadingButton>
            </form>

            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}