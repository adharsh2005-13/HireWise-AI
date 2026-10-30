export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: {
    candidate_id?: number;
    recruiter_id?: number;
    headline?: string;
    phone?: string;
    location?: string;
    bio?: string;
    github_url?: string;
    linkedin_url?: string;
    years_experience?: number;
    current_company?: string;
    target_roles?: string[];
    company_name?: string;
    company_website?: string;
    designation?: string;
    department?: string;
    company_size?: string;
  };
}

export interface ExtractedSkill {
  name: string;
  category: string;
  proficiency: string;
  confidence: number;
}

export interface ParsedResumeData {
  candidate_name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: ExtractedSkill[];
  technical_categories: Record<string, string[]>;
  education: Array<{ degree: string; institution: string; year: string }>;
  experience: Array<{ role: string; company: string; duration: string; highlights?: string[] }>;
  projects: Array<{ title: string; description: string }>;
  completeness_score: number;
  completeness_breakdown: Record<string, boolean>;
  improvement_suggestions: string[];
  unclear_fields: string[];
}

export interface Resume {
  id: number;
  candidate_id: number;
  filename: string;
  file_size: number;
  file_type: string;
  completeness_score: number;
  is_primary: boolean;
  created_at: string;
  parsed_data: ParsedResumeData;
}

export interface Job {
  id: number;
  recruiter_id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_range: string;
  description: string;
  requirements?: string;
  required_skills: string[];
  preferred_skills: string[];
  status: string;
  created_at: string;
  applicant_count?: number;
}

export interface MatchScoreBreakdown {
  required_skill_score: number;
  semantic_score: number;
  experience_score: number;
  preferred_skill_score: number;
}

export interface MatchResult {
  id?: number;
  job_id: number;
  candidate_id: number;
  resume_id?: number;
  total_score: number;
  breakdown: MatchScoreBreakdown;
  matching_skills: string[];
  missing_skills: string[];
  explanation: string;
  recommended_steps: string[];
  job?: Job;
  disclaimer?: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  candidate_id: number;
  resume_id?: number;
  status: 'applied' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'rejected' | 'hired';
  match_score: number;
  recruiter_notes?: string;
  applied_at: string;
  updated_at: string;
  job?: {
    id: number;
    title: string;
    company: string;
    location: string;
    experience_level: string;
  };
  candidate?: {
    id: number;
    name: string;
    email: string;
    headline: string;
    years_experience: number;
  };
  resume?: {
    id: number;
    filename: string;
    completeness_score: number;
    skills: string[];
  };
}

export interface ChatSource {
  title: string;
  source_type: string;
  snippet: string;
}

export interface ChatMessage {
  id?: number;
  sender: 'user' | 'ai';
  message: string;
  sources?: ChatSource[];
  is_fallback?: boolean;
  created_at?: string;
}

export interface InterviewQuestion {
  id: number;
  session_id: number;
  question_text: string;
  question_type: string;
  rubric?: any;
  sample_answer?: string;
  user_answer?: string;
  score?: number;
  feedback?: string;
  evaluation_breakdown?: {
    relevance?: number;
    technical_correctness?: number;
    explanation_quality?: number;
    problem_solving?: number;
  };
}

export interface InterviewSession {
  id: number;
  candidate_id: number;
  role: string;
  difficulty: string;
  topic: string;
  total_score: number;
  feedback?: string;
  status: string;
  created_at: string;
  questions: InterviewQuestion[];
}

export interface LearningResource {
  skill_name: string;
  title: string;
  url: string;
  resource_type: string;
  provider: string;
  difficulty: string;
  description: string;
}

export interface SkillGapData {
  job_id: number;
  job_title: string;
  company: string;
  demonstrated_skills: string[];
  missing_required_skills: string[];
  missing_preferred_skills: string[];
  readiness_percentage: number;
  learning_sequence: string[];
  curated_resources: LearningResource[];
  practice_project_ideas: Array<{ title: string; skills_involved: string; description: string; duration: string }>;
  roadmap_milestones: Array<{ phase: string; duration: string; goal: string; status: string }>;
}

export interface PlatformStats {
  total_users: number;
  total_candidates: number;
  total_recruiters: number;
  total_jobs: number;
  total_resumes: number;
  total_applications: number;
  average_match_score: number;
  active_jobs_count: number;
  role_distribution: Record<string, number>;
  top_demanded_skills: Array<{ skill: string; demand_count: number }>;
}
