"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

// ── Inline SVG icons ───────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="#0A66C2"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateForm(values: LoginFormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [formValues, setFormValues] = useState<LoginFormState>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formAlert, setFormAlert] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormAlert(null);

    const validationErrors = validateForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with real auth call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setFormAlert({
        type: "success",
        message: "Signed in successfully! Redirecting…",
      });
    } catch {
      setFormAlert({
        type: "error",
        message: "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSocialLogin(provider: string) {
    // TODO: Replace with real OAuth redirect
    console.log(`Login with ${provider}`);
  }

  return (
    <main className="auth">
      {/* Background decorations */}
      <Image
        src="/bg/bg-ui-v3.svg"
        alt=""
        width={700}
        height={700}
        className="auth__bg-top"
        aria-hidden="true"
        priority={false}
      />
      <Image
        src="/bg/bg-ui-v5.svg"
        alt=""
        width={650}
        height={650}
        className="auth__bg-bottom"
        aria-hidden="true"
        priority={false}
      />

      <div className="auth__inner">
        {/* Header */}
        <header className="auth__header">
          <h1 className="auth__title">Sign in to ConvexHire</h1>
          <p className="auth__subtitle">
            Access thousands of job listings and career opportunities.
          </p>
        </header>

        {/* Card */}
        <div className="auth__card">
          {/* Form-level alert */}
          {formAlert && (
            <div
              className={`auth__alert auth__alert--${formAlert.type}`}
              role="alert"
            >
              {formAlert.message}
            </div>
          )}

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="auth__field">
              <label htmlFor="email" className="auth__label">
                Email address
              </label>
              <div className="auth__input-wrap">
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formValues.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`auth__input${errors.email ? " auth__input--error" : ""}`}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <span id="email-error" className="auth__error-msg" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="auth__field">
              <label htmlFor="password" className="auth__label">
                Password
              </label>
              <div className="auth__input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formValues.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`auth__input auth__input--password${errors.password ? " auth__input--error" : ""}`}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  className="auth__pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <span
                  id="password-error"
                  className="auth__error-msg"
                  role="alert"
                >
                  {errors.password}
                </span>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="auth__field-row">
              <label className="auth__checkbox-field">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formValues.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="auth__forgot">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`auth__submit${isLoading ? " auth__submit--loading" : ""}`}
              aria-busy={isLoading}
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="auth__divider">
            <span>or continue with</span>
          </div>

          {/* Social login */}
          <div className="auth__social-btns">
            <button
              type="button"
              className="auth__social-btn"
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading}
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              type="button"
              className="auth__social-btn"
              onClick={() => handleSocialLogin("linkedin")}
              disabled={isLoading}
            >
              <LinkedInIcon />
              Continue with LinkedIn
            </button>
          </div>
        </div>

        {/* Switch to signup */}
        <p className="auth__switch">
          Don&apos;t have an account?
          <Link href="/signup">Create one for free</Link>
        </p>
      </div>
    </main>
  );
}
