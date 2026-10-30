from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.all_models import JobApplication, Job, Resume, CandidateProfile, User, UserRole, ApplicationStatus
from app.schemas.schemas import ApplicationCreate, ApplicationStatusUpdate, ApplicationOut
from app.ai.agents.orchestrator import AIAgentOrchestrator
from app.api.deps import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/jobs/{job_id}/apply")
def apply_to_job(
    job_id: int,
    app_in: Optional[ApplicationCreate] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.candidate_profile:
        raise HTTPException(status_code=400, detail="Only candidate accounts can submit job applications.")

    candidate_id = current_user.candidate_profile.id
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting does not exist.")

    # Check for duplicate application
    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.candidate_id == candidate_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted an application for this position.")

    # Pick resume
    resume = None
    if app_in and app_in.resume_id:
        resume = db.query(Resume).filter(
            Resume.id == app_in.resume_id,
            Resume.candidate_id == candidate_id
        ).first()
    
    if not resume:
        resume = db.query(Resume).filter(
            Resume.candidate_id == candidate_id,
            Resume.is_primary == True
        ).first()
        if not resume:
            resume = db.query(Resume).filter(
                Resume.candidate_id == candidate_id
            ).order_by(Resume.created_at.desc()).first()

    match_score = 0.0
    if resume:
        calc = AIAgentOrchestrator.JobMatching.execute(db, current_user.id, resume, job)
        match_score = calc["total_score"]

    application = JobApplication(
        job_id=job_id,
        candidate_id=candidate_id,
        resume_id=resume.id if resume else None,
        status=ApplicationStatus.APPLIED,
        match_score=match_score
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Application successfully submitted!",
        "application_id": application.id,
        "job_title": job.title,
        "company": job.company,
        "status": application.status,
        "match_score": application.match_score
    }

@router.get("")
def list_applications(
    current_user: User = Depends(get_current_user),
    job_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Candidate view: their submitted applications
    if current_user.role == UserRole.CANDIDATE:
        cand_id = current_user.candidate_profile.id if current_user.candidate_profile else 0
        apps = db.query(JobApplication).filter(
            JobApplication.candidate_id == cand_id
        ).order_by(JobApplication.applied_at.desc()).all()
    # Recruiter view: applications for their posted jobs
    elif current_user.role == UserRole.RECRUITER:
        rec_id = current_user.recruiter_profile.id if current_user.recruiter_profile else 0
        query = db.query(JobApplication).join(JobApplication.job).filter(
            Job.recruiter_id == rec_id
        )
        if job_id:
            query = query.filter(JobApplication.job_id == job_id)
        apps = query.order_by(JobApplication.applied_at.desc()).all()
    # Admin view: all applications
    else:
        apps = db.query(JobApplication).order_by(JobApplication.applied_at.desc()).all()

    results = []
    for a in apps:
        job_info = {
            "id": a.job.id,
            "title": a.job.title,
            "company": a.job.company,
            "location": a.job.location,
            "experience_level": a.job.experience_level
        } if a.job else None

        cand_info = {
            "id": a.candidate.id,
            "name": a.candidate.user.full_name if a.candidate and a.candidate.user else "Applicant",
            "email": a.candidate.user.email if a.candidate and a.candidate.user else "",
            "headline": a.candidate.headline if a.candidate else "",
            "years_experience": a.candidate.years_experience if a.candidate else 0
        } if a.candidate else None

        resume_info = {
            "id": a.resume.id,
            "filename": a.resume.filename,
            "completeness_score": a.resume.completeness_score,
            "skills": [s.skill_name for s in a.resume.skills] if a.resume else []
        } if a.resume else None

        results.append({
            "id": a.id,
            "job_id": a.job_id,
            "candidate_id": a.candidate_id,
            "resume_id": a.resume_id,
            "status": a.status,
            "match_score": a.match_score,
            "recruiter_notes": a.recruiter_notes,
            "applied_at": a.applied_at,
            "updated_at": a.updated_at,
            "job": job_info,
            "candidate": cand_info,
            "resume": resume_info
        })

    return results

@router.patch("/{application_id}/status")
def update_application_status(
    application_id: int,
    status_in: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found.")

    # Authorization check
    is_recruiter = current_user.recruiter_profile and app.job.recruiter_id == current_user.recruiter_profile.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_recruiter or is_admin):
        raise HTTPException(status_code=403, detail="You do not have permission to manage this application.")

    app.status = status_in.status
    if status_in.recruiter_notes is not None:
        app.recruiter_notes = status_in.recruiter_notes
    app.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(app)
    return {
        "message": f"Application status updated to '{app.status}'.",
        "application_id": app.id,
        "status": app.status,
        "recruiter_notes": app.recruiter_notes
    }
