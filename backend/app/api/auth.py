from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.all_models import User, UserRole, CandidateProfile, RecruiterProfile, AuditLog
from app.schemas.schemas import UserRegister, UserLogin, Token, UserOut, CandidateProfileUpdate, RecruiterProfileUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email already registered
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists in the system."
        )
    
    role = user_in.role.lower()
    if role not in [UserRole.CANDIDATE, UserRole.RECRUITER, UserRole.ADMIN]:
        role = UserRole.CANDIDATE

    # Create user
    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=role,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create corresponding role profile
    profile_data = {}
    if role == UserRole.CANDIDATE:
        cand = CandidateProfile(
            user_id=new_user.id,
            headline=user_in.headline or "Aspiring Software Engineer",
            target_roles=["Full Stack Developer", "Software Engineer"]
        )
        db.add(cand)
        db.flush()
        profile_data = {"headline": cand.headline, "candidate_id": cand.id}
    elif role == UserRole.RECRUITER:
        rec = RecruiterProfile(
            user_id=new_user.id,
            company_name=user_in.company_name or "Tech Ventures Inc",
            designation="Talent Acquisition Lead"
        )
        db.add(rec)
        db.flush()
        profile_data = {"company_name": rec.company_name, "recruiter_id": rec.id}

    # Audit log
    audit = AuditLog(
        user_id=new_user.id,
        action="USER_REGISTERED",
        entity_type="USER",
        entity_id=str(new_user.id),
        details={"role": role, "email": new_user.email}
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=new_user.id, role=new_user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "profile": profile_data
        }
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled.")

    profile_data = {}
    if user.candidate_profile:
        profile_data = {
            "candidate_id": user.candidate_profile.id,
            "headline": user.candidate_profile.headline,
            "location": user.candidate_profile.location,
            "years_experience": user.candidate_profile.years_experience
        }
    elif user.recruiter_profile:
        profile_data = {
            "recruiter_id": user.recruiter_profile.id,
            "company_name": user.recruiter_profile.company_name,
            "designation": user.recruiter_profile.designation
        }

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "profile": profile_data
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {}
    if current_user.candidate_profile:
        cp = current_user.candidate_profile
        profile_data = {
            "candidate_id": cp.id,
            "headline": cp.headline,
            "phone": cp.phone,
            "location": cp.location,
            "bio": cp.bio,
            "github_url": cp.github_url,
            "linkedin_url": cp.linkedin_url,
            "years_experience": cp.years_experience,
            "current_company": cp.current_company,
            "target_roles": cp.target_roles or []
        }
    elif current_user.recruiter_profile:
        rp = current_user.recruiter_profile
        profile_data = {
            "recruiter_id": rp.id,
            "company_name": rp.company_name,
            "company_website": rp.company_website,
            "designation": rp.designation,
            "department": rp.department,
            "company_size": rp.company_size
        }

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "profile": profile_data
    }

@router.put("/profile/candidate")
def update_candidate_profile(
    profile_in: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.candidate_profile:
        raise HTTPException(status_code=400, detail="User does not have a candidate profile.")
    
    cp = current_user.candidate_profile
    for field, val in profile_in.dict(exclude_unset=True).items():
        setattr(cp, field, val)
    
    db.commit()
    db.refresh(cp)
    return {"message": "Profile updated successfully"}

@router.put("/profile/recruiter")
def update_recruiter_profile(
    profile_in: RecruiterProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.recruiter_profile:
        raise HTTPException(status_code=400, detail="User does not have a recruiter profile.")
    
    rp = current_user.recruiter_profile
    for field, val in profile_in.dict(exclude_unset=True).items():
        setattr(rp, field, val)
    
    db.commit()
    db.refresh(rp)
    return {"message": "Recruiter profile updated successfully"}
