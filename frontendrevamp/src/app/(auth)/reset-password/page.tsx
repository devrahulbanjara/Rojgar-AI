"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPasswordMutation } from "@/store/services/authApi";
import { parseApiError } from "@/lib/apiError";
import { toast } from "react-toastify";
import { EyeRegular, EyeOffRegular } from "@fluentui/react-icons";

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
  return <EyeRegular aria-hidden="true" />;
}

function EyeSlashIcon() {
  return <EyeOffRegular aria-hidden="true" />;
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

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
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
