'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SearchParamsWrapper } from '../../components/common/SearchParamsWrapper';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { FormInput } from '../../components/forms/FormInput';
import { UserTypeSelector } from '../../components/forms/UserTypeSelector';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton';
import { PageTransition } from '../../components/common/PageTransition';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateName } from '../../lib/utils';
import { ROUTES, USER_TYPES } from '../../config/constants';
import type { UserType } from '../../types';

export default function Signup() {
  const { signup, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [formState, formActions] = useForm<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    userType: string;
  }>({
    initialValues: { 
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: USER_TYPES.RECRUITER
    },
    validationRules: {
      name: [validateName],
      email: [validateEmail],
      password: [validatePassword],
      // confirmPassword handled manually
    },
  });
  
  const { values, errors } = formState;
  const { handleChange, handleSubmit, setFieldError } = formActions;

  // Manual validation for confirmPassword
  useEffect(() => {
    if (values.confirmPassword) {
      if (!values.confirmPassword) {
        setFieldError('confirmPassword', 'Please confirm your password');
      } else if (values.password && values.confirmPassword !== values.password) {
        setFieldError('confirmPassword', 'Passwords do not match');
      } else {
        setFieldError('confirmPassword', '');
      }
    }
  }, [values.password, values.confirmPassword, setFieldError]);

  // Set user type from URL parameter and check for auth errors
  const handleSearchParams = (searchParams: URLSearchParams) => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'candidate' || typeParam === 'recruiter') {
      handleChange('userType', typeParam);
    }

    // Check for auth errors from URL params
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      setAuthError('Authentication failed. Please try again.');
    }
  };

  const onSubmit = async (formValues: Record<string, string>) => {
    // Validate passwords match
    if (formValues.password !== formValues.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      return;
    }

    try {
      await signup({
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
        confirmPassword: formValues.confirmPassword,
        userType: formValues.userType as UserType,
      });
    } catch (error: any) {
      // Handle signup errors
      const errorMessage = error?.message || 'Signup failed. Please try again.';
      setFieldError('email', errorMessage);
    }
  };

  const handleGoogleSuccess = () => {
    // Google signup initiated successfully
    console.log('Google signup initiated');
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
              title="Create your account"
              subtitle="Join ConvexHire and start your journey"
            >
        <Card className="backdrop-blur-sm bg-card/80 border border-border/50 shadow-xl animate-fade-in-up">
          <CardHeader className="space-y-1 animate-fade-in-down">
            <CardTitle className="text-xl text-center">Sign Up</CardTitle>
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

            {/* Signup Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in-up stagger-3">
              {/* User Type Selector */}
              <div className="space-y-2 animate-fade-in-up stagger-4">
                <Label className="text-sm font-medium">I am a</Label>
                <UserTypeSelector
                  value={values.userType}
                  onChange={(value) => handleChange('userType', value)}
                  disabled={isLoading}
                />
              </div>

              {/* Name Field */}
              <div className="space-y-2 animate-fade-in-up stagger-5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <FormInput
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  icon={User}
                  disabled={isLoading}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2 animate-fade-in-up stagger-6">
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
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2 animate-fade-in-up stagger-7">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <FormInput
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={values.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  error={errors.password}
                  icon={Lock}
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2 animate-fade-in-up stagger-8">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <FormInput
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={values.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  icon={Lock}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full animate-fade-in-up stagger-9"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center animate-fade-in-up stagger-10">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign in
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
