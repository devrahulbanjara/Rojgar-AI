import { api } from '../lib/api'
import type { CandidateProfile, CandidateProfileUpdate } from '../types/profile'

export const profileService = {
  async getProfile(): Promise<CandidateProfile> {
    const data = await api.candidate.getProfile()
    return data as CandidateProfile
  },

  async syncProfile(data: CandidateProfileUpdate): Promise<CandidateProfile> {
    const response = await api.candidate.syncProfile(data)
    return response as CandidateProfile
  },
}
