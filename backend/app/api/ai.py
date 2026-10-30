from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.models.all_models import (
    User, Job, Resume, JobApplication, ChatSession, ChatMessage, 
    InterviewSession, InterviewQuestion, CandidateProfile
)
from app.schemas.schemas import (
    ChatMessageRequest, ChatMessageResponse, ChatSource,
    InterviewSessionCreate, InterviewSessionOut, InterviewAnswerSubmit,
    SkillGapAnalysisRequest, SkillGapAnalysisResponse
)
from app.services.llm_provider import get_llm_provider
from app.services.interview_service import InterviewService
from app.services.gap_analyzer import SkillGapAnalyzer
from app.ai.rag.rag_engine import RAGEngine
from app.ai.agents.orchestrator import AIAgentOrchestrator
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

@router.post("/career-chat", response_model=ChatMessageResponse)
def career_chat(
    req: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Retrieve or create chat session
    session_id = req.session_id
    if session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()
    else:
        session = None

    if not session:
        session = ChatSession(
            user_id=current_user.id,
            title=req.message[:50] + ("..." if len(req.message) > 50 else "")
        )
        db.add(session)
        db.flush()

    # Save user message
    db.add(ChatMessage(
        session_id=session.id,
        sender="user",
        message=req.message
    ))
    db.commit()

    # 2. RAG Retrieval from verified knowledge sources
    retrieved_chunks = RAGEngine.retrieve(db, req.message, user=current_user, top_k=3)
    
    # 3. LLM / Fallback generation
    llm = get_llm_provider()
    system_prompt = (
        "You are the HireWise AI Career Assistant, an expert technical recruitment and career coach. "
        "Provide actionable, structured advice on resume optimization, skill acquisition, interview prep, "
        "and job descriptions. Cite retrieved sources where applicable. Do not invent unverified qualifications."
    )
    reply, is_fallback = llm.generate_chat_reply(req.message, system_prompt, retrieved_chunks)

    sources_out = [
        ChatSource(
            title=c["title"],
            source_type=c["source_type"],
            snippet=c["snippet"]
        )
        for c in retrieved_chunks
    ]

    # Save AI message
    ai_msg = ChatMessage(
        session_id=session.id,
        sender="ai",
        message=reply,
        sources=[s.dict() for s in sources_out],
        is_fallback=is_fallback
    )
    db.add(ai_msg)
    db.commit()

    return ChatMessageResponse(
        session_id=session.id,
        reply=reply,
        sources=sources_out,
        is_fallback=is_fallback
    )

@router.get("/chat-history")
def get_chat_history(
    session_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc()).all()
    if not sessions:
        return {"sessions": [], "messages": []}

    target_session_id = session_id or sessions[0].id
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == target_session_id).order_by(ChatMessage.created_at.asc()).all()

    return {
        "sessions": [{"id": s.id, "title": s.title, "created_at": s.created_at} for s in sessions],
        "active_session_id": target_session_id,
        "messages": [
            {
                "id": m.id,
                "sender": m.sender,
                "message": m.message,
                "sources": m.sources or [],
                "is_fallback": m.is_fallback,
                "created_at": m.created_at
            }
            for m in messages
        ]
    }

@router.post("/interview-questions", response_model=InterviewSessionOut)
def start_interview_session(
    data: InterviewSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cand_id = current_user.candidate_profile.id if current_user.candidate_profile else 1

    session = InterviewSession(
        candidate_id=cand_id,
        role=data.role,
        difficulty=data.difficulty,
        topic=data.topic,
        status="in_progress"
    )
    db.add(session)
    db.flush()

    # Generate questions via agent
    questions = AIAgentOrchestrator.InterviewPrep.execute(
        db, current_user.id, data.role, data.difficulty, data.topic, data.question_count
    )

    for q in questions:
        db.add(InterviewQuestion(
            session_id=session.id,
            question_text=q["question_text"],
            question_type=q["question_type"],
            rubric=q.get("rubric", {}),
            sample_answer=q.get("sample_answer", "")
        ))

    db.commit()
    db.refresh(session)
    return session

@router.post("/interview-answer")
def submit_interview_answer(
    submission: InterviewAnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    question = db.query(InterviewQuestion).filter(InterviewQuestion.id == submission.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Interview question not found.")

    eval_result = InterviewService.evaluate_answer(
        question_text=question.question_text,
        question_type=question.question_type,
        rubric=question.rubric or {},
        user_answer=submission.user_answer,
        sample_answer=question.sample_answer or ""
    )

    question.user_answer = submission.user_answer
    question.score = eval_result["score"]
    question.feedback = eval_result["feedback"]
    question.evaluation_breakdown = eval_result["breakdown"]

    # Update session average score
    session = question.session
    all_q = session.questions
    scored_q = [q for q in all_q if q.score is not None and q.score > 0]
    if scored_q:
        session.total_score = round(sum(q.score for q in scored_q) / len(scored_q), 1)

    db.commit()
    return eval_result

@router.post("/skill-gap-analysis", response_model=SkillGapAnalysisResponse)
def run_skill_gap_analysis(
    req: SkillGapAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Find candidate resume
    resume = None
    if req.resume_id:
        resume = db.query(Resume).filter(Resume.id == req.resume_id).first()
    elif current_user.candidate_profile:
        resume = db.query(Resume).filter(
            Resume.candidate_id == current_user.candidate_profile.id,
            Resume.is_primary == True
        ).first()

    cand_skills = []
    if resume and resume.parsed_data:
        cand_skills = [s.get("name") for s in resume.parsed_data.get("skills", [])]

    gap_data = AIAgentOrchestrator.CareerGuidance.execute(
        db, current_user.id, cand_skills, job
    )
    return gap_data

@router.get("/recruiter-summary/{application_id}")
def get_recruiter_summary(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if not app.resume:
        raise HTTPException(status_code=400, detail="Applicant has not attached a resume to this application.")

    summary = AIAgentOrchestrator.RecruiterSummary.execute(
        db, current_user.id, app.resume, app.job, app.match_score
    )
    return summary
