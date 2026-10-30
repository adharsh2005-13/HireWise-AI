from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole:
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"
    ADMIN = "admin"

class ApplicationStatus:
    APPLIED = "applied"
    UNDER_REVIEW = "under_review"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    REJECTED = "rejected"
    HIRED = "hired"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.CANDIDATE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    recruiter_profile = relationship("RecruiterProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    headline = Column(String(255), default="")
    phone = Column(String(50), default="")
    location = Column(String(100), default="")
    bio = Column(Text, default="")
    github_url = Column(String(255), default="")
    linkedin_url = Column(String(255), default="")
    years_experience = Column(Float, default=0.0)
    current_company = Column(String(150), default="")
    target_roles = Column(JSON, default=list) # List of target job titles
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="candidate_profile")
    resumes = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="candidate", cascade="all, delete-orphan")
    matches = relationship("MatchResult", back_populates="candidate", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="candidate", cascade="all, delete-orphan")


class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(200), nullable=False)
    company_website = Column(String(255), default="")
    designation = Column(String(100), default="")
    department = Column(String(100), default="")
    company_size = Column(String(50), default="10-50")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="recruiter_profile")
    jobs = relationship("Job", back_populates="recruiter", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0) # in bytes
    file_type = Column(String(50), default="application/pdf")
    raw_text = Column(Text, nullable=False)
    parsed_data = Column(JSON, default=dict) # parsed structured JSON (skills, education, projects, exp)
    completeness_score = Column(Float, default=0.0) # 0-100
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("CandidateProfile", back_populates="resumes")
    skills = relationship("ExtractedResumeSkill", back_populates="resume", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="resume")


class ExtractedResumeSkill(Base):
    __tablename__ = "extracted_resume_skills"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), index=True, nullable=False)
    category = Column(String(100), default="General") # Programming, Framework, Database, Tool, Cloud
    proficiency = Column(String(50), default="Intermediate")
    confidence = Column(Float, default=0.9)

    resume = relationship("Resume", back_populates="skills")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("recruiter_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), index=True, nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(150), default="Remote")
    job_type = Column(String(50), default="Full-time") # Full-time, Part-time, Contract, Internship
    experience_level = Column(String(50), default="Mid-level") # Entry, Mid, Senior, Lead
    salary_range = Column(String(100), default="$80,000 - $120,000")
    description = Column(Text, nullable=False)
    requirements = Column(Text, default="")
    required_skills = Column(JSON, default=list) # List of required skill strings
    preferred_skills = Column(JSON, default=list) # List of preferred skill strings
    status = Column(String(50), default="Active") # Active, Closed, Draft
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    recruiter = relationship("RecruiterProfile", back_populates="jobs")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")
    matches = relationship("MatchResult", back_populates="job", cascade="all, delete-orphan")
    skill_items = relationship("JobRequiredSkill", back_populates="job", cascade="all, delete-orphan")


class JobRequiredSkill(Base):
    __tablename__ = "job_required_skills"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    is_mandatory = Column(Boolean, default=True)
    importance_weight = Column(Float, default=1.0)

    job = relationship("Job", back_populates="skill_items")


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default=ApplicationStatus.APPLIED)
    match_score = Column(Float, default=0.0)
    recruiter_notes = Column(Text, default="")
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    job = relationship("Job", back_populates="applications")
    candidate = relationship("CandidateProfile", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=True)
    
    total_score = Column(Float, nullable=False) # 0-100
    required_skill_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    preferred_skill_score = Column(Float, default=0.0)
    
    matching_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    explanation = Column(Text, default="")
    recommended_steps = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("CandidateProfile", back_populates="matches")
    job = relationship("Job", back_populates="matches")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(100), nullable=False)
    difficulty = Column(String(50), default="Intermediate")
    topic = Column(String(100), default="Full Stack Development")
    total_score = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    status = Column(String(50), default="in_progress") # in_progress, completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("CandidateProfile", back_populates="interview_sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="Technical") # Technical, Coding, HR, Project
    rubric = Column(JSON, default=dict)
    sample_answer = Column(Text, default="")
    user_answer = Column(Text, default="")
    score = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    evaluation_breakdown = Column(JSON, default=dict)

    session = relationship("InterviewSession", back_populates="questions")


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    resource_type = Column(String(50), default="Course") # Course, Documentation, Tutorial, Book, Project
    provider = Column(String(100), default="Official Docs")
    difficulty = Column(String(50), default="Beginner")
    description = Column(Text, default="")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), default="Career Advice")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(50), nullable=False) # "user" or "ai"
    message = Column(Text, nullable=False)
    sources = Column(JSON, default=list) # Cited RAG sources
    is_fallback = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("ChatSession", back_populates="messages")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String(50), default="knowledge") # knowledge, job_description, guide, resume
    title = Column(String(255), nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, default=0)
    metadata_json = Column(JSON, default=dict)
    embedding_vector = Column(JSON, default=list) # List of floats for vector search
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), default="")
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")
