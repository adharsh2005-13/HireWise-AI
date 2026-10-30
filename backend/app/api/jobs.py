from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.all_models import Job, JobApplication, RecruiterProfile, User, UserRole
from app.schemas.schemas import JobCreate, JobUpdate, JobOut
from app.ai.rag.rag_engine import RAGEngine
from app.api.deps import get_current_user, require_recruiter

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobOut])
def list_jobs(
    q: Optional[str] = Query(None, description="Search term for title, company, or skills"),
    location: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Job).filter(Job.status == "Active")

    if location and location != "All":
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if experience_level and experience_level != "All":
        query = query.filter(Job.experience_level.ilike(f"%{experience_level}%"))
    if job_type and job_type != "All":
        query = query.filter(Job.job_type.ilike(f"%{job_type}%"))
    
    jobs = query.order_by(Job.created_at.desc()).all()

    if q:
        q_clean = q.lower().strip()
        filtered = []
        for j in jobs:
            title_match = q_clean in j.title.lower()
            comp_match = q_clean in j.company.lower()
            skills_match = any(q_clean in s.lower() for s in (j.required_skills or []))
            if title_match or comp_match or skills_match:
                filtered.append(j)
        jobs = filtered

    results = []
    for j in jobs:
        out = JobOut.from_orm(j)
        out.applicant_count = db.query(JobApplication).filter(JobApplication.job_id == j.id).count()
        results.append(out)
    return results

@router.get("/my/listings", response_model=List[JobOut])
def get_recruiter_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.recruiter_profile:
        raise HTTPException(status_code=403, detail="Only recruiters can view managed job listings.")
    
    jobs = db.query(Job).filter(
        Job.recruiter_id == current_user.recruiter_profile.id
    ).order_by(Job.created_at.desc()).all()

    results = []
    for j in jobs:
        out = JobOut.from_orm(j)
        out.applicant_count = db.query(JobApplication).filter(JobApplication.job_id == j.id).count()
        results.append(out)
    return results

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found.")
    
    out = JobOut.from_orm(job)
    out.applicant_count = db.query(JobApplication).filter(JobApplication.job_id == job.id).count()
    return out

@router.post("", response_model=JobOut)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    rec_id = current_user.recruiter_profile.id if current_user.recruiter_profile else 1

    new_job = Job(
        recruiter_id=rec_id,
        title=job_in.title,
        company=job_in.company,
        location=job_in.location,
        job_type=job_in.job_type,
        experience_level=job_in.experience_level,
        salary_range=job_in.salary_range,
        description=job_in.description,
        requirements=job_in.requirements,
        required_skills=job_in.required_skills,
        preferred_skills=job_in.preferred_skills,
        status="Active"
    )
    db.add(new_job)
    db.flush()

    # Index into RAG system for grounded matching and career recommendations
    combined_doc = (
        f"Job Title: {new_job.title} at {new_job.company}\n"
        f"Experience Level: {new_job.experience_level}\n"
        f"Required Skills: {', '.join(new_job.required_skills or [])}\n"
        f"Preferred Skills: {', '.join(new_job.preferred_skills or [])}\n\n"
        f"Description:\n{new_job.description}"
    )
    RAGEngine.index_document(
        db,
        doc_type="job_description",
        title=f"{new_job.title} - {new_job.company}",
        text=combined_doc,
        metadata={"is_private": False, "job_id": new_job.id}
    )

    db.commit()
    db.refresh(new_job)
    out = JobOut.from_orm(new_job)
    out.applicant_count = 0
    return out

@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    is_owner = current_user.recruiter_profile and job.recruiter_id == current_user.recruiter_profile.id
    is_admin = current_user.role == UserRole.ADMIN
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="You do not have permission to edit this job posting.")

    for field, val in job_in.dict(exclude_unset=True).items():
        setattr(job, field, val)

    db.commit()
    db.refresh(job)
    out = JobOut.from_orm(job)
    out.applicant_count = db.query(JobApplication).filter(JobApplication.job_id == job.id).count()
    return out

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    is_owner = current_user.recruiter_profile and job.recruiter_id == current_user.recruiter_profile.id
    is_admin = current_user.role == UserRole.ADMIN
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="You do not have permission to delete this job posting.")

    db.delete(job)
    db.commit()
    return {"message": "Job listing deleted successfully."}
