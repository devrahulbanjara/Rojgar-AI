"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useSignupMutation,
  initiateGoogleOAuth,
} from "@/store/services/authApi";
import {
  useRegisterCompanyMutation,
  useRequestJoinCompanyMutation,
} from "@/store/services/companyApi";
import { parseApiError, applyFieldErrors } from "@/lib/apiError";
import { toast } from "react-toastify";

// ── Step type ──────────────────────────────────────────────────────────────

type FlowStep =
  | "credentials"
  | "intent"
  | "company-choice"
  | "company-details"
  | "join-company"
  | "email-verify"
  | "join-pending";

// ── Form state types ───────────────────────────────────────────────────────

interface CredentialsState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface CompanyDetailsState {
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  location: string;
  description: string;
}

interface FormErrors extends Record<string, string | undefined> {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  joinCompanyName?: string;
  form?: string;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────

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

function BriefcaseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

function SearchJobIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
      />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
      />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

// ── Validation ─────────────────────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateCredentials(values: CredentialsState): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (values.fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.fullName = "Please enter your first and last name.";
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (!PASSWORD_REGEX.test(values.password)) {
    errors.password =
      "Password must be at least 8 characters with an uppercase letter, a lowercase letter, and a number.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!values.acceptTerms) {
    errors.acceptTerms = "You must accept the Terms & Conditions to continue.";
  }

  return errors;
}

function validateCompanyDetails(values: CompanyDetailsState): FormErrors {
  const errors: FormErrors = {};
  if (!values.companyName.trim())
    errors.companyName = "Company name is required.";
  if (!values.industry.trim()) errors.industry = "Please select an industry.";
  if (!values.companySize.trim())
    errors.companySize = "Please select a company size.";
  return errors;
}

// ── Password strength ──────────────────────────────────────────────────────

type StrengthLevel = "none" | "weak" | "fair" | "strong";

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return "none";
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  return "strong";
}

