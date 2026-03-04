"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPasswordMutation } from "@/store/services/authApi";
import { parseApiError } from "@/lib/apiError";
import { toast } from "react-toastify";

// ── Validation ─────────────────────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validatePasswords(
  password: string,
  confirm: string,
): { password?: string; confirm?: string } {
  const errs: { password?: string; confirm?: string } = {};
  if (!password) {
    errs.password = "Password is required.";
  } else if (!PASSWORD_REGEX.test(password)) {
    errs.password =
      "Must be 8+ characters with an uppercase letter, lowercase letter, and number.";
  }
  if (!confirm) {
    errs.confirm = "Please confirm your new password.";
  } else if (password !== confirm) {
    errs.confirm = "Passwords do not match.";
  }
  return errs;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
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
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

// ── Inner component (needs useSearchParams, must be inside Suspense) ───────

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [done, setDone] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  // Warn early if the link has no token
  const missingToken = !token;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validatePasswords(password, confirmPassword);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      const result = await resetPassword({
        token,
        new_password: password,
      }).unwrap();

      if (result.success) {
        setDone(true);
        toast.success(
          result.message ?? "Password reset! Redirecting to sign in…",
        );
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error(
          result.message ?? "Something went wrong. Please try again.",
        );
      }
    } catch (err: unknown) {
      const parsed = parseApiError(err, {
        token: "_token",
        new_password: "_password",
      });
      if (parsed.fieldErrors._token) {
        toast.error(
          parsed.fieldErrors._token +
            " Please request a new password reset link.",
        );
        return;
      }
      if (parsed.fieldErrors._password) {
        setErrors({ password: parsed.fieldErrors._password });
        return;
      }
      toast.error(parsed.message);
    }
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
          <span className="auth__label">
            {done ? "All done" : "Almost done"}
          </span>
          <h1 className="auth__title">
            {done ? "Password updated!" : "Create new password"}
          </h1>
          <p className="auth__subtitle">
            {done
              ? "Your password has been reset. Redirecting you to sign in…"
              : "Choose a strong password you haven't used before."}
          </p>
        </header>

        {/* Card */}
        <div className="auth__card">
          {/* ── Invalid / missing token ── */}
          {missingToken && (
            <div
              style={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <p
                className="auth__subtitle"
                style={{ color: "var(--color-error, #ef4444)" }}
              >
                This reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="auth__submit"
                style={{ textDecoration: "none", textAlign: "center" }}
              >
                Request a new link
              </Link>
            </div>
          )}

          {/* ── Success state ── */}
          {done && !missingToken && (
            <p
              className="auth__subtitle"
              style={{
                textAlign: "center",
                color: "var(--color-success, #22c55e)",
              }}
            >
              Redirecting…
            </p>
          )}

          {/* ── Password form ── */}
          {!missingToken && !done && (
            <form className="auth__form" onSubmit={handleSubmit} noValidate>
              {/* New password */}
              <div className="auth__field">
                <label htmlFor="rp-password" className="auth__label">
                  New password
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="rp-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    disabled={isLoading}
                    className={`auth__input auth__input--password${errors.password ? " auth__input--error" : ""}`}
                    aria-describedby={
                      errors.password ? "rp-pw-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    className="auth__pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <span
                    id="rp-pw-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {errors.password}
                  </span>
                )}
              </div>

              {/* Confirm password */}
              <div className="auth__field">
                <label htmlFor="rp-confirm" className="auth__label">
                  Confirm new password
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="rp-confirm"
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirm)
                        setErrors((p) => ({ ...p, confirm: undefined }));
                    }}
                    disabled={isLoading}
                    className={`auth__input auth__input--password${errors.confirm ? " auth__input--error" : ""}`}
                    aria-describedby={
                      errors.confirm ? "rp-confirm-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    className="auth__pw-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirm && (
                  <span
                    id="rp-confirm-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {errors.confirm}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`auth__submit${isLoading ? " auth__submit--loading" : ""}`}
                aria-busy={isLoading}
              >
                {isLoading ? "Resetting password…" : "Reset password"}
              </button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="auth__switch">
          Remembered your password? <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}

// ── Page export (Suspense required for useSearchParams) ────────────────────

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
