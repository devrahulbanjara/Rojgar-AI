'use client';

import Link from 'next/link';
import { SearchParamsWrapper } from '../../components/common/SearchParamsWrapper';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { FormInput } from '../../components/forms/FormInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton';
import { PageTransition } from '../../components/common/PageTransition';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../lib/utils';
import { ROUTES } from '../../config/constants';
import { useEffect, useState } from 'react';

export default function Login() {
  const { login, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [formState, formActions] = useForm<{
    email: string;
    password: string;
    rememberMe: string;
  }>({
    initialValues: { email: '', password: '', rememberMe: 'false' },
    validationRules: {
      email: [validateEmail],
      password: [validatePassword],
    },
  });
  
  const { values, errors } = formState;
  const { handleChange, handleSubmit, setFieldError } = formActions;

  // Check for auth errors from URL params
  const handleSearchParams = (searchParams: URLSearchParams) => {
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      setAuthError('Authentication failed. Please try again.');
    }
  };

  const onSubmit = async (formValues: Record<string, string>) => {
    try {
      await login({
        email: formValues.email,
        password: formValues.password,
        rememberMe: formValues.rememberMe === 'true',
      });
    } catch (error: any) {
      // Handle login errors
      const errorMessage = error?.message || 'Login failed. Please try again.';
      setFieldError('email', errorMessage);
    }
  };

  const handleGoogleSuccess = () => {
    // Google login initiated successfully
    console.log('Google login initiated');
  };

  const handleGoogleError = (error: string) => {
    setAuthError(error);
  };

  return (
    <PageTransition>
      <SearchParamsWrapper>
        {(searchParams) => {
          handleSearchParams(searchParams);
          return (
            <AuthLayout
              title="Welcome back"
              subtitle="Sign in to your account to continue"
            >
        <Card className="backdrop-blur-sm bg-card/80 border border-border/50 shadow-xl animate-fade-in-up">
          <CardHeader className="space-y-1 animate-fade-in-down">
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
          </CardHeader>
        <CardContent>
          {/* Auth Error Display */}
          {authError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm animate-fade-in-down">
              <AlertCircle className="h-4 w-4" />
              {authError}
            </div>
          )}

          {/* Google OAuth Button */}
          <div className="mb-6 animate-fade-in-up stagger-1">
            <GoogleOAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={isLoading}
            />
          </div>

          {/* Divider */}
          <div className="relative mb-6 animate-fade-in-up stagger-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in-up stagger-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <FormInput
                id="email"
                type="email"
                placeholder="Enter your email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                icon={Mail}
                disabled={isLoading}
                className="animate-fade-in-up stagger-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <FormInput
                id="password"
                type="password"
                placeholder="Enter your password"
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                icon={Lock}
                disabled={isLoading}
                className="animate-fade-in-up stagger-5"
              />
            </div>

            <div className="flex items-center justify-between animate-fade-in-up stagger-6">
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={values.rememberMe === 'true'}
                  onChange={(e) => handleChange('rememberMe', e.target.checked.toString())}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  disabled={isLoading}
                />
                <Label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full animate-fade-in-up stagger-7"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center animate-fade-in-up stagger-8">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
            </Card>
          </AuthLayout>
          );
        }}
      </SearchParamsWrapper>
    </PageTransition>
  );
}
