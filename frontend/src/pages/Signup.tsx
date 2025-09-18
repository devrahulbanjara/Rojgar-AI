import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { FormInput } from '../components/forms/FormInput';
import { UserTypeSelector } from '../components/forms/UserTypeSelector';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useForm } from '../hooks/useForm';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePassword, validateName, validateConfirmPassword } from '../utils/validation';
import { ROUTES, FEATURES, USER_TYPES } from '../config/constants';
import type { UserType } from '../types';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const { signup, isLoading } = useAuth();
  
  const { values, errors, handleChange, handleSubmit, setFieldError } = useForm({
    initialValues: { 
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: USER_TYPES.RECRUITER
    },
    validationRules: {
      name: validateName,
      email: validateEmail,
      password: validatePassword,
      confirmPassword: (value: string) => validateConfirmPassword(values.password, value),
    },
  });

  // Set user type from URL parameter
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'candidate' || typeParam === 'recruiter') {
      handleChange('userType', typeParam);
    }
  }, [searchParams, handleChange]);

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

  const handleUserTypeChange = (userType: UserType) => {
    handleChange('userType', userType);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of users transforming recruitment"
    >
      <Card className="backdrop-blur-sm bg-card/80 border border-border/50 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* User Type Selection */}
            <UserTypeSelector
              value={values.userType as UserType}
              onChange={handleUserTypeChange}
            />

            {/* Name */}
            <FormInput
              id="name"
              name="name"
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={values.name}
              onChange={handleChange}
              error={errors.name}
              icon={<User className="h-4 w-4" />}
              required
            />

            {/* Email */}
            <FormInput
              id="email"
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            {/* Password */}
            <FormInput
              id="password"
              name="password"
              label="Password"
              type="password"
              placeholder="Create a password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              icon={<Lock className="h-4 w-4" />}
              required
            />

            {/* Confirm Password */}
            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={values.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={<Lock className="h-4 w-4" />}
              required
            />

            {/* Terms and conditions */}
            <div className="flex items-start space-x-2">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                required
              />
              <Label htmlFor="terms" className="text-sm leading-5">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full group" 
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" message="Creating account..." />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Features badge */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm font-medium mb-2">What you get:</p>
            <div className="space-y-1">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-600" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Sign in link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
