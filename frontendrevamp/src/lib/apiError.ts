/**
 * Global API error handling utility.
 *
 * Backend sends two error shapes:
 *
 *  1. Validation (HTTP 400):
 *     { success: false, errors: [{ field: "email", message: "..." }], ... }
 *
 *  2. HTTP / generic (HTTP 401, 403, 409, 500 …):
 *     { success: false, errors: null, message: "Invalid credentials", ... }
 *
 * RTK Query surfaces these as a thrown error with shape:
 *   { status: number, data: ApiResponse<null> }
 */

import type { ApiFieldError, ApiResponse } from "@/store/services/baseApi";

// ---------------------------------------------------------------------------
// Raw RTK error wrapper (what `.unwrap()` / catch receives)
// ---------------------------------------------------------------------------

interface RtkErrorShape {
  status?: number | string;
  data?: ApiResponse<null>;
  error?: string;
}

// ---------------------------------------------------------------------------
// Parsed result
// ---------------------------------------------------------------------------

export interface ParsedApiError {
  /** Human-readable summary message to show in a form banner */
  message: string;
  /**
   * Field-level errors keyed by the FORM field name.
   * Only populated when the server returned a validation error array.
   * e.g. { email: "value is not a valid email address" }
   */
  fieldErrors: Record<string, string>;
  /** HTTP status code if available */
  status: number | string | undefined;
}

// ---------------------------------------------------------------------------
// Core parser
// ---------------------------------------------------------------------------

/**
 * Parse a raw RTK Query error (caught from `.unwrap()`) into a clean shape.
 *
 * @param err         The raw error thrown by `.unwrap()`
 * @param fieldMap    Maps backend field names → form field names.
 *                    e.g. { full_name: "fullName", primary_role: "primaryRole" }
 * @param fallback    Fallback banner message when none is available from server
 */
export function parseApiError(
  err: unknown,
  fieldMap: Record<string, string> = {},
  fallback = "Something went wrong. Please try again.",
): ParsedApiError {
  const rtkErr = err as RtkErrorShape;
  const envelope = rtkErr?.data;
  const status = rtkErr?.status;

  // --- Field-level validation errors (array format) -----------------------
  if (Array.isArray(envelope?.errors) && envelope.errors.length > 0) {
    const fieldErrors: Record<string, string> = {};
    const unmappedMessages: string[] = [];

    (envelope.errors as ApiFieldError[]).forEach(({ field, message }) => {
      const formField = fieldMap[field] ?? field;
      if (formField) {
        // Only keep the first message per field
        if (!fieldErrors[formField]) fieldErrors[formField] = message;
      } else {
        unmappedMessages.push(message);
      }
    });

    return {
      message:
        envelope?.message ??
        unmappedMessages[0] ??
        "Please fix the errors below.",
      fieldErrors,
      status,
    };
  }

  // --- Generic HTTP or server error (errors: null) ------------------------
  return {
    message: envelope?.message ?? fallback,
    fieldErrors: {},
    status,
  };
}

// ---------------------------------------------------------------------------
// Convenience: apply parsed field errors onto a React setter
// ---------------------------------------------------------------------------

/**
 * Merges parsed `fieldErrors` into an existing form-errors state object.
 * Only sets fields that exist in the current errors record type.
 *
 * @example
 *   const parsed = parseApiError(err, fieldMap);
 *   applyFieldErrors(parsed.fieldErrors, setErrors);
 *   if (!parsed.fieldErrors length) setFormAlert({ type: "error", message: parsed.message });
 */
export function applyFieldErrors<T extends Record<string, string | undefined>>(
  fieldErrors: Record<string, string>,
  setErrors: React.Dispatch<React.SetStateAction<T>>,
): boolean {
  if (Object.keys(fieldErrors).length === 0) return false;
  setErrors((prev) => ({ ...prev, ...fieldErrors }));
  return true;
}

// ---------------------------------------------------------------------------
// Convenience: check if an error indicates an expired / invalid session
// ---------------------------------------------------------------------------

export function isAuthError(err: unknown): boolean {
  const status = (err as RtkErrorShape)?.status;
  return status === 401 || status === 403;
}
