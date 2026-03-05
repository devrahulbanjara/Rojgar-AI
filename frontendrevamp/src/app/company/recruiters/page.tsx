"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store/hooks";
import {
  useGetCompanyRecruitersQuery,
  useUpdateRecruiterStatusMutation,
  useRemoveRecruiterMutation,
} from "@/store/services/companyApi";
import type { RecruiterMember } from "@/store/services/companyApi";


function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function StatusBadge({ status }: { status: RecruiterMember["status"] }) {
  const map = {
    active: { label: "Active", color: "#0cce6b" },
    pending: { label: "Pending", color: "#f59e0b" },
    rejected: { label: "Rejected", color: "#ef4444" },
  };
  const { label, color } = map[status];
  return (
    <span
      className="skill-pill"
      style={
        {
          "--pill-bg": color + "1A",
          "--pill-color": color,
          background: color + "1A",
          color,
          border: `1px solid ${color}33`,
        } as React.CSSProperties
      }
    >
      {label}
    </span>
  );
}


export default function RecruitersPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (user && user.primary_role !== "recruiter_admin") {
      toast.error("Only company admins can manage recruiters.");
      router.replace("/company");
    }
  }, [user, router]);

  const {
    data: response,
    isLoading,
    isError,
  } = useGetCompanyRecruitersQuery(undefined, {
    skip: user?.primary_role !== "recruiter_admin",
  });

  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateRecruiterStatusMutation();
  const [removeRecruiter, { isLoading: isRemoving }] =
    useRemoveRecruiterMutation();

  if (!user || user.primary_role !== "recruiter_admin") return null;

  const recruiters: RecruiterMember[] = response?.data ?? [];

  const pending = recruiters.filter((r) => r.status === "pending");
  const active = recruiters.filter((r) => r.status === "active");
  const rejected = recruiters.filter((r) => r.status === "rejected");

  async function handleApprove(membershipId: string) {
    try {
      await updateStatus({ membershipId, status: "active" }).unwrap();
      toast.success("Recruiter approved.");
    } catch {
      toast.error("Failed to approve recruiter.");
    }
  }

  async function handleReject(membershipId: string) {
    try {
      await updateStatus({ membershipId, status: "rejected" }).unwrap();
      toast.success("Recruiter request rejected.");
    } catch {
      toast.error("Failed to reject recruiter.");
    }
  }

  async function handleRemove(membershipId: string) {
    try {
      await removeRecruiter(membershipId).unwrap();
      toast.success("Recruiter removed.");
    } catch {
      toast.error("Failed to remove recruiter.");
    }
  }

  return (
    <div className="dash-content container">
      {/* Header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Recruiters</h2>
          <p className="dash-page-header__subtitle">
            Manage who can post jobs and screen candidates on behalf of your
            company.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="dash-card">
          <div className="dash-card__body">Loading recruiters…</div>
        </div>
      )}

      {isError && (
        <div className="dash-card">
          <div className="dash-card__body">
            Failed to load recruiters. Please refresh.
          </div>
        </div>
      )}

      {/* Pending requests */}
      {!isLoading && pending.length > 0 && (
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Pending Requests</div>
              <div className="dash-card__subtitle">
                Recruiters awaiting your approval
              </div>
            </div>
            <span
              className="skill-pill"
              style={{ background: "#f59e0b1A", color: "#f59e0b" }}
            >
              {pending.length}
            </span>
          </div>
          <div className="dash-card__body dash-card__body--no-top">
            {pending.map((r) => (
              <RecruiterRow key={r.membership_id} recruiter={r}>
                <button
                  className="btn btn--success btn--sm"
                  disabled={isUpdating || isRemoving}
                  onClick={() => handleApprove(r.membership_id)}
                >
                  Approve
                </button>
                <button
                  className="btn btn--danger btn--sm"
                  disabled={isUpdating || isRemoving}
                  onClick={() => handleReject(r.membership_id)}
                >
                  Reject
                </button>
              </RecruiterRow>
            ))}
          </div>
        </div>
      )}

      {/* Active recruiters */}
      <div className="dash-card">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Active Recruiters</div>
            <div className="dash-card__subtitle">
              Recruiters currently working with your company
            </div>
          </div>
          <span
            className="skill-pill"
            style={{ background: "#0cce6b1A", color: "#0cce6b" }}
          >
            {active.length}
          </span>
        </div>
        <div className="dash-card__body dash-card__body--no-top">
          {active.length === 0 ? (
            <p style={{ color: "var(--color-muted)", padding: "1rem 0" }}>
              No active recruiters yet.
            </p>
          ) : (
            active.map((r) => (
              <RecruiterRow key={r.membership_id} recruiter={r}>
                <button
                  className="btn btn--danger btn--sm"
                  disabled={isUpdating || isRemoving}
                  onClick={() => handleRemove(r.membership_id)}
                >
                  Remove
                </button>
              </RecruiterRow>
            ))
          )}
        </div>
      </div>

      {/* Rejected */}
      {!isLoading && rejected.length > 0 && (
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Rejected Requests</div>
              <div className="dash-card__subtitle">
                Previously declined recruiter requests
              </div>
            </div>
            <span
              className="skill-pill"
              style={{ background: "#ef44441A", color: "#ef4444" }}
            >
              {rejected.length}
            </span>
          </div>
          <div className="dash-card__body dash-card__body--no-top">
            {rejected.map((r) => (
              <RecruiterRow key={r.membership_id} recruiter={r}>
                <button
                  className="btn btn--outline btn--sm"
                  disabled={isUpdating || isRemoving}
                  onClick={() => handleApprove(r.membership_id)}
                >
                  Re-approve
                </button>
              </RecruiterRow>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row sub-component
// ---------------------------------------------------------------------------

function RecruiterRow({
  recruiter,
  children,
}: {
  recruiter: RecruiterMember;
  children: React.ReactNode;
}) {
  const initials = getInitials(recruiter.full_name);
  const joinedDate = new Date(recruiter.joined_at).toLocaleDateString(
    undefined,
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <div className="item-row item-row--pad">
      {recruiter.avatar_url ? (
        <Image
          src={recruiter.avatar_url}
          alt={recruiter.full_name}
          width={40}
          height={40}
          className="item-row__logo item-row__logo--circle"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <div
          className="item-row__logo item-row__logo--circle"
          style={
            {
              "--logo-bg": "#7928ca1A",
              "--logo-color": "#7928ca",
            } as React.CSSProperties
          }
        >
          {initials}
        </div>
      )}

      <div className="item-row__info">
        <div className="item-row__title">{recruiter.full_name}</div>
        <div className="item-row__sub">{recruiter.email}</div>
        <div className="cell-actions cell-actions--mt">
          <StatusBadge status={recruiter.status} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
            Joined {joinedDate}
          </span>
        </div>
      </div>

      <div className="cell-actions" style={{ gap: "0.5rem" }}>
        {children}
      </div>
    </div>
  );
}
