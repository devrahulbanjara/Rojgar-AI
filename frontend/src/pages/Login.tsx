import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { FormInput } from '../components/forms/FormInput';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useForm } from '../hooks/useForm';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePassword } from '../utils/validation';
import { ROUTES } from '../config/constants';

export default function Login() {
  const { login, isLoading } = useAuth();
  
  const { values, errors, handleChange, handleSubmit, setFieldError } = useForm({
    initialValues: { email: '', password: '' },
    validationRules: {
      email: validateEmail,
      password: validatePassword,
    },
  });

  const onSubmit = async (formValues: Record<string, string>) => {
    try {
      await login({
        email: formValues.email,
        password: formValues.password,
      });
    } catch (error: any) {
      // Handle login errors
      const errorMessage = error?.message || 'Login failed. Please try again.';
      setFieldError('email', errorMessage);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <Card className="backdrop-blur-sm bg-card/80 border border-border/50 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            />

            {/* Password */}
            <FormInput
              id="password"
              name="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              icon={<Lock className="h-4 w-4" />}
            />

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full group" 
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" message="Signing in..." />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to={ROUTES.SIGNUP} className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
