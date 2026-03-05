"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  setResumes,
  upsertResume,
  removeResume,
  apiResumeToUi,
} from "@/store/slices/resumeSlice";
import {
  useCreateResumeMutation,
  useGetMyResumesQuery,
  useDeleteResumeMutation,
} from "@/store/services/resumeApi";
import Loader from "@/components/common/Loader";
import ResumeCard from "./_components/ResumeCard";
import CreateResumeModal from "./_components/CreateResumeModal";

// ── Resume list page ───────────────────────────────────────────────────────
// Clicking View or Edit routes to /dashboard/resume/[id] (view or edit mode).

export default function ResumePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const resumes = useSelector((state: RootState) => state.resumes.resumes);
  const user = useSelector((state: RootState) => state.auth.user);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── RTK Query hooks ────────────────────────────────────────────────────────
  const { data: resumesResponse, isLoading: isLoadingResumes } =
    useGetMyResumesQuery();
  const [createResume, { isLoading: isCreating }] = useCreateResumeMutation();
  const [deleteResumeMutation] = useDeleteResumeMutation();

  // Sync API response → Redux
  useEffect(() => {
    if (resumesResponse?.data) {
      const uiResumes = resumesResponse.data.map((r) =>
        apiResumeToUi(r, user?.full_name ?? "", user?.email ?? ""),
      );
      dispatch(setResumes(uiResumes));
    }
  }, [resumesResponse, dispatch, user]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleCreateConfirm(name: string) {
    setCreateError(null);
    try {
      const result = await createResume({ resume_name: name }).unwrap();
      if (result.success && result.data) {
        const uiResume = apiResumeToUi(
          result.data,
          user?.full_name ?? "",
          user?.email ?? "",
        );
        dispatch(upsertResume(uiResume));
        setShowCreateModal(false);
        // Open in edit mode immediately
        router.push(`/dashboard/resume/${uiResume.id}?mode=edit`);
      } else {
        setCreateError(result.message ?? "Failed to create resume.");
      }
    } catch {
      setCreateError("An error occurred. Please try again.");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteResumeMutation(id).unwrap();
      dispatch(removeResume(id));
    } catch {
      // silently fail — could add toast here
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="dash-content container">
      {/* Create Modal */}
      {showCreateModal && (
        <CreateResumeModal
          onConfirm={handleCreateConfirm}
          onCancel={() => {
            setShowCreateModal(false);
            setCreateError(null);
          }}
          isLoading={isCreating}
          error={createError}
        />
      )}

      {/* Page Header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Resumes</h2>
          <p className="dash-page-header__subtitle">
            Build tailored resumes for different job applications.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <button
            className="btn btn--primary"
            onClick={() => setShowCreateModal(true)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Resume
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoadingResumes && (
        <div className="resume-empty-state">
          <Loader size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoadingResumes && resumes.length === 0 && (
        <div className="resume-empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>No resumes yet. Create your first one.</p>
          <button
            className="btn btn--primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Resume
          </button>
        </div>
      )}

      {/* Resumes grid */}
      {!isLoadingResumes && resumes.length > 0 && (
        <div className="resume-grid">
          {resumes.map((r) => (
            <ResumeCard
              key={r.id}
              resume={r}
              onView={() => router.push(`/dashboard/resume/${r.id}`)}
              onEdit={() => router.push(`/dashboard/resume/${r.id}?mode=edit`)}
              onDelete={() => handleDelete(r.id)}
              isDeleting={deletingId === r.id}
              isViewing={false}
            />
          ))}
          <button
            className="resume-add-card"
            onClick={() => setShowCreateModal(true)}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create New Resume</span>
          </button>
        </div>
      )}
    </div>
  );
}
