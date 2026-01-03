import axios from 'axios';
import { API_CONFIG } from '../config/constants';
import {
  ResumeCreate,
  ResumeResponse,
  ResumeListResponse,
  ResumeUpdate,
  WorkExperienceBase
} from '@/types/resume';

const API_URL = `${API_CONFIG.baseUrl}/api/v1`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resumeService = {

  async getAllResumes(): Promise<ResumeListResponse[]> {
    const response = await api.get('/resumes/');
    return response.data;
  },

  async createResumeFork(data: ResumeCreate): Promise<ResumeResponse> {
    const response = await api.post('/resumes/', data);
    return response.data;
  },

  async getResumeById(id: string): Promise<ResumeResponse> {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },

  async updateResume(id: string, data: ResumeUpdate): Promise<ResumeResponse> {
    const response = await api.patch(`/resumes/${id}`, data);
    return response.data;
  },

  async deleteResume(id: string): Promise<void> {
    await api.delete(`/resumes/${id}`);
  },

  // --- Sub-Resources (Example: Experience) ---

  async addExperience(resumeId: string, data: WorkExperienceBase): Promise<unknown> {
    const response = await api.post(`/resumes/${resumeId}/experience`, data);
    return response.data;
  },

  async deleteExperience(resumeId: string, itemId: string): Promise<void> {
    await api.delete(`/resumes/${resumeId}/experience/${itemId}`);
  }
};
