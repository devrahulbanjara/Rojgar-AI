"use client";

/**
 * Google OAuth Callback — lives at /auth/oauth-callback
 *
 * Flow recap:
 *  1. User clicks "Continue with Google"
 *  2. Browser is sent to /api/auth/google (Next.js proxies → backend)
 *  3. Backend → Google consent → Google → backend /auth/google/callback
 *  4. Backend processes the code, then redirects browser here:
 *       /auth/oauth-callback?access_token=<JWT>
 *       (refresh_token set as HttpOnly cookie)
 *  5. This page stores credentials in Redux + localStorage, then
 *     redirects to the user's role-specific dashboard.
 *  6. On any failure it sends the user back to /login?error=oauth_failed.
 */

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { getRoleDashboard } from "@/lib/roleRoutes";
import { toast } from "react-toastify";
import type { AuthUser } from "@/store/slices/authSlice";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const handled = useRef(false); // prevent double-fire in React Strict Mode

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function handleCallback() {
      const accessToken = searchParams.get("access_token");
      const errorParam = searchParams.get("error");

      if (errorParam || !accessToken) {
        toast.error("Google sign-in failed. Please try again.");
        router.replace(`/login?error=${errorParam ?? "oauth_failed"}`);
        return;
      }

      try {
        // Persist the token so RTK Query's prepareHeaders will include it
        localStorage.setItem("access_token", accessToken);

        // Try to read a user object forwarded as a query param (some backends
        // do this). If absent, fall back to fetching /auth/me via the API.
        const userParam = searchParams.get("user");
        let user: AuthUser | null = null;
        if (userParam) {
          try {
            user = JSON.parse(decodeURIComponent(userParam)) as AuthUser;
          } catch {
            /* ignore malformed param, will fetch below */
          }
        }

        if (!user) {
          // Fetch /auth/me — token is now in localStorage so the request
          // will include the Authorization header via baseApi's prepareHeaders.
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const json = await res.json();
          if (json?.success && json?.data) {
            user = json.data as AuthUser;
          }
        }

        if (!user) {
          toast.error("Could not load your profile. Please try again.");
          router.replace("/login?error=oauth_failed");
          return;
        }

        // Commit to Redux + localStorage
        dispatch(setCredentials({ accessToken, user }));
        localStorage.setItem("auth_user", JSON.stringify(user));

        toast.success(`Welcome, ${user.full_name}!`);
        router.replace(getRoleDashboard(user.primary_role));
      } catch {
        toast.error("Something went wrong during sign-in. Please try again.");
        router.replace("/login?error=oauth_failed");
      }
    }

    handleCallback();
  }, [searchParams, dispatch, router]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        fontFamily: "inherit",
      }}
      aria-live="polite"
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #e5e7eb",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
        aria-hidden="true"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
        Completing sign-in…
      </p>
    </main>
  );
}
