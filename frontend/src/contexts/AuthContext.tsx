/**
 * Simplified Authentication Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthState, SignupData } from '@/types';
import { authService } from '@/services';
import { ROUTES } from '@/config';

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  // Login handler
  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      
      // Navigate to appropriate dashboard
      const targetRoute = result.user.role === 'recruiter' 
        ? ROUTES.RECRUITER.DASHBOARD 
        : ROUTES.CANDIDATE.DASHBOARD;
      navigate(targetRoute);
    }
    
    return result;
  }, [navigate]);

  // Signup handler
  const signup = useCallback(async (data: SignupData) => {
    return await authService.signup(data);
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    navigate(ROUTES.HOME);
  }, [navigate]);

  // Switch role handler (for demo)
  const switchRole = useCallback(() => {
    if (!user) return;
    
    const updatedUser = authService.switchRole(user);
    setUser(updatedUser);
    
    // Navigate to new role's dashboard
    const targetRoute = updatedUser.role === 'recruiter'
      ? ROUTES.RECRUITER.DASHBOARD
      : ROUTES.CANDIDATE.DASHBOARD;
    navigate(targetRoute);
  }, [user, navigate]);

  const value: AuthState = {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    switchRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}