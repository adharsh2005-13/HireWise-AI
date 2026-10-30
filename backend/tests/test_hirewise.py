import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.services.nlp_extractor import NLPExtractor
from app.services.matching_engine import MatchingEngine
from app.services.gap_analyzer import SkillGapAnalyzer
from app.services.interview_service import InterviewService
from app.ai.rag.rag_engine import RAGEngine
from app.models.all_models import User, UserRole, Job, Resume

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_password_hashing_and_verification():
    raw_pw = "SecureP@ssword2026!"
    hashed = get_password_hash(raw_pw)
    assert hashed != raw_pw
    assert verify_password(raw_pw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_generation_and_decoding():
    token = create_access_token(subject=42, role=UserRole.CANDIDATE)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == "42"
    assert payload.get("role") == UserRole.CANDIDATE

def test_nlp_skill_extraction():
    sample_text = """
    Software Engineer with experience in Python, React, PostgreSQL, Docker, and Redis.
    Designed REST APIs using FastAPI and deployed microservices on AWS using Kubernetes.
    """
    skills, categorized = NLPExtractor.extract_skills(sample_text)
    skill_names = [s["name"] for s in skills]
    assert "Python" in skill_names
    assert "React" in skill_names
    assert "PostgreSQL" in skill_names
    assert "Docker" in skill_names
    assert "FastAPI" in skill_names
    assert "Databases & Caching" in categorized

def test_nlp_completeness_calculation():
    score, breakdown, unclear, suggestions = NLPExtractor.calculate_completeness(
        name="Alex Rivera",
        email="alex@developer.io",
        phone="+1 555-123-4567",
        summary="Experienced full-stack engineer with 4 years in software systems.",
        skills=[{"name": "Python"}, {"name": "React"}, {"name": "SQL"}, {"name": "Docker"}],
        education=[{"degree": "BS in CS", "institution": "UC Berkeley"}],
        experience=[{"role": "Software Engineer", "company": "Tech Corp"}],
        projects=[{"title": "Distributed Queue", "description": "High-throughput messaging system"}]
    )
    assert score >= 80.0
    assert breakdown["has_contact_info"] is True
    assert breakdown["has_skills"] is True
    assert len(unclear) == 0

def test_job_matching_engine():
    cand_skills = ["Python", "FastAPI", "React", "PostgreSQL", "Docker"]
    cand_text = "Experienced building FastAPI backends and React frontends backed by PostgreSQL and Docker."
    cand_projects = [{"title": "API Gateway", "description": "FastAPI gateway"}]
    cand_exp = [{"role": "Backend Engineer", "company": "Cloud Inc"}]
    
    req_skills = ["Python", "FastAPI", "PostgreSQL"]
    pref_skills = ["Docker", "Kubernetes"]
    
    match_result = MatchingEngine.calculate_match(
        candidate_skills=cand_skills,
        candidate_text=cand_text,
        candidate_projects=cand_projects,
        candidate_experience=cand_exp,
        job_required_skills=req_skills,
        job_preferred_skills=pref_skills,
        job_description="Seeking a Python FastAPI backend developer with PostgreSQL and Docker skills.",
        job_title="Backend Developer"
    )
    
    assert match_result["total_score"] >= 75.0
    assert match_result["breakdown"]["required_skill_score"] == 100.0
    assert "Docker" in match_result["matching_skills"]
    assert "Kubernetes" in match_result["missing_skills"]
    assert len(match_result["explanation"]) > 20

def test_skill_gap_analysis():
    cand_skills = ["Python", "React", "PostgreSQL"]
    req_skills = ["Python", "PostgreSQL", "Kubernetes", "AWS"]
    pref_skills = ["Redis"]

    gap_data = SkillGapAnalyzer.analyze(
        candidate_skills=cand_skills,
        job_required_skills=req_skills,
        job_preferred_skills=pref_skills,
        job_title="DevOps Engineer",
        company="CloudScale",
        job_id=1
    )

    assert "Kubernetes" in gap_data["missing_required_skills"]
    assert "AWS" in gap_data["missing_required_skills"]
    assert len(gap_data["curated_resources"]) > 0
    assert len(gap_data["roadmap_milestones"]) > 0

def test_interview_prep_and_evaluation():
    questions = InterviewService.generate_questions("Full Stack Developer", "Intermediate", "Web", 3)
    assert len(questions) == 3
    q = questions[0]
    assert "question_text" in q
    assert "rubric" in q
    
    eval_result = InterviewService.evaluate_answer(
        question_text=q["question_text"],
        question_type=q["question_type"],
        rubric=q["rubric"],
        user_answer="Optimistic locking checks record versions before updating to avoid collisions without holding persistent locks, making it ideal for web apps with low write contention. Pessimistic locking acquires a row-level lock immediately.",
        sample_answer=q["sample_answer"]
    )
    assert eval_result["score"] >= 5.0
    assert "breakdown" in eval_result
    assert "disclaimer" in eval_result

def test_rag_retrieval(db):
    results = RAGEngine.retrieve(db, "resume best practices Google XYZ formula", top_k=2)
    assert len(results) > 0
    assert "Resume Engineering Best Practices" in [r["title"] for r in results]
