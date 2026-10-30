from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = Field("candidate", description="candidate, recruiter, or admin")
    # Optional profile metadata on signup
    company_name: Optional[str] = None # For recruiter
    headline: Optional[str] = None # For candidate

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    profile: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# --- Profile Schemas ---
class CandidateProfileUpdate(BaseModel):
    headline: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    years_experience: Optional[float] = None
    current_company: Optional[str] = None
    target_roles: Optional[List[str]] = None

class RecruiterProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    company_size: Optional[str] = None

# --- Resume Schemas ---
class SkillDetail(BaseModel):
    name: str
    category: str = "General"
    proficiency: str = "Intermediate"
    confidence: float = 0.9

class ParsedResumeData(BaseModel):
    candidate_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    skills: List[SkillDetail] = []
    technical_categories: Dict[str, List[str]] = {}
    education: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    completeness_score: float = 0.0
    completeness_breakdown: Dict[str, bool] = {}
    improvement_suggestions: List[str] = []
    unclear_fields: List[str] = []

class ResumeOut(BaseModel):
    id: int
    candidate_id: int
    filename: str
    file_size: int
    file_type: str
    completeness_score: float
    is_primary: bool
    created_at: datetime
    parsed_data: Dict[str, Any]

    class Config:
        from_attributes = True

# --- Job Schemas ---
class JobCreate(BaseModel):
    title: str = Field(..., min_length=2)
    company: str = Field(..., min_length=2)
    location: str = "Remote"
    job_type: str = "Full-time"
    experience_level: str = "Mid-level"
    salary_range: str = "$90,000 - $130,000"
    description: str = Field(..., min_length=10)
    requirements: Optional[str] = ""
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    status: Optional[str] = None

class JobOut(BaseModel):
    id: int
    recruiter_id: int
    title: str
    company: str
    location: str
    job_type: str
    experience_level: str
    salary_range: str
    description: str
    requirements: Optional[str] = ""
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    status: str
    created_at: datetime
    applicant_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Matching Schemas ---
class MatchAnalyzeRequest(BaseModel):
    job_id: int
    resume_id: Optional[int] = None

class MatchScoreBreakdown(BaseModel):
    required_skill_score: float
    semantic_score: float
    experience_score: float
    preferred_skill_score: float

class MatchResultOut(BaseModel):
    id: Optional[int] = None
    job_id: int
    candidate_id: int
    resume_id: Optional[int] = None
    total_score: float
    breakdown: MatchScoreBreakdown
    matching_skills: List[str]
    missing_skills: List[str]
    explanation: str
    recommended_steps: List[str]
    job: Optional[JobOut] = None

# --- Application Schemas ---
class ApplicationCreate(BaseModel):
    resume_id: Optional[int] = None

class ApplicationStatusUpdate(BaseModel):
    status: str
    recruiter_notes: Optional[str] = None

class ApplicationOut(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    resume_id: Optional[int] = None
    status: str
    match_score: float
    recruiter_notes: Optional[str] = None
    applied_at: datetime
    updated_at: datetime
    job: Optional[Dict[str, Any]] = None
    candidate: Optional[Dict[str, Any]] = None
    resume: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# --- AI & Career Assistant Schemas ---
class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[int] = None

class ChatSource(BaseModel):
    title: str
    source_type: str
    snippet: str

class ChatMessageResponse(BaseModel):
    session_id: int
    reply: str
    sources: List[ChatSource] = []
    is_fallback: bool = False

# --- Interview Prep Schemas ---
class InterviewSessionCreate(BaseModel):
    role: str
    difficulty: str = "Intermediate"
    topic: str = "Full Stack Development"
    question_count: int = 5

class InterviewAnswerSubmit(BaseModel):
    question_id: int
    user_answer: str

class InterviewQuestionOut(BaseModel):
    id: int
    session_id: int
    question_text: str
    question_type: str
    sample_answer: Optional[str] = None
    user_answer: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    evaluation_breakdown: Optional[Dict[str, Any]] = None

class InterviewSessionOut(BaseModel):
    id: int
    candidate_id: int
    role: str
    difficulty: str
    topic: str
    total_score: float
    feedback: Optional[str] = None
    status: str
    created_at: datetime
    questions: List[InterviewQuestionOut] = []

    class Config:
        from_attributes = True

# --- Skill Gap Schemas ---
class SkillGapAnalysisRequest(BaseModel):
    job_id: int
    resume_id: Optional[int] = None

class LearningResourceOut(BaseModel):
    skill_name: str
    title: str
    url: str
    resource_type: str
    provider: str
    difficulty: str
    description: str

class SkillGapAnalysisResponse(BaseModel):
    job_id: int
    job_title: str
    company: str
    demonstrated_skills: List[str]
    missing_required_skills: List[str]
    missing_preferred_skills: List[str]
    readiness_percentage: float
    learning_sequence: List[str]
    curated_resources: List[LearningResourceOut]
    practice_project_ideas: List[Dict[str, str]]
    roadmap_milestones: List[Dict[str, Any]]

# --- Admin & Stats Schemas ---
class PlatformStats(BaseModel):
    total_users: int
    total_candidates: int
    total_recruiters: int
    total_jobs: int
    total_resumes: int
    total_applications: int
    average_match_score: float
    active_jobs_count: int
    role_distribution: Dict[str, int]
    top_demanded_skills: List[Dict[str, Any]]
