'use client';

/**
 * Role Selection Page
 * Updated with new design system - matches auth pages
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchParamsWrapper } from '../../components/common/SearchParamsWrapper';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';
import { ROUTES } from '../../config/constants';
import { Briefcase, User, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { LogoLink } from '../../components/common/Logo';
import Link from 'next/link';
import { PageTransition } from '../../components/common/PageTransition';

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handle search params
  const handleSearchParams = (searchParams: URLSearchParams) => {
    // Remove any token from URL for security
    const token = searchParams.get('token');
    if (token) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        router.push(ROUTES.LOGIN);
      }
    };

    checkAuth();
  }, [router]);

  const handleRoleSelect = async () => {
    if (!selectedRole) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.selectRole(selectedRole);
      router.push(response.redirect_url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to select role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <SearchParamsWrapper>
        {(searchParams) => {
          handleSearchParams(searchParams);
          return (
            <div
              className="min-h-screen flex items-center justify-center p-6"
              style={{ background: '#F9FAFB' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-[440px]"
              >
                {/* Logo - Above Card */}
                <div className="flex justify-center mb-10">
                  <LogoLink variant="full" size="lg" />
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-[32px] font-bold text-[#0F172A] mb-2 leading-tight">
                    Choose your role
                  </h1>
                  <p className="text-base text-[#475569] leading-relaxed">
                    Select how you&apos;ll use ConvexHire
                  </p>
                </div>

                {/* Content Card */}
                <div
                  className="bg-white rounded-3xl p-12 max-md:p-8 border border-[#E5E7EB]"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                >
                  {/* Error Display */}
                  {error && (
                    <div className="mb-6 p-3 bg-[#FEF2F2] border border-[#DC2626]/20 rounded-xl flex items-center gap-2 text-[#DC2626] text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Role Options */}
                  <div className="space-y-3 mb-8">
                    {/* Recruiter Option */}
                    <motion.button
                      type="button"
                      onClick={() => setSelectedRole('recruiter')}
                      disabled={isLoading}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className={`w-full p-5 rounded-xl border-[1.5px] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                        selectedRole === 'recruiter'
                          ? 'bg-[#3056F5] border-[#3056F5] shadow-lg'
                          : 'bg-white border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                            selectedRole === 'recruiter'
                              ? 'bg-white/20'
                              : 'bg-[#3056F5]/10'
                          }`}
                        >
                          <Briefcase
                            className={`h-6 w-6 transition-colors duration-200 ${
                              selectedRole === 'recruiter'
                                ? 'text-white'
                                : 'text-[#3056F5]'
                            }`}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <h3
                            className={`text-base font-semibold mb-1 transition-colors duration-200 ${
                              selectedRole === 'recruiter'
                                ? 'text-white'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            I&apos;m hiring talent
                          </h3>
                          <p
                            className={`text-sm transition-colors duration-200 ${
                              selectedRole === 'recruiter'
                                ? 'text-white/80'
                                : 'text-[#475569]'
                            }`}
                          >
                            Post jobs and find qualified candidates
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          selectedRole === 'recruiter'
                            ? 'border-white bg-white'
                            : 'border-[#E5E7EB] bg-white'
                        }`}>
                          {selectedRole === 'recruiter' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#3056F5]"></div>
                          )}
                        </div>
                      </div>
                    </motion.button>

                    {/* Candidate Option */}
                    <motion.button
                      type="button"
                      onClick={() => setSelectedRole('candidate')}
                      disabled={isLoading}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className={`w-full p-5 rounded-xl border-[1.5px] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                        selectedRole === 'candidate'
                          ? 'bg-[#3056F5] border-[#3056F5] shadow-lg'
                          : 'bg-white border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                            selectedRole === 'candidate'
                              ? 'bg-white/20'
                              : 'bg-[#3056F5]/10'
                          }`}
                        >
                          <User
                            className={`h-6 w-6 transition-colors duration-200 ${
                              selectedRole === 'candidate'
                                ? 'text-white'
                                : 'text-[#3056F5]'
                            }`}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <h3
                            className={`text-base font-semibold mb-1 transition-colors duration-200 ${
                              selectedRole === 'candidate'
                                ? 'text-white'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            I&apos;m looking for a job
                          </h3>
                          <p
                            className={`text-sm transition-colors duration-200 ${
                              selectedRole === 'candidate'
                                ? 'text-white/80'
                                : 'text-[#475569]'
                            }`}
                          >
                            Find opportunities and apply to positions
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          selectedRole === 'candidate'
                            ? 'border-white bg-white'
                            : 'border-[#E5E7EB] bg-white'
                        }`}>
                          {selectedRole === 'candidate' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#3056F5]"></div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  {/* Continue Button */}
                  <motion.button
                    onClick={handleRoleSelect}
                    disabled={!selectedRole || isLoading}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="w-full h-12 bg-[#3056F5] hover:bg-[#2B3CF5] text-white text-[15px] font-semibold rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#3056F5] disabled:hover:shadow-none flex items-center justify-center gap-2"
                    style={{ boxShadow: isLoading || !selectedRole ? 'none' : '0 4px 12px rgba(48,86,245,0.3)' }}
                  >
                    {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                    {isLoading ? 'Setting up your account...' : 'Continue'}
                  </motion.button>

                  {/* Helper Text */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="mt-6 text-center text-xs text-[#94A3B8]"
                  >
                    You can change this later in your account settings
                  </motion.p>
                </div>

                {/* Back to home - Below Card */}
                <div className="text-center mt-6">
                  <Link
                    href={ROUTES.HOME}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#3056F5] hover:text-[#2B3CF5] transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                  </Link>
                </div>
              </motion.div>
            </div>
          );
        }}
      </SearchParamsWrapper>
    </PageTransition>
  );
}
