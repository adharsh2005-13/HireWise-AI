from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.all_models import Job, Resume, MatchResult, CandidateProfile, User, UserRole
from app.schemas.schemas import MatchAnalyzeRequest, MatchResultOut, JobOut
from app.ai.agents.orchestrator import AIAgentOrchestrator
from app.api.deps import get_current_user

router = APIRouter(prefix="/matches", tags=["Job Matching"])

@router.post("/analyze", response_model=MatchResultOut)
def analyze_match(
    request: MatchAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Find resume to use
    if request.resume_id:
        resume = db.query(Resume).filter(Resume.id == request.resume_id).first()
    else:
        # Pick candidate's primary resume
        if not current_user.candidate_profile:
            raise HTTPException(status_code=400, detail="Candidate profile required to match resume.")
        resume = db.query(Resume).filter(
            Resume.candidate_id == current_user.candidate_profile.id,
            Resume.is_primary == True
        ).first()
        if not resume:
            resume = db.query(Resume).filter(
                Resume.candidate_id == current_user.candidate_profile.id
            ).order_by(Resume.created_at.desc()).first()

    if not resume:
        raise HTTPException(
            status_code=400,
            detail="No uploaded resume found. Please upload a resume first to run job matching."
        )

    # Execute Job Matching Agent
    cand_id = resume.candidate_id
    calc = AIAgentOrchestrator.JobMatching.execute(db, current_user.id, resume, job)

    # Store or update in database
    existing_match = db.query(MatchResult).filter(
        MatchResult.candidate_id == cand_id,
        MatchResult.job_id == job.id
    ).first()

    if existing_match:
        existing_match.resume_id = resume.id
        existing_match.total_score = calc["total_score"]
        existing_match.required_skill_score = calc["breakdown"]["required_skill_score"]
        existing_match.semantic_score = calc["breakdown"]["semantic_score"]
        existing_match.experience_score = calc["breakdown"]["experience_score"]
        existing_match.preferred_skill_score = calc["breakdown"]["preferred_skill_score"]
        existing_match.matching_skills = calc["matching_skills"]
        existing_match.missing_skills = calc["missing_skills"]
        existing_match.explanation = calc["explanation"]
        existing_match.recommended_steps = calc["recommended_steps"]
        match_obj = existing_match
    else:
        match_obj = MatchResult(
            candidate_id=cand_id,
            job_id=job.id,
            resume_id=resume.id,
            total_score=calc["total_score"],
            required_skill_score=calc["breakdown"]["required_skill_score"],
            semantic_score=calc["breakdown"]["semantic_score"],
            experience_score=calc["breakdown"]["experience_score"],
            preferred_skill_score=calc["breakdown"]["preferred_skill_score"],
            matching_skills=calc["matching_skills"],
            missing_skills=calc["missing_skills"],
            explanation=calc["explanation"],
            recommended_steps=calc["recommended_steps"]
        )
        db.add(match_obj)

    db.commit()
    db.refresh(match_obj)

    return {
        "id": match_obj.id,
        "job_id": job.id,
        "candidate_id": cand_id,
        "resume_id": resume.id,
        "total_score": match_obj.total_score,
        "breakdown": {
            "required_skill_score": match_obj.required_skill_score,
            "semantic_score": match_obj.semantic_score,
            "experience_score": match_obj.experience_score,
            "preferred_skill_score": match_obj.preferred_skill_score
        },
        "matching_skills": match_obj.matching_skills or [],
        "missing_skills": match_obj.missing_skills or [],
        "explanation": match_obj.explanation,
        "recommended_steps": match_obj.recommended_steps or [],
        "job": JobOut.from_orm(job)
    }

@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.candidate_profile:
        raise HTTPException(status_code=400, detail="Only candidates have job recommendations.")

    candidate_id = current_user.candidate_profile.id
    resume = db.query(Resume).filter(
        Resume.candidate_id == candidate_id,
        Resume.is_primary == True
    ).first()
    if not resume:
        resume = db.query(Resume).filter(
            Resume.candidate_id == candidate_id
        ).order_by(Resume.created_at.desc()).first()

    active_jobs = db.query(Job).filter(Job.status == "Active").all()
    if not active_jobs:
        return []

    if not resume:
        # Return jobs unranked if no resume uploaded yet
        return [
            {
                "job": JobOut.from_orm(j),
                "total_score": 0.0,
                "matching_skills": [],
                "missing_skills": j.required_skills or [],
                "explanation": "Upload your resume to see personalized match score and missing skill analysis."
            }
            for j in active_jobs
        ]

    recommendations = []
    for job in active_jobs:
        calc = AIAgentOrchestrator.JobMatching.execute(db, current_user.id, resume, job)
        recommendations.append({
            "job": JobOut.from_orm(job),
            "total_score": calc["total_score"],
            "breakdown": calc["breakdown"],
            "matching_skills": calc["matching_skills"],
            "missing_skills": calc["missing_skills"],
            "explanation": calc["explanation"],
            "recommended_steps": calc["recommended_steps"]
        })

    # Sort descending by total_score
    recommendations.sort(key=lambda x: x["total_score"], reverse=True)
    return recommendations

@router.get("/{match_id}")
def get_match_detail(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(MatchResult).filter(MatchResult.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match record not found.")

    job = db.query(Job).filter(Job.id == match.job_id).first()
    return {
        "id": match.id,
        "job_id": match.job_id,
        "candidate_id": match.candidate_id,
        "resume_id": match.resume_id,
        "total_score": match.total_score,
        "breakdown": {
            "required_skill_score": match.required_skill_score,
            "semantic_score": match.semantic_score,
            "experience_score": match.experience_score,
            "preferred_skill_score": match.preferred_skill_score
        },
        "matching_skills": match.matching_skills or [],
        "missing_skills": match.missing_skills or [],
        "explanation": match.explanation,
        "recommended_steps": match.recommended_steps or [],
        "job": JobOut.from_orm(job) if job else None
    }
