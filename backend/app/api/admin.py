from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.all_models import (
    User, CandidateProfile, RecruiterProfile, Job, Resume, 
    JobApplication, MatchResult, AuditLog, UserRole
)
from app.schemas.schemas import PlatformStats
from app.api.deps import require_admin, get_current_user

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/stats", response_model=PlatformStats)
def get_platform_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_candidates = db.query(User).filter(User.role == UserRole.CANDIDATE).count()
    total_recruiters = db.query(User).filter(User.role == UserRole.RECRUITER).count()
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status == "Active").count()
    total_resumes = db.query(Resume).count()
    total_applications = db.query(JobApplication).count()

    avg_score = db.query(func.avg(MatchResult.total_score)).scalar() or 0.0

    # Skill demand tally from job requirements
    jobs = db.query(Job).all()
    skill_counts = {}
    for j in jobs:
        for s in (j.required_skills or []):
            skill_counts[s] = skill_counts.get(s, 0) + 1

    top_skills = [
        {"skill": k, "demand_count": v}
        for k, v in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    ]

    return {
        "total_users": total_users,
        "total_candidates": total_candidates,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs,
        "total_resumes": total_resumes,
        "total_applications": total_applications,
        "average_match_score": round(float(avg_score), 1),
        "active_jobs_count": active_jobs,
        "role_distribution": {
            "Candidate": total_candidates,
            "Recruiter": total_recruiters,
            "Admin": total_users - (total_candidates + total_recruiters)
        },
        "top_demanded_skills": top_skills
    }

@router.get("/users")
def list_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.patch("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User status set to {'active' if user.is_active else 'inactive'}.", "is_active": user.is_active}

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details or {},
            "ip_address": l.ip_address,
            "created_at": l.created_at
        }
        for l in logs
    ]
