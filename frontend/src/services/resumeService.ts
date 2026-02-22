import axios from 'axios'
import { API_CONFIG } from '../config/constants'
import { ResumeCreate, ResumeResponse, ResumeListResponse, ResumeUpdate } from '@/types/resume'

const API_URL = `${API_CONFIG.baseUrl}/api/v1`

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const resumeService = {
  async getAllResumes(): Promise<ResumeListResponse[]> {
    const response = await api.get('/candidate/resumes/')
    return response.data
  },

  async createResumeFork(data: ResumeCreate): Promise<ResumeResponse> {
    const response = await api.post('/candidate/resumes/', data)
    return response.data
  },

  async getResumeById(id: string): Promise<ResumeResponse> {
    const response = await api.get(`/candidate/resumes/${id}`)
    return response.data
  },

  /**
   * State-sync update: replaces nested collections in one PATCH call.
   * Items with IDs → update. Items without IDs → create. Missing items → delete.
   */
  async syncResume(id: string, data: ResumeUpdate): Promise<ResumeResponse> {
    const response = await api.patch(`/candidate/resumes/${id}`, data)
    return response.data
  },

  async deleteResume(id: string): Promise<void> {
    await api.delete(`/candidate/resumes/${id}`)
  },

  /**
   * Upload a PDF resume and get AI-parsed structured data back.
   * The returned data can be used to create a new resume via createResumeFork.
   */
  async uploadPdf(file: File): Promise<ResumeCreate> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/candidate/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
