'use client';

import Link from 'next/link';
import { SearchParamsWrapper } from '../../components/common/SearchParamsWrapper';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton';
import { PageTransition } from '../../components/common/PageTransition';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../lib/utils';
import { useState } from 'react';

export default function Login() {
  const { login, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setFieldError('email', errorMessage);
    }
  };

  const handleGoogleSuccess = () => {
    // Google login initiated
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
              {/* Page Title */}
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0F172A] mb-4 sm:mb-6 text-center">Sign In</h2>

              {/* Auth Error Display */}
              {authError && (
                <div className="mb-4 sm:mb-6 p-3 bg-[#FEF2F2] border border-[#DC2626]/20 rounded-xl flex items-center gap-2 text-[#DC2626] text-xs sm:text-sm">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {authError}
                </div>
              )}

              {/* Google OAuth Button */}
              <div className="mb-4 sm:mb-6">
                <GoogleOAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  disabled={isLoading}
                />
              </div>

              {/* Divider */}
              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E7EB]"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="bg-white px-3 sm:px-4 text-[#94A3B8]">Or continue with email</span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                {/* Email Field */}
                <div className="space-y-1 sm:space-y-2">
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-[#0F172A]">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={values.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={isLoading}
                    className={`w-full h-10 sm:h-12 px-3 sm:px-4 bg-white border-[1.5px] rounded-lg sm:rounded-xl text-sm sm:text-[15px] text-[#0F172A] placeholder-[#94A3B8] transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${errors.email
                        ? 'border-[#DC2626] bg-[#FEF2F2] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10'
                        : 'border-[#E5E7EB] focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10'
                      }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-[#DC2626] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1 sm:space-y-2">
                  <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-[#0F172A]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={values.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      disabled={isLoading}
                      className={`w-full h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-white border-[1.5px] rounded-lg sm:rounded-xl text-sm sm:text-[15px] text-[#0F172A] placeholder-[#94A3B8] transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${errors.password
                          ? 'border-[#DC2626] bg-[#FEF2F2] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10'
                          : 'border-[#E5E7EB] focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-[#DC2626] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={values.rememberMe === 'true'}
                      onChange={(e) => handleChange('rememberMe', e.target.checked.toString())}
                      disabled={isLoading}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-md border-[1.5px] border-[#E5E7EB] text-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="rememberMe" className="text-xs sm:text-sm text-[#475569]">
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-xs sm:text-sm font-medium text-[#3056F5] hover:text-[#2B3CF5] hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 sm:h-12 bg-[#3056F5] hover:bg-[#2B3CF5] text-white text-sm sm:text-[15px] font-semibold rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#3056F5] disabled:hover:shadow-none mt-4 sm:mt-6 flex items-center justify-center gap-2"
                  style={{ boxShadow: isLoading ? 'none' : '0 4px 12px rgba(48,86,245,0.3)' }}
                >
                  {isLoading && <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xs sm:text-sm text-[#475569]">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="font-medium text-[#3056F5] hover:text-[#2B3CF5] hover:underline transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </AuthLayout>
          );
        }}
      </SearchParamsWrapper>
    </PageTransition>
  );
}
