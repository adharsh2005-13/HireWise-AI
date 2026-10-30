import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.core.config import settings
from app.models.all_models import Resume, ExtractedResumeSkill, CandidateProfile, User, UserRole, JobApplication
from app.schemas.schemas import ResumeOut
from app.services.resume_parser import ResumeParser, ResumeParserError
from app.services.nlp_extractor import NLPExtractor
from app.ai.rag.rag_engine import RAGEngine
from app.api.deps import get_current_user, require_candidate

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.candidate_profile:
        raise HTTPException(status_code=400, detail="Only candidates can upload resumes.")
    
    # Read file content to check size
    content = await file.read()
    file_size = len(content)
    
    # 1. Validate file extension and size
    is_valid, err_msg = ResumeParser.validate_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # 2. Save securely to uploads directory
    candidate_id = current_user.candidate_profile.id
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    
    with open(file_path, "wb") as f:
        f.write(content)

    # 3. Extract and clean text
    try:
        raw_text = ResumeParser.parse_document(file_path, file.filename)
    except ResumeParserError as pe:
        # Clean up disk file on parse error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(pe))
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Unexpected error processing document: {str(e)}")

    # 4. Run NLP skill and entity extraction
    analysis = NLPExtractor.extract_all(raw_text)

    # Mark existing resumes as non-primary
    db.query(Resume).filter(Resume.candidate_id == candidate_id).update({"is_primary": False})

    # 5. Store in database
    new_resume = Resume(
        candidate_id=candidate_id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file.content_type or "application/octet-stream",
        raw_text=raw_text,
        parsed_data=analysis,
        completeness_score=analysis.get("completeness_score", 0.0),
        is_primary=True
    )
    db.add(new_resume)
    db.flush()

    # Store individual skills
    for sk in analysis.get("skills", []):
        db.add(ExtractedResumeSkill(
            resume_id=new_resume.id,
            skill_name=sk["name"],
            category=sk.get("category", "General"),
            proficiency=sk.get("proficiency", "Intermediate"),
            confidence=sk.get("confidence", 0.9)
        ))

    # Index into RAG vector store with private candidate isolation
    RAGEngine.index_document(
        db,
        doc_type="resume",
        title=f"Resume: {file.filename} ({analysis.get('candidate_name', 'Candidate')})",
        text=raw_text,
        metadata={
            "is_private": True,
            "owner_user_id": current_user.id,
            "candidate_id": candidate_id,
            "resume_id": new_resume.id
        }
    )

    db.commit()
    db.refresh(new_resume)

    return new_resume

@router.get("", response_model=List[ResumeOut])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.candidate_profile:
        return []
    resumes = db.query(Resume).filter(
        Resume.candidate_id == current_user.candidate_profile.id
    ).order_by(Resume.created_at.desc()).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeOut)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    # Authorization Check
    # Allowed: 1) Admin, 2) Owner candidate, 3) Recruiter if candidate applied to recruiter's job
    is_owner = current_user.candidate_profile and resume.candidate_id == current_user.candidate_profile.id
    is_admin = current_user.role == UserRole.ADMIN
    is_authorized_recruiter = False

    if current_user.role == UserRole.RECRUITER and current_user.recruiter_profile:
        rec_id = current_user.recruiter_profile.id
        # Check if an application exists for this resume's candidate on any job posted by this recruiter
        app = db.query(JobApplication).join(JobApplication.job).filter(
            JobApplication.candidate_id == resume.candidate_id,
            JobApplication.job.has(recruiter_id=rec_id)
        ).first()
        if app:
            is_authorized_recruiter = True

    if not (is_owner or is_admin or is_authorized_recruiter):
        raise HTTPException(status_code=403, detail="Access denied: You are not authorized to view this resume.")

    return resume

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    is_owner = current_user.candidate_profile and resume.candidate_id == current_user.candidate_profile.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Access denied: You do not have permission to delete this resume.")

    # Delete local file
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception:
            pass

    db.delete(resume)
    db.commit()
    return {"message": "Resume and associated data deleted successfully."}
