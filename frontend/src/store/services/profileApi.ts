import { baseApi } from "./baseApi";
import type { ApiResponse } from "./baseApi";

// ---------------------------------------------------------------------------
// Types — mirrors the /profiles/* API contract exactly
// ---------------------------------------------------------------------------

/** One work experience item as returned by and sent to the API. */
export interface ProfileExperience {
  id?: string;
  company_name: string;
  title: string;
  start_date: string | null; // "YYYY-MM-DD"
  end_date: string | null; // null means "currently working here"
  description: string[];
}

/** One education item as returned by and sent to the API. */
export interface ProfileEducation {
  id?: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
}

/** One skill item as returned by and sent to the API. */
export interface ProfileSkill {
  id?: string;
  skill_name: string;
}

/** Full profile data shape returned by `GET /profiles/me` and `GET /profiles/{user_id}`. */
export interface CandidateProfileData {
  id: string;
  user_id: string;
  headline: string | null;
  summary: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  years_of_experience: number | null;
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  skills: ProfileSkill[];
  created_at: string;
  updated_at: string;
}

/** Request body for `PUT /profiles/me`. All fields are optional. */
export interface UpdateProfileRequest {
  headline?: string | null;
  summary?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  years_of_experience?: number | null;
  experiences?: Array<{
    company_name: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    description: string[];
  }>;
  educations?: Array<{
    institution: string;
    degree: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
  }>;
  skills?: Array<{ skill_name: string }>;
}

type ProfileApiResponse = ApiResponse<CandidateProfileData>;

// ---------------------------------------------------------------------------
// Profile API — injected into the shared baseApi
// ---------------------------------------------------------------------------

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /profiles/me — authenticated candidate's own profile */
    getMyProfile: builder.query<ProfileApiResponse, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me`,
      providesTags: ["Profile"],
    }),

    /** PUT /profiles/me — replace-update the authenticated candidate's profile */
    updateMyProfile: builder.mutation<ProfileApiResponse, UpdateProfileRequest>(
      {
        query: (body) => ({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me`,
          method: "PUT",
          body,
        }),
        invalidatesTags: ["Profile"],
      },
    ),

    /** GET /profiles/{user_id} — public profile by user ID */
    getPublicProfile: builder.query<ProfileApiResponse, string>({
      query: (userId) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/${userId}`,
      providesTags: (_result, _error, id) => [{ type: "Profile", id }],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetPublicProfileQuery,
} = profileApi;
