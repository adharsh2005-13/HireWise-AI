import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.all_models import AuditLog, Job, Resume, CandidateProfile, User
from app.services.matching_engine import MatchingEngine
from app.services.gap_analyzer import SkillGapAnalyzer
from app.services.interview_service import InterviewService
from app.services.nlp_extractor import NLPExtractor

logger = logging.getLogger(__name__)

class AgentAudit:
    @staticmethod
    def log_agent_action(db: Session, user_id: Optional[int], agent_name: str, action: str, details: Dict[str, Any]):
        try:
            log = AuditLog(
                user_id=user_id,
                action=f"AGENT_{agent_name.upper()}_{action.upper()}",
                entity_type="AI_AGENT",
                entity_id=agent_name,
                details=details
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to write agent audit log: {e}")

class ResumeAnalysisAgent:
    @staticmethod
    def execute(db: Session, user_id: int, raw_text: str) -> Dict[str, Any]:
        analysis = NLPExtractor.extract_all(raw_text)
        AgentAudit.log_agent_action(
            db, user_id, "ResumeAnalysisAgent", "PARSE_RESUME", 
            {"skills_count": len(analysis.get("skills", [])), "completeness": analysis.get("completeness_score")}
        )
        return analysis

class JobMatchingAgent:
    @staticmethod
    def execute(db: Session, user_id: int, resume: Resume, job: Job) -> Dict[str, Any]:
        parsed = resume.parsed_data or {}
        candidate_skills = [s.get("name") for s in parsed.get("skills", [])]
        
        result = MatchingEngine.calculate_match(
            candidate_skills=candidate_skills,
            candidate_text=resume.raw_text,
            candidate_projects=parsed.get("projects", []),
            candidate_experience=parsed.get("experience", []),
            job_required_skills=job.required_skills or [],
            job_preferred_skills=job.preferred_skills or [],
            job_description=job.description,
            job_title=job.title,
            job_experience_level=job.experience_level
        )
        AgentAudit.log_agent_action(
            db, user_id, "JobMatchingAgent", "CALCULATE_MATCH", 
            {"job_id": job.id, "resume_id": resume.id, "score": result["total_score"]}
        )
        return result

class CareerGuidanceAgent:
    @staticmethod
    def execute(db: Session, user_id: int, candidate_skills: List[str], job: Job) -> Dict[str, Any]:
        gap_data = SkillGapAnalyzer.analyze(
            candidate_skills=candidate_skills,
            job_required_skills=job.required_skills or [],
            job_preferred_skills=job.preferred_skills or [],
            job_title=job.title,
            company=job.company,
            job_id=job.id
        )
        AgentAudit.log_agent_action(
            db, user_id, "CareerGuidanceAgent", "ANALYZE_GAPS", 
            {"job_id": job.id, "missing_skills": gap_data["missing_required_skills"]}
        )
        return gap_data

class InterviewPrepAgent:
    @staticmethod
    def execute(db: Session, user_id: int, role: str, difficulty: str, topic: str, count: int = 5) -> List[Dict[str, Any]]:
        questions = InterviewService.generate_questions(role, difficulty, topic, count)
        AgentAudit.log_agent_action(
            db, user_id, "InterviewPrepAgent", "GENERATE_QUESTIONS", 
            {"role": role, "difficulty": difficulty, "count": len(questions)}
        )
        return questions

class RecruitmentSummaryAgent:
    """
    Synthesizes an evidence-based summary of candidate qualifications for recruiter review.
    Enforces strict ethical AI standards: job-related evidence ONLY.
    No consideration of age, gender, religion, race, or photos.
    """
    @staticmethod
    def execute(db: Session, recruiter_user_id: int, resume: Resume, job: Job, match_score: float) -> Dict[str, Any]:
        parsed = resume.parsed_data or {}
        skills = [s.get("name") for s in parsed.get("skills", [])]
        req_set = set(s.lower() for s in (job.required_skills or []))
        matched = [s for s in skills if s.lower() in req_set]
        missing = [s for s in (job.required_skills or []) if s.lower() not in set(x.lower() for x in skills)]

        years = parsed.get("years_experience", len(parsed.get("experience", [])) * 1.5)
        
        summary_text = (
            f"Candidate presents {round(years, 1)} estimated years of technical background with demonstrated "
            f"competency in {len(matched)} of {len(job.required_skills or [])} core requirements ({', '.join(matched[:4])}). "
            f"Resume completeness is evaluated at {parsed.get('completeness_score', 80)}%."
        )

        recommendation = "Recommend for Interview" if match_score >= 75 else ("Consider for Technical Review" if match_score >= 55 else "Additional Skill Alignment Needed")

        output = {
            "candidate_name": parsed.get("candidate_name", "Applicant"),
            "target_role": job.title,
            "overall_match_score": match_score,
            "executive_summary": summary_text,
            "demonstrated_core_skills": matched,
            "unverified_or_missing_skills": missing,
            "recruiter_recommendation": recommendation,
            "governance_notice": "Evaluation based purely on documented technical qualifications and work experience without consideration of protected demographics."
        }

        AgentAudit.log_agent_action(
            db, recruiter_user_id, "RecruitmentSummaryAgent", "GENERATE_SUMMARY", 
            {"job_id": job.id, "resume_id": resume.id, "match_score": match_score}
        )
        return output

class AIAgentOrchestrator:
    """Coordinates multi-module recruitment workflows with safety and audit checks."""
    ResumeAnalysis = ResumeAnalysisAgent
    JobMatching = JobMatchingAgent
    CareerGuidance = CareerGuidanceAgent
    InterviewPrep = InterviewPrepAgent
    RecruiterSummary = RecruitmentSummaryAgent
