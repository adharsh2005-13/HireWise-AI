from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.all_models import (
    User, UserRole, CandidateProfile, RecruiterProfile, Job, 
    LearningResource, DocumentChunk, Resume, ExtractedResumeSkill, 
    JobApplication, ApplicationStatus
)
from app.services.gap_analyzer import VERIFIED_RESOURCES
from app.ai.rag.rag_engine import RAGEngine

def init_db(db: Session):
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(User).first():
        return

    print("Seeding initial HireWise AI database...")

    # 1. Seed Administrator
    admin = User(
        email="admin@hirewise.ai",
        hashed_password=get_password_hash("Admin123!"),
        full_name="Platform Administrator",
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)

    # 2. Seed Recruiter
    recruiter_user = User(
        email="recruiter@techventures.com",
        hashed_password=get_password_hash("Recruiter123!"),
        full_name="Sarah Jenkins",
        role=UserRole.RECRUITER,
        is_active=True
    )
    db.add(recruiter_user)
    db.flush()

    recruiter_profile = RecruiterProfile(
        user_id=recruiter_user.id,
        company_name="CloudScale Technologies",
        company_website="https://cloudscale-tech.example.com",
        designation="Senior Technical Recruiter",
        department="Engineering Talent",
        company_size="250-500"
    )
    db.add(recruiter_profile)
    db.flush()

    # 3. Seed Candidate
    candidate_user = User(
        email="alex@developer.io",
        hashed_password=get_password_hash("Candidate123!"),
        full_name="Alex Rivera",
        role=UserRole.CANDIDATE,
        is_active=True
    )
    db.add(candidate_user)
    db.flush()

    candidate_profile = CandidateProfile(
        user_id=candidate_user.id,
        headline="Full-Stack Software Engineer | React, Python, PostgreSQL",
        phone="+1 (555) 234-5678",
        location="San Francisco, CA (Remote)",
        bio="Passionate full-stack developer with 3+ years building responsive web apps, REST APIs, and microservices.",
        github_url="https://github.com/alexrivera-dev",
        linkedin_url="https://linkedin.com/in/alexrivera-dev",
        years_experience=3.0,
        current_company="Apex Solutions",
        target_roles=["Full Stack Developer", "Backend Engineer"]
    )
    db.add(candidate_profile)
    db.flush()

    # 4. Seed Sample Resume for Candidate
    sample_resume_text = """Alex Rivera
San Francisco, CA | alex@developer.io | (555) 234-5678 | https://github.com/alexrivera-dev

PROFESSIONAL SUMMARY
Results-driven Full-Stack Software Engineer with 3+ years of experience designing scalable web applications and high-throughput REST APIs. Proven expertise in React, TypeScript, Python, FastAPI, and PostgreSQL. Experienced in containerized cloud deployments using Docker and CI/CD pipelines.

CORE TECHNICAL SKILLS
- Programming Languages: Python, JavaScript, TypeScript, SQL, HTML5, CSS3
- Frameworks & Libraries: React, Node.js, FastAPI, Express.js, Tailwind CSS
- Databases & Storage: PostgreSQL, Redis, SQLite
- Cloud & Tools: Docker, Git, GitHub Actions, Linux, REST APIs, Microservices

WORK EXPERIENCE
Software Engineer | Apex Solutions | 2023 - Present
- Designed and maintained REST APIs using FastAPI and PostgreSQL handling 2M+ monthly requests with <50ms response latency.
- Built responsive client-facing dashboards using React 18 and Tailwind CSS, improving user session length by 28%.
- Integrated Redis caching layer for session management and database query offloading.
- Configured automated test suites with Pytest achieving 85% code coverage.

Junior Developer | InnoTech Systems | 2021 - 2023
- Developed reusable UI components using React and TypeScript.
- Collaborated in an Agile Scrum squad of 7 engineers delivering bi-weekly production releases.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2017 - 2021

PROJECTS
TaskFlow Distributed Queue: Built asynchronous worker queue in Python and Redis with Docker Compose orchestration.
E-Commerce Analytics Hub: Real-time sales telemetry dashboard built in React, Node.js, and PostgreSQL.
"""

    parsed_sample_data = {
        "candidate_name": "Alex Rivera",
        "email": "alex@developer.io",
        "phone": "(555) 234-5678",
        "summary": "Results-driven Full-Stack Software Engineer with 3+ years of experience designing scalable web applications and high-throughput REST APIs.",
        "skills": [
            {"name": "Python", "category": "Programming Languages", "proficiency": "Proficient", "confidence": 0.98},
            {"name": "JavaScript", "category": "Programming Languages", "proficiency": "Proficient", "confidence": 0.98},
            {"name": "TypeScript", "category": "Programming Languages", "proficiency": "Proficient", "confidence": 0.95},
            {"name": "SQL", "category": "Programming Languages", "proficiency": "Proficient", "confidence": 0.95},
            {"name": "React", "category": "Frameworks & Libraries", "proficiency": "Proficient", "confidence": 0.98},
            {"name": "Node.js", "category": "Frameworks & Libraries", "proficiency": "Proficient", "confidence": 0.92},
            {"name": "FastAPI", "category": "Frameworks & Libraries", "proficiency": "Proficient", "confidence": 0.96},
            {"name": "Tailwind CSS", "category": "Frameworks & Libraries", "proficiency": "Proficient", "confidence": 0.90},
            {"name": "PostgreSQL", "category": "Databases & Caching", "proficiency": "Proficient", "confidence": 0.96},
            {"name": "Redis", "category": "Databases & Caching", "proficiency": "Proficient", "confidence": 0.90},
            {"name": "Docker", "category": "Cloud & DevOps", "proficiency": "Intermediate", "confidence": 0.88},
            {"name": "Git", "category": "Cloud & DevOps", "proficiency": "Proficient", "confidence": 0.95},
            {"name": "REST APIs", "category": "Architecture & Methodologies", "proficiency": "Proficient", "confidence": 0.98}
        ],
        "technical_categories": {
            "Programming Languages": ["Python", "JavaScript", "TypeScript", "SQL"],
            "Frameworks & Libraries": ["React", "Node.js", "FastAPI", "Tailwind CSS"],
            "Databases & Caching": ["PostgreSQL", "Redis"],
            "Cloud & DevOps": ["Docker", "Git"],
            "Architecture & Methodologies": ["REST APIs"]
        },
        "education": [
            {"degree": "Bachelor of Science in Computer Science", "institution": "University of California, Berkeley", "year": "2021"}
        ],
        "experience": [
            {"role": "Software Engineer", "company": "Apex Solutions", "duration": "2023 - Present"},
            {"role": "Junior Developer", "company": "InnoTech Systems", "duration": "2021 - 2023"}
        ],
        "projects": [
            {"title": "TaskFlow Distributed Queue", "description": "Built asynchronous worker queue in Python and Redis with Docker Compose orchestration."},
            {"title": "E-Commerce Analytics Hub", "description": "Real-time sales telemetry dashboard built in React, Node.js, and PostgreSQL."}
        ],
        "completeness_score": 95.0,
        "completeness_breakdown": {
            "has_contact_info": True,
            "has_summary": True,
            "has_skills": True,
            "has_education": True,
            "has_experience": True,
            "has_projects": True
        },
        "improvement_suggestions": [
            "Highlight experience with cloud platforms like AWS or GCP for higher senior role visibility.",
            "Add public demo links for your showcased projects."
        ]
    }

    sample_resume = Resume(
        candidate_id=candidate_profile.id,
        filename="Alex_Rivera_Resume_2026.pdf",
        file_path="uploads/sample_alex_rivera.pdf",
        file_size=145200,
        file_type="application/pdf",
        raw_text=sample_resume_text,
        parsed_data=parsed_sample_data,
        completeness_score=95.0,
        is_primary=True
    )
    db.add(sample_resume)
    db.flush()

    for s in parsed_sample_data["skills"]:
        db.add(ExtractedResumeSkill(
            resume_id=sample_resume.id,
            skill_name=s["name"],
            category=s["category"],
            proficiency=s["proficiency"],
            confidence=s["confidence"]
        ))

    # 5. Seed Realistic Job Listings
    jobs_data = [
        {
            "title": "Senior Full-Stack Engineer",
            "company": "CloudScale Technologies",
            "location": "Remote / New York, NY",
            "job_type": "Full-time",
            "experience_level": "Senior",
            "salary_range": "$140,000 - $185,000",
            "description": "We are seeking a Senior Full-Stack Engineer to lead the architecture of our cloud telemetry platform. You will build high-performance React frontends and asynchronous FastAPI/Python microservices backed by PostgreSQL and Redis. Experience with Docker containerization and Kubernetes orchestration is strongly desired.",
            "requirements": "Bachelor's degree in CS or equivalent. 4+ years building production full-stack systems. Deep expertise in React, TypeScript, Python, and PostgreSQL.",
            "required_skills": ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL"],
            "preferred_skills": ["Docker", "Kubernetes", "Redis", "AWS"]
        },
        {
            "title": "Backend Systems Engineer",
            "company": "FinPulse Global",
            "location": "San Francisco, CA (Hybrid)",
            "job_type": "Full-time",
            "experience_level": "Mid-level",
            "salary_range": "$125,000 - $160,000",
            "description": "FinPulse is building the next-generation financial settlement gateway. We need a Backend Systems Engineer to architect resilient REST APIs, event-driven pipelines, and database query optimizations using Python, PostgreSQL, Redis, and Docker.",
            "requirements": "Strong foundation in data structures, relational database modeling, and microservices architecture.",
            "required_skills": ["Python", "PostgreSQL", "Redis", "REST APIs", "Docker"],
            "preferred_skills": ["Kubernetes", "AWS", "CI/CD", "Unit Testing"]
        },
        {
            "title": "AI & NLP Platform Engineer",
            "company": "NeuralForge AI",
            "location": "Remote",
            "job_type": "Full-time",
            "experience_level": "Mid-level",
            "salary_range": "$135,000 - $175,000",
            "description": "NeuralForge powers enterprise semantic intelligence. As an AI Platform Engineer, you will build Retrieval-Augmented Generation (RAG) pipelines, vector search integrations, and fine-tuned embeddings using Python, PyTorch, LangChain, and FastAPI.",
            "requirements": "Hands-on experience with NLP pipelines, vector databases, and LLM orchestration frameworks.",
            "required_skills": ["Python", "FastAPI", "Machine Learning", "RAG", "Vector Databases"],
            "preferred_skills": ["PyTorch", "Docker", "PostgreSQL", "LangChain"]
        },
        {
            "title": "Frontend UI/UX Developer",
            "company": "Streamline Design",
            "location": "Austin, TX (Remote)",
            "job_type": "Full-time",
            "experience_level": "Mid-level",
            "salary_range": "$110,000 - $145,000",
            "description": "Streamline creates design system tooling for over 500 tech companies. We are hiring a Frontend Specialist to develop accessible, fluid components using React, TypeScript, Next.js, and Tailwind CSS.",
            "requirements": "Proficiency in modern JavaScript/TypeScript, CSS grid/flexbox, state management, and web performance profiling.",
            "required_skills": ["React", "TypeScript", "Tailwind CSS", "JavaScript", "HTML5"],
            "preferred_skills": ["Next.js", "GraphQL", "Unit Testing"]
        }
    ]

    for jd in jobs_data:
        job_obj = Job(
            recruiter_id=recruiter_profile.id,
            title=jd["title"],
            company=jd["company"],
            location=jd["location"],
            job_type=jd["job_type"],
            experience_level=jd["experience_level"],
            salary_range=jd["salary_range"],
            description=jd["description"],
            requirements=jd["requirements"],
            required_skills=jd["required_skills"],
            preferred_skills=jd["preferred_skills"],
            status="Active"
        )
        db.add(job_obj)
        db.flush()

        # Seed initial application for Alex on Senior Full-Stack Engineer
        if jd["title"] == "Senior Full-Stack Engineer":
            app = JobApplication(
                job_id=job_obj.id,
                candidate_id=candidate_profile.id,
                resume_id=sample_resume.id,
                status=ApplicationStatus.SHORTLISTED,
                match_score=87.5,
                recruiter_notes="Strong technical profile with excellent React and FastAPI foundation. Candidate recommended for initial technical screening."
            )
            db.add(app)

        # Index in RAG
        RAGEngine.index_document(
            db,
            doc_type="job_description",
            title=f"{job_obj.title} at {job_obj.company}",
            text=f"{job_obj.title} ({job_obj.company})\n{job_obj.description}\nRequired: {', '.join(job_obj.required_skills or [])}",
            metadata={"is_private": False, "job_id": job_obj.id}
        )

    # 6. Seed Verified Learning Resources
    for skill_name, rdata in VERIFIED_RESOURCES.items():
        db.add(LearningResource(
            skill_name=skill_name,
            title=rdata["title"],
            url=rdata["url"],
            resource_type=rdata["resource_type"],
            provider=rdata["provider"],
            difficulty=rdata["difficulty"],
            description=rdata["description"]
        ))

    # 7. Seed Curated Platform Career Documents for RAG
    career_guides = [
        (
            "Resume Engineering Best Practices",
            "Effective technical resumes focus on verifiable engineering impact. Use the Google XYZ formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Keep code repositories clean, write clear README files, and avoid listing technologies without substantiating project context."
        ),
        (
            "Full-Stack Technical Interview Mastery",
            "In system design and technical screenings, start by clarifying requirements and non-functional constraints (concurrency, latency, availability). Explicitly discuss trade-offs between SQL vs NoSQL, synchronous vs asynchronous communication, and caching strategies."
        ),
        (
            "Modern ATS Keyword Alignment Standards",
            "Applicant Tracking Systems parse standard headings such as Experience, Skills, Education, and Projects. Never place critical contact or technical information inside header/footer tables or image text. Ensure standard casing for acronyms (e.g. AWS, CI/CD, SQL)."
        )
    ]

    for title, guide_text in career_guides:
        RAGEngine.index_document(
            db,
            doc_type="guide",
            title=title,
            text=guide_text,
            metadata={"is_private": False, "category": "Career Guide"}
        )

    db.commit()
    print("Seed data successfully initialized!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
