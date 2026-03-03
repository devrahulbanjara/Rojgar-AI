"use client";

import {
  useState,
  useRef,
  FormEvent,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "@/store/services/authApi";
import { parseApiError } from "@/lib/apiError";
import { toast } from "react-toastify";

// ── Types ──────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface StepMeta {
  label: string;
}

const STEPS: Record<Step, StepMeta> = {
  1: { label: "Email" },
  2: { label: "Verify" },
  3: { label: "Reset" },
};

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

// ── Inline SVG icons ───────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  );
}

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

// ── Validation helpers ─────────────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Please enter a valid email address.";
  return undefined;
}

function validateNewPasswords(
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

// ── Sub-component: Step indicator ──────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = [1, 2, 3];
  return (
    <div className="auth__steps" aria-label="Progress">
      {steps.map((step, idx) => {
        const done = current > step;
        const active = current === step;
        const modifier = done
          ? "auth__step--done"
          : active
            ? "auth__step--active"
            : "";
        return (
          <div key={step} className={`auth__step ${modifier}`}>
            <div className="auth__step-node">
              <div className="auth__step-circle">
                {done ? <CheckIcon /> : step}
              </div>
              <span className="auth__step-text">{STEPS[step].label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`auth__step-line${done ? " auth__step-line--done" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-component: OTP inputs ──────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  hasError,
  disabled,
}: {
  value: string[];
  onChange: (digits: string[]) => void;
  hasError: boolean;
  disabled: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function focusAt(idx: number) {
    inputRefs.current[idx]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Backspace") {
      if (value[idx]) {
        const next = [...value];
        next[idx] = "";
        onChange(next);
      } else if (idx > 0) {
        focusAt(idx - 1);
        const next = [...value];
        next[idx - 1] = "";
        onChange(next);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      focusAt(idx - 1);
    } else if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      focusAt(idx + 1);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    // Handle paste-into-single-box (browser autofill, etc.)
    if (raw.length > 1) {
      const digits = raw.slice(0, OTP_LENGTH).split("");
      const next = [...value];
      digits.forEach((d, i) => {
        if (idx + i < OTP_LENGTH) next[idx + i] = d;
      });
      onChange(next);
      focusAt(Math.min(idx + digits.length, OTP_LENGTH - 1));
      return;
    }
    const next = [...value];
    next[idx] = raw;
    onChange(next);
    if (idx < OTP_LENGTH - 1) focusAt(idx + 1);
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>, idx: number) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...value];
    pasted.split("").forEach((d, i) => {
      if (idx + i < OTP_LENGTH) next[idx + i] = d;
    });
    onChange(next);
    focusAt(Math.min(idx + pasted.length, OTP_LENGTH - 1));
  }

  return (
    <div
      className="auth__otp"
      role="group"
      aria-label="6-digit verification code"
    >
      {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[idx] ?? ""}
          onChange={(e) => handleInput(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={(e) => handlePaste(e, idx)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
          className={[
            "auth__otp-input",
            value[idx] ? "auth__otp-input--filled" : "",
            hasError ? "auth__otp-input--error" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          autoComplete={idx === 0 ? "one-time-code" : "off"}
        />
      ))}
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();

  // Step 2
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});

  // Shared
  const router = useRouter();
  const [forgotPassword, { isLoading: isSendingCode }] =
    useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();
  const isLoading = isSendingCode || isResetting;

  // ── Cooldown timer ────────────────────────────────────────
  function startCooldown() {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Step 1: send code ─────────────────────────────────────
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    try {
      const result = await forgotPassword({ email }).unwrap();
      if (result.success) {
        setStep(2);
        startCooldown();
      } else {
        toast.error(result.message ?? "Failed to send code. Please try again.");
      }
    } catch (err: unknown) {
      const { message } = parseApiError(
        err,
        { email: "email" },
        "Failed to send code. Please try again.",
      );
      toast.error(message);
    }
  }

  // ── Step 2: verify OTP ────────────────────────────────────
  // The OTP is the reset token issued by the backend. We validate it
  // on the server only when calling /auth/reset-password in step 3,
  // so here we just confirm all 6 digits are filled and advance.
  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setOtpError("Please enter all 6 digits.");
      return;
    }
    setStep(3);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError(undefined);
    try {
      const result = await forgotPassword({ email }).unwrap();
      if (result.success) {
        startCooldown();
        toast.success("A new code has been sent to your email.");
      } else {
        toast.error(result.message ?? "Failed to resend. Please try again.");
      }
    } catch (err: unknown) {
      const { message } = parseApiError(
        err,
        {},
        "Failed to resend. Please try again.",
      );
      toast.error(message);
    }
  }

  // ── Step 3: reset password ────────────────────────────────
  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validateNewPasswords(password, confirmPassword);
    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }
    try {
      const result = await resetPassword({
        token: otp.join(""),
        new_password: password,
      }).unwrap();

      if (result.success) {
        toast.success(
          result.message ??
            "Password reset successfully! Redirecting to sign in…",
        );
        setTimeout(() => router.push("/login"), 1800);
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
      // Token errors — kick back to OTP step
      if (parsed.fieldErrors._token) {
        setStep(2);
        setOtp(Array(OTP_LENGTH).fill(""));
        setOtpError(parsed.fieldErrors._token);
        return;
      }
      // Password field errors
      if (parsed.fieldErrors._password) {
        setPasswordErrors({ password: parsed.fieldErrors._password });
        return;
      }
      toast.error(parsed.message);
    }
  }

  // ── Dynamic header copy per step ──────────────────────────
  const headings: Record<
    Step,
    { label: string; title: string; subtitle: string }
  > = {
    1: {
      label: "Forgot password",
      title: "Reset your password",
      subtitle: "Enter your account email and we'll send you a 6-digit code.",
    },
    2: {
      label: "Check your email",
      title: "Enter the code",
      subtitle: `We sent a 6-digit code to ${email || "your email"}. It expires in 10 minutes.`,
    },
    3: {
      label: "Almost done",
      title: "Create new password",
      subtitle: "Choose a strong password you haven't used before.",
    },
  };

  const h = headings[step];

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
          <span className="auth__label">{h.label}</span>
          <h1 className="auth__title">{h.title}</h1>
          <p className="auth__subtitle">{h.subtitle}</p>
        </header>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="auth__card">
          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <form
              className="auth__form"
              onSubmit={handleEmailSubmit}
              noValidate
            >
              <div className="auth__field">
                <label htmlFor="fp-email" className="auth__label">
                  Email address
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="fp-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(undefined);
                    }}
                    disabled={isLoading}
                    className={`auth__input${emailError ? " auth__input--error" : ""}`}
                    aria-describedby={emailError ? "fp-email-error" : undefined}
                  />
                </div>
                {emailError && (
                  <span
                    id="fp-email-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {emailError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`auth__submit${isLoading ? " auth__submit--loading" : ""}`}
                aria-busy={isLoading}
              >
                {isLoading ? "Sending code…" : "Send reset code"}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <form className="auth__form" onSubmit={handleOtpSubmit} noValidate>
              <div className="auth__field">
                <OtpInput
                  value={otp}
                  onChange={(digits) => {
                    setOtp(digits);
                    if (otpError) setOtpError(undefined);
                  }}
                  hasError={!!otpError}
                  disabled={isLoading}
                />
                {otpError && (
                  <span
                    className="auth__error-msg"
                    role="alert"
                    style={{ textAlign: "center" }}
                  >
                    {otpError}
                  </span>
                )}
              </div>

              <div className="auth__resend">
                <span>Didn&apos;t receive it?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleResend}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join("").length < OTP_LENGTH}
                className={`auth__submit${isLoading ? " auth__submit--loading" : ""}`}
                aria-busy={isLoading}
              >
                {isLoading ? "Verifying…" : "Verify code"}
              </button>

              <button
                type="button"
                className="auth__back-btn"
                onClick={() => {
                  setStep(1);
                  setOtp(Array(OTP_LENGTH).fill(""));
                  setOtpError(undefined);
                }}
                style={{ alignSelf: "center" }}
              >
                <ArrowLeftIcon />
                Back to email
              </button>
            </form>
          )}

          {/* ── STEP 3: New password ── */}
          {step === 3 && (
            <form
              className="auth__form"
              onSubmit={handlePasswordSubmit}
              noValidate
            >
              {/* New password */}
              <div className="auth__field">
                <label htmlFor="fp-password" className="auth__label">
                  New password
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="fp-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordErrors.password)
                        setPasswordErrors((p) => ({
                          ...p,
                          password: undefined,
                        }));
                    }}
                    disabled={isLoading}
                    className={`auth__input auth__input--password${passwordErrors.password ? " auth__input--error" : ""}`}
                    aria-describedby={
                      passwordErrors.password ? "fp-pw-error" : undefined
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
                {passwordErrors.password && (
                  <span
                    id="fp-pw-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {passwordErrors.password}
                  </span>
                )}
              </div>

              {/* Confirm password */}
              <div className="auth__field">
                <label htmlFor="fp-confirm" className="auth__label">
                  Confirm new password
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="fp-confirm"
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirm)
                        setPasswordErrors((p) => ({
                          ...p,
                          confirm: undefined,
                        }));
                    }}
                    disabled={isLoading}
                    className={`auth__input auth__input--password${passwordErrors.confirm ? " auth__input--error" : ""}`}
                    aria-describedby={
                      passwordErrors.confirm ? "fp-confirm-error" : undefined
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
                {passwordErrors.confirm && (
                  <span
                    id="fp-confirm-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {passwordErrors.confirm}
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
          Remembered your password?
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