function PasswordStrengthBar({ strength }: { strength: StrengthLevel }) {
  const labels: Record<StrengthLevel, string> = {
    none: "",
    weak: "Weak",
    fair: "Fair",
    strong: "Strong",
  };
  return (
    <div className="auth__strength" aria-live="polite" aria-atomic="true">
      <div className="auth__strength-bars">
        <div
          className={`auth__strength-bar auth__strength-bar--${strength !== "none" ? "active" : "empty"}`}
        />
        <div
          className={`auth__strength-bar auth__strength-bar--${strength === "fair" || strength === "strong" ? "active" : "empty"}`}
        />
        <div
          className={`auth__strength-bar auth__strength-bar--${strength === "strong" ? "active" : "empty"}`}
        />
      </div>
      <span
        className={`auth__strength-label auth__strength-label--${strength}`}
        aria-label={`Password strength: ${labels[strength]}`}
      >
        {labels[strength]}
      </span>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────

const VISIBLE_STEPS = [
  { label: "Account", group: 1 },
  { label: "Purpose", group: 2 },
  { label: "Company", group: 3 },
];

function getStepGroup(step: FlowStep): number {
  const map: Record<FlowStep, number> = {
    credentials: 1,
    intent: 2,
    "company-choice": 3,
    "company-details": 3,
    "join-company": 3,
    "email-verify": 2,
    "join-pending": 3,
  };
  return map[step] ?? 1;
}

function StepIndicator({ currentStep }: { currentStep: FlowStep }) {
  const currentGroup = getStepGroup(currentStep);
  return (
    <div className="auth__steps">
      {VISIBLE_STEPS.map((step, idx) => {
        const isDone = step.group < currentGroup;
        const isActive = step.group === currentGroup;
        return (
          <div
            key={step.label}
            className={`auth__step${isDone ? " auth__step--done" : isActive ? " auth__step--active" : ""}`}
          >
            <div className="auth__step-node">
              <div className="auth__step-circle">
                {isDone ? <CheckIcon /> : idx + 1}
              </div>
              <span className="auth__step-text">{step.label}</span>
            </div>
            {idx < VISIBLE_STEPS.length - 1 && (
              <div
                className={`auth__step-line${isDone ? " auth__step-line--done" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [signup, { isLoading: isSigningUp }] = useSignupMutation();
  const [registerCompany, { isLoading: isRegisteringCompany }] =
    useRegisterCompanyMutation();
  const [requestJoinCompany, { isLoading: isRequestingJoin }] =
    useRequestJoinCompanyMutation();
  const isLoading = isSigningUp || isRegisteringCompany || isRequestingJoin;

  const [step, setStep] = useState<FlowStep>("credentials");

  const [creds, setCreds] = useState<CredentialsState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsState>({
    companyName: "",
    industry: "",
    companySize: "",
    website: "",
    location: "",
    description: "",
  });

  const [joinCompanyName, setJoinCompanyName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const passwordStrength = getPasswordStrength(creds.password);

  function clearError(field: string) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // ── Step 1: Credentials ────────────────────────────────────────────────

  function handleCredChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setCreds((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearError(name);
  }

  function handleCredentialsContinue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateCredentials(creds);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep("intent");
  }

  // ── Step 2: Intent ─────────────────────────────────────────────────────

  async function handleIntentCandidate() {
    try {
      const result = await signup({
        full_name: creds.fullName,
        email: creds.email,
        password: creds.password,
        primary_role: "candidate",
      }).unwrap();

      if (result.success) {
        setStep("email-verify");
      } else {
        toast.error(
          result.message ?? "Something went wrong. Please try again.",
        );
      }
    } catch (err: unknown) {
      const fieldMap: Record<string, string> = {
        full_name: "fullName",
        email: "email",
        password: "password",
      };
      const parsed = parseApiError(err, fieldMap);
      const hadFieldErrors = applyFieldErrors(parsed.fieldErrors, setErrors);
      if (!hadFieldErrors) toast.error(parsed.message);
      if (Object.keys(parsed.fieldErrors ?? {}).length > 0)
        setStep("credentials");
    }
  }

  // ── Step 3a: Create company ────────────────────────────────────────────

  function handleCompanyDetailChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setCompanyDetails((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  }

  async function handleCreateCompany(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateCompanyDetails(companyDetails);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      const signupResult = await signup({
        full_name: creds.fullName,
        email: creds.email,
        password: creds.password,
        primary_role: "company",
      }).unwrap();

      if (!signupResult.success) {
        toast.error(signupResult.message ?? "Signup failed.");
        return;
      }

      await registerCompany({
        setup_token: signupResult.data?.setup_token ?? "",
        company_name: companyDetails.companyName,
        industry: companyDetails.industry,
        company_size: companyDetails.companySize,
        website: companyDetails.website || undefined,
        location: companyDetails.location || undefined,
        description: companyDetails.description || undefined,
      }).unwrap();

      toast.success(
        "Almost there! Please check your email to verify and activate your company.",
      );
      router.push("/login");
    } catch (err: unknown) {
      const fieldMap: Record<string, string> = {
        full_name: "fullName",
        email: "email",
        password: "password",
        company_name: "companyName",
        industry: "industry",
        company_size: "companySize",
      };
      const parsed = parseApiError(err, fieldMap);
      const hadFieldErrors = applyFieldErrors(parsed.fieldErrors, setErrors);
      if (!hadFieldErrors) toast.error(parsed.message);
    }
  }

  // ── Step 3b: Join company ──────────────────────────────────────────────

  async function handleJoinCompany(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!joinCompanyName.trim()) {
      setErrors({ joinCompanyName: "Please enter the company name." });
      return;
    }

    try {
      const signupResult = await signup({
        full_name: creds.fullName,
        email: creds.email,
        password: creds.password,
        primary_role: "recruiter",
      }).unwrap();

      if (!signupResult.success) {
        toast.error(signupResult.message ?? "Signup failed.");
        return;
      }

      await requestJoinCompany({
        setup_token: signupResult.data?.setup_token ?? "",
        company_name: joinCompanyName.trim(),
      }).unwrap();
      setStep("join-pending");
    } catch (err: unknown) {
      const fieldMap: Record<string, string> = {
        full_name: "fullName",
        email: "email",
        password: "password",
        company_name: "joinCompanyName",
      };
      const parsed = parseApiError(err, fieldMap);
      const hadFieldErrors = applyFieldErrors(parsed.fieldErrors, setErrors);
      if (!hadFieldErrors) toast.error(parsed.message);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const stepMeta: Partial<
    Record<FlowStep, { title: string; subtitle: string }>
  > = {
    credentials: {
      title: "Create your account",
      subtitle:
        "Start exploring top career opportunities across Nepal and beyond.",
    },
    intent: {
      title: "What brings you here?",
      subtitle:
        "Tell us how you plan to use ConvexHire so we can personalise your experience.",
    },
    "company-choice": {
      title: "Set up your company",
      subtitle:
        "Create a new company profile or join one that already exists on ConvexHire.",
    },
    "company-details": {
      title: "Create your company",
      subtitle: "Fill in the details to set up your company profile.",
    },
    "join-company": {
      title: "Join an existing company",
      subtitle:
        "Enter the company name. An email will be sent to the admin for approval.",
    },
    "email-verify": {
      title: "Check your inbox",
      subtitle:
        "We've sent a verification email. Click the link to activate your account.",
    },
    "join-pending": {
      title: "Request sent!",
      subtitle:
        "The company admin has been notified. You'll get an email once approved.",
    },
  };

  const meta = stepMeta[step] ?? stepMeta.credentials!;
  const isWide = step === "company-details";

  return (
    <main className="auth">
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

      <div className={`auth__inner${isWide ? " auth__inner--wide" : ""}`}>
        {/* Step indicator */}
        {step !== "credentials" &&
          step !== "email-verify" &&
          step !== "join-pending" && <StepIndicator currentStep={step} />}

        {/* Back button */}
        {(step === "intent" ||
          step === "company-choice" ||
          step === "company-details" ||
          step === "join-company") && (
          <button
            type="button"
            className="auth__back-btn"
            onClick={() => {
              if (step === "intent") setStep("credentials");
              else if (step === "company-choice") setStep("intent");
              else setStep("company-choice");
            }}
          >
            <ArrowLeftIcon />
            Back
          </button>
        )}

        {/* Header */}
        <header className="auth__header">
          <h1 className="auth__title">{meta.title}</h1>
          <p className="auth__subtitle">{meta.subtitle}</p>
        </header>

        {/* ── STEP 1: Credentials ───────────────────────────────────────── */}
        {step === "credentials" && (
          <div className="auth__card">
            <div className="auth__social-btns">
              <button
                type="button"
                className="auth__social-btn"
                onClick={() => initiateGoogleOAuth()}
              >
                <GoogleIcon />
                Sign up with Google
              </button>
            </div>
            <div className="auth__divider">
              <span>or sign up with email</span>
            </div>

            <form
              className="auth__form"
              onSubmit={handleCredentialsContinue}
              noValidate
            >
              <div className="auth__field">
                <label htmlFor="fullName" className="auth__label">
                  Full name
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={creds.fullName}
                    onChange={handleCredChange}
                    className={`auth__input${errors.fullName ? " auth__input--error" : ""}`}
                    aria-describedby={
                      errors.fullName ? "fullName-error" : undefined
                    }
                  />
                </div>
                {errors.fullName && (
                  <span
                    id="fullName-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {errors.fullName}
                  </span>
                )}
              </div>

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
                    value={creds.email}
                    onChange={handleCredChange}
                    className={`auth__input${errors.email ? " auth__input--error" : ""}`}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && (
                  <span
                    id="email-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="auth__field">
                <label htmlFor="password" className="auth__label">
                  Password
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={creds.password}
                    onChange={handleCredChange}
                    className={`auth__input auth__input--password${errors.password ? " auth__input--error" : ""}`}
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
                {passwordStrength !== "none" && (
                  <PasswordStrengthBar strength={passwordStrength} />
                )}
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

              <div className="auth__field">
                <label htmlFor="confirmPassword" className="auth__label">
                  Confirm password
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={creds.confirmPassword}
                    onChange={handleCredChange}
                    className={`auth__input auth__input--password${errors.confirmPassword ? " auth__input--error" : ""}`}
                  />
                  <button
                    type="button"
                    className="auth__pw-toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span
                    id="confirmPassword-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="auth__field">
                <label className="auth__terms">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={creds.acceptTerms}
                    onChange={handleCredChange}
                    aria-describedby={
                      errors.acceptTerms ? "terms-error" : undefined
                    }
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms">Terms &amp; Conditions</Link> and{" "}
                    <Link href="/privacy">Privacy Policy</Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <span
                    id="terms-error"
                    className="auth__error-msg"
                    role="alert"
                  >
                    {errors.acceptTerms}
                  </span>
                )}
              </div>

              <button type="submit" className="auth__submit">
                Continue
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 2: Intent ────────────────────────────────────────────── */}
        {step === "intent" && (
          <div className="auth__card">
            <div className="auth__intent-cards">
              <button
                type="button"
                className="auth__intent-card"
                onClick={handleIntentCandidate}
                disabled={isLoading}
              >
                <div className="auth__intent-icon auth__intent-icon--candidate">
                  <SearchJobIcon />
                </div>
                <div className="auth__intent-body">
                  <span className="auth__intent-title">Looking for a job</span>
                  <span className="auth__intent-desc">
                    Browse thousands of job listings and apply with ease.
                  </span>
                </div>
                <span className="auth__intent-arrow" aria-hidden="true">
                  ›
                </span>
              </button>

              <button
                type="button"
                className="auth__intent-card"
                onClick={() => setStep("company-choice")}
                disabled={isLoading}
              >
                <div className="auth__intent-icon auth__intent-icon--hiring">
                  <BriefcaseIcon />
                </div>
                <div className="auth__intent-body">
                  <span className="auth__intent-title">Hiring talent</span>
                  <span className="auth__intent-desc">
                    Post jobs, manage candidates, and grow your team.
                  </span>
                </div>
                <span className="auth__intent-arrow" aria-hidden="true">
                  ›
                </span>
              </button>
            </div>
            {isLoading && (
              <p className="auth__loading-note">Setting up your account…</p>
            )}
          </div>
        )}

        {/* ── STEP 3: Company choice ─────────────────────────────────────── */}
        {step === "company-choice" && (
          <div className="auth__card">
            <div className="auth__intent-cards">
              <button
                type="button"
                className="auth__intent-card"
                onClick={() => setStep("company-details")}
              >
                <div className="auth__intent-icon auth__intent-icon--create">
                  <BuildingIcon />
                </div>
                <div className="auth__intent-body">
                  <span className="auth__intent-title">
                    Create a new company
                  </span>
                  <span className="auth__intent-desc">
                    Set up your company profile and start posting jobs
                    immediately.
                  </span>
                </div>
                <span className="auth__intent-arrow" aria-hidden="true">
                  ›
                </span>
              </button>

              <button
                type="button"
                className="auth__intent-card"
                onClick={() => setStep("join-company")}
              >
                <div className="auth__intent-icon auth__intent-icon--join">
                  <UserPlusIcon />
                </div>
                <div className="auth__intent-body">
                  <span className="auth__intent-title">
                    Join an existing company
                  </span>
                  <span className="auth__intent-desc">
                    Request to join your company's workspace on ConvexHire.
                  </span>
                </div>
                <span className="auth__intent-arrow" aria-hidden="true">
                  ›
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3a: Company details ───────────────────────────────────── */}
        {step === "company-details" && (
          <div className="auth__card">
            <form
              className="auth__form"
              onSubmit={handleCreateCompany}
              noValidate
            >
              <div className="auth__field">
                <label htmlFor="companyName" className="auth__label">
                  Company name <span className="auth__required">*</span>
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="companyName"
                    type="text"
                    name="companyName"
                    placeholder="Acme Corporation"
                    value={companyDetails.companyName}
                    onChange={handleCompanyDetailChange}
                    disabled={isLoading}
                    className={`auth__input${errors.companyName ? " auth__input--error" : ""}`}
                  />
                </div>
                {errors.companyName && (
                  <span className="auth__error-msg" role="alert">
                    {errors.companyName}
                  </span>
                )}
              </div>

              <div className="auth__field-grid">
                <div className="auth__field">
                  <label htmlFor="industry" className="auth__label">
                    Industry <span className="auth__required">*</span>
                  </label>
                  <div className="auth__input-wrap">
                    <select
                      id="industry"
                      name="industry"
                      value={companyDetails.industry}
                      onChange={handleCompanyDetailChange}
                      disabled={isLoading}
                      className={`auth__input auth__input--select${errors.industry ? " auth__input--error" : ""}`}
                    >
                      <option value="">Select industry…</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance &amp; Banking</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="retail">Retail &amp; E-commerce</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="consulting">Consulting</option>
                      <option value="media">Media &amp; Entertainment</option>
                      <option value="logistics">
                        Logistics &amp; Supply Chain
                      </option>
                      <option value="real_estate">Real Estate</option>
                      <option value="ngo">NGO / Non-profit</option>
                      <option value="government">Government</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {errors.industry && (
                    <span className="auth__error-msg" role="alert">
                      {errors.industry}
                    </span>
                  )}
                </div>

                <div className="auth__field">
                  <label htmlFor="companySize" className="auth__label">
                    Company size <span className="auth__required">*</span>
                  </label>
                  <div className="auth__input-wrap">
                    <select
                      id="companySize"
                      name="companySize"
                      value={companyDetails.companySize}
                      onChange={handleCompanyDetailChange}
                      disabled={isLoading}
                      className={`auth__input auth__input--select${errors.companySize ? " auth__input--error" : ""}`}
                    >
                      <option value="">Select size…</option>
                      <option value="1-10">1 – 10 employees</option>
                      <option value="11-50">11 – 50 employees</option>
                      <option value="51-200">51 – 200 employees</option>
                      <option value="201-500">201 – 500 employees</option>
                      <option value="501-1000">501 – 1 000 employees</option>
                      <option value="1001+">1 001+ employees</option>
                    </select>
                  </div>
                  {errors.companySize && (
                    <span className="auth__error-msg" role="alert">
                      {errors.companySize}
                    </span>
                  )}
                </div>
              </div>

              <div className="auth__field-grid">
                <div className="auth__field">
                  <label htmlFor="website" className="auth__label">
                    Website <span className="auth__optional">(optional)</span>
                  </label>
                  <div className="auth__input-wrap">
                    <input
                      id="website"
                      type="url"
                      name="website"
                      placeholder="https://yourcompany.com"
                      value={companyDetails.website}
                      onChange={handleCompanyDetailChange}
                      disabled={isLoading}
                      className="auth__input"
                    />
                  </div>
                </div>

                <div className="auth__field">
                  <label htmlFor="location" className="auth__label">
                    Location <span className="auth__optional">(optional)</span>
                  </label>
                  <div className="auth__input-wrap">
                    <input
                      id="location"
                      type="text"
                      name="location"
                      placeholder="Kathmandu, Nepal"
                      value={companyDetails.location}
                      onChange={handleCompanyDetailChange}
                      disabled={isLoading}
                      className="auth__input"
                    />
                  </div>
                </div>
              </div>

              <div className="auth__field">
                <label htmlFor="description" className="auth__label">
                  Short description{" "}
                  <span className="auth__optional">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Tell candidates what your company does…"
                  value={companyDetails.description}
                  onChange={handleCompanyDetailChange}
                  disabled={isLoading}
                  className="auth__textarea"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`auth__submit${isLoading ? " auth__submit--loading" : ""}`}
                aria-busy={isLoading}
              >
                {isLoading ? "Creating company…" : "Create company & continue"}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 3b: Join company ──────────────────────────────────────── */}
        {step === "join-company" && (
          <div className="auth__card">
            <form
              className="auth__form"
              onSubmit={handleJoinCompany}
              noValidate
            >
              <div className="auth__field">
                <label htmlFor="joinCompanyName" className="auth__label">
                  Company name
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="joinCompanyName"
                    type="text"
                    name="joinCompanyName"
                    placeholder="Enter the exact company name"
                    value={joinCompanyName}
                    onChange={(e) => {
                      setJoinCompanyName(e.target.value);
                      clearError("joinCompanyName");
                    }}
                    disabled={isLoading}
                    className={`auth__input${errors.joinCompanyName ? " auth__input--error" : ""}`}
                  />
                </div>
                {errors.joinCompanyName && (
                  <span className="auth__error-msg" role="alert">
                    {errors.joinCompanyName}
                  </span>
                )}
                <p className="auth__field-hint">
                  Enter the company name exactly as it appears on ConvexHire. An
                  email will be sent to the company admin to verify your
                  request.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`auth__submit${isLoading ? " auth__submit--loading" : ""}`}
                aria-busy={isLoading}
              >
                {isLoading ? "Sending request…" : "Send join request"}
              </button>
            </form>
          </div>
        )}

        {/* ── SUCCESS: Email verify ──────────────────────────────────────── */}
        {step === "email-verify" && (
          <div className="auth__card auth__card--success">
            <div className="auth__success-icon">
              <EnvelopeIcon />
            </div>
            <p className="auth__success-detail">
              We sent an email to <strong>{creds.email}</strong>. Click the link
              to verify your address and access your dashboard.
            </p>
            <p className="auth__success-note">
              Didn&apos;t get it? Check your spam folder, or{" "}
              <button
                type="button"
                className="auth__inline-link"
                onClick={() => handleIntentCandidate()}
              >
                resend the email
              </button>
              .
            </p>
            <Link href="/login" className="auth__submit auth__submit--link">
              Go to sign in
            </Link>
          </div>
        )}

        {/* ── SUCCESS: Join pending ──────────────────────────────────────── */}
        {step === "join-pending" && (
          <div className="auth__card auth__card--success">
            <div className="auth__success-icon auth__success-icon--pending">
              <ClockIcon />
            </div>
            <p className="auth__success-detail">
              Your request to join <strong>{joinCompanyName}</strong> has been
              sent. We&apos;ll email you at <strong>{creds.email}</strong> once
              the admin approves it.
            </p>
            <p className="auth__success-note">
              While you wait, check your inbox to verify your email address.
            </p>
            <Link href="/login" className="auth__submit auth__submit--link">
              Go to sign in
            </Link>
          </div>
        )}

        {/* Switch to login */}
        {(step === "credentials" || step === "intent") && (
          <p className="auth__switch">
            Already have an account?
            <Link href="/login">Sign in</Link>
          </p>
        )}
      </div>
    </main>
  );
}
