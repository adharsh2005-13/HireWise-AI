import { 
  User, Resume, Job, MatchResult, JobApplication, 
  InterviewSession, InterviewQuestion, SkillGapData, PlatformStats 
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('hirewise_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('hirewise_token');
      localStorage.removeItem('hirewise_user');
      window.dispatchEvent(new Event('auth_logout'));
    }

    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- Auth ---
  async login(email: string, password: string):Promise<{ access_token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { email: string; password: string; full_name: string; role: string; company_name?: string; headline?: string }): Promise<{ access_token: string; user: User }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me');
  }

  async updateCandidateProfile(data: any): Promise<{ message: string }> {
    return this.request('/auth/profile/candidate', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateRecruiterProfile(data: any): Promise<{ message: string }> {
    return this.request('/auth/profile/recruiter', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- Resumes ---
  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/resumes/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async listResumes(): Promise<Resume[]> {
    return this.request('/resumes');
  }

  async getResume(id: number): Promise<Resume> {
    return this.request(`/resumes/${id}`);
  }

  async deleteResume(id: number): Promise<{ message: string }> {
    return this.request(`/resumes/${id}`, { method: 'DELETE' });
  }

  // --- Jobs ---
  async listJobs(params?: { q?: string; location?: string; experience_level?: string; job_type?: string }): Promise<Job[]> {
    const sp = new URLSearchParams();
    if (params?.q) sp.append('q', params.q);
    if (params?.location) sp.append('location', params.location);
    if (params?.experience_level) sp.append('experience_level', params.experience_level);
    if (params?.job_type) sp.append('job_type', params.job_type);
    const query = sp.toString() ? `?${sp.toString()}` : '';
    return this.request(`/jobs${query}`);
  }

  async getMyJobPostings(): Promise<Job[]> {
    return this.request('/jobs/my/listings');
  }

  async getJob(id: number): Promise<Job> {
    return this.request(`/jobs/${id}`);
  }

  async createJob(jobData: any): Promise<Job> {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id: number, jobData: any): Promise<Job> {
    return this.request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id: number): Promise<{ message: string }> {
    return this.request(`/jobs/${id}`, { method: 'DELETE' });
  }

  // --- Matches ---
  async analyzeMatch(jobId: number, resumeId?: number): Promise<MatchResult> {
    return this.request('/matches/analyze', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, resume_id: resumeId }),
    });
  }

  async getRecommendations(): Promise<Array<{ job: Job; total_score: number; breakdown: any; matching_skills: string[]; missing_skills: string[]; explanation: string; recommended_steps: string[] }>> {
    return this.request('/matches/recommendations');
  }

  async getMatchDetail(id: number): Promise<MatchResult> {
    return this.request(`/matches/${id}`);
  }

  // --- Applications ---
  async applyToJob(jobId: number, resumeId?: number): Promise<any> {
    return this.request(`/applications/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ resume_id: resumeId }),
    });
  }

  async listApplications(jobId?: number): Promise<JobApplication[]> {
    const q = jobId ? `?job_id=${jobId}` : '';
    return this.request(`/applications${q}`);
  }

  async updateApplicationStatus(id: number, status: string, notes?: string): Promise<any> {
    return this.request(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, recruiter_notes: notes }),
    });
  }

  // --- AI Features ---
  async chatWithAI(message: string, sessionId?: number): Promise<{ session_id: number; reply: string; sources: any[]; is_fallback: boolean }> {
    return this.request('/ai/career-chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    });
  }

  async getChatHistory(sessionId?: number): Promise<any> {
    const q = sessionId ? `?session_id=${sessionId}` : '';
    return this.request(`/ai/chat-history${q}`);
  }

  async startInterview(data: { role: string; difficulty: string; topic: string; question_count: number }): Promise<InterviewSession> {
    return this.request('/ai/interview-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitInterviewAnswer(questionId: number, answer: string): Promise<any> {
    return this.request('/ai/interview-answer', {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, user_answer: answer }),
    });
  }

  async analyzeSkillGap(jobId: number, resumeId?: number): Promise<SkillGapData> {
    return this.request('/ai/skill-gap-analysis', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, resume_id: resumeId }),
    });
  }

  async getRecruiterSummary(applicationId: number): Promise<any> {
    return this.request(`/ai/recruiter-summary/${applicationId}`);
  }

  // --- Admin ---
  async getAdminStats(): Promise<PlatformStats> {
    return this.request('/admin/stats');
  }

  async getAdminUsers(): Promise<User[]> {
    return this.request('/admin/users');
  }

  async toggleUserStatus(userId: number): Promise<{ message: string; is_active: boolean }> {
    return this.request(`/admin/users/${userId}/toggle-status`, {
      method: 'PATCH',
    });
  }

  async getAuditLogs(): Promise<any[]> {
    return this.request('/admin/audit-logs');
  }
}

export const api = new ApiClient();
