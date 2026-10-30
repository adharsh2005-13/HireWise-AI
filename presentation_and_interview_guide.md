# HireWise AI — College Presentation, Placement Interview & Demo Guide

This document contains a structured presentation script, architecture defense, and technical interview questions & answers to prepare for college capstone evaluations or software engineering placement interviews.

---

## 🎤 Part 1: Project Presentation Outline (5-10 Minutes)

### Slide 1: Title & Vision
- **Project Name**: HireWise AI — Full-Stack AI-Powered Recruitment & Career Intelligence Platform
- **Tagline**: Bridging Candidates and Employers with Explainable AI and Ethical Matching
- **Presenter**: Senior Full-Stack Engineering Candidate

### Slide 2: The Problem
1. **Black-box ATS Systems**: 75% of qualified resumes are rejected by traditional keyword filters without explanation.
2. **Unclear Rejection Reasons**: Candidates receive generic rejection emails without guidance on missing skills.
3. **Recruiter Fatigue**: Recruiters review hundreds of resumes manually without objective qualification synthesis.
4. **Algorithmic Bias**: Unchecked AI models risk discriminating against demographic attributes.

### Slide 3: The HireWise Solution
- **Transparent 0–100 Multi-Factor Scoring**: Clearly explains why a candidate matched (40% required, 30% semantic, 20% experience, 10% preferred).
- **Automated NLP Pipeline**: Extracts technical skills, projects, and calculates a completeness score for PDF & DOCX resumes.
- **RAG Career Advisor**: Grounded in verified career guides with explicit citations.
- **AI Interview Practice**: Role-tailored mock questions with rubric evaluations.
- **Recruitment Summary Agent**: Synthesizes qualifications for recruiters while strictly ignoring protected demographics.

### Slide 4: System Architecture
- **Frontend**: Vite + React 19 + TypeScript + Custom Responsive CSS Design System + Recharts.
- **Backend**: FastAPI + Python + Pydantic v2 + SQLAlchemy ORM.
- **Database**: SQLite (local) / PostgreSQL with pgvector (production).
- **Security**: BCrypt salt hashing, PyJWT authentication with RBAC.

### Slide 5: Live Demonstration Workflow
1. Log in as Candidate Alex Rivera.
2. Review extracted resume skills & completeness score.
3. Inspect job recommendations and examine the explainable match score breakdown.
4. View identified skill gaps and verified documentation links.
5. Practice a mock interview question and receive rubric feedback.
6. Switch to Recruiter Sarah Jenkins and demonstrate the pipeline & AI Recruitment Summary.
7. Switch to Administrator and showcase platform analytics & audit logs.

---

## 🎬 Part 2: Step-by-Step Live Demo Script

| Step | Action | What to Explain to Judges / Interviewers |
|---|---|---|
| **1** | Open `http://localhost:5173` | *"Here is the landing page highlighting our modern dark-mode aesthetic and core value proposition."* |
| **2** | Click **Sign In** → Click **Candidate** Auto-fill | *"We have pre-seeded realistic test accounts. We log in as Alex Rivera, a 3-year full-stack developer."* |
| **3** | View **Candidate Dashboard** | *"The dashboard shows active resumes, overall match percentage across jobs, and top recommended openings."* |
| **4** | Click **Resume Analysis** | *"Our NLP parser extracts skills into 6 canonical categories, validates education and projects, and calculates an ATS completeness score."* |
| **5** | Click **Job Discovery** → Select **Senior Full-Stack Engineer** | *"The matching engine calculates an 87.5% match score. Let's click 'Score Breakdown'."* |
| **6** | Inspect **Job Match Explanation** | *"Notice how the score is broken down: 40% required skills, 30% semantic cosine similarity, 20% experience, 10% preferred skills. Notice the compliance disclaimer ensuring fair hiring."* |
| **7** | Click **Skill Gaps** | *"Here is our targeted skill gap analysis. Candidates see missing skills like Docker or Kubernetes alongside official documentation links and portfolio project architectures."* |
| **8** | Click **Interview Prep** | *"Candidates can select their role, generate technical and HR questions, submit answers, and receive rubric feedback on relevance, correctness, and problem-solving."* |
| **9** | Click **AI Career Assistant** | *"Our RAG assistant grounds responses in authorized platform guidelines with citations and clearly states deterministic mode if no external LLM key is configured."* |
| **10** | Logout → Sign in as **Recruiter** | *"Recruiters can post jobs, define mandatory vs preferred skills, and review applicants. The AI Recruitment Summary gives recruiters an evidence-based synthesis without demographic bias."* |
| **11** | Logout → Sign in as **Admin** | *"Administrators have platform-wide telemetry, skill demand charts using Recharts, and tamper-evident audit logs."* |

---

## 💡 Part 3: Placement Interview Q&A (Technical Defense)

### Q1: How does your resume parser extract skills without missing complex names like "C++" or "Node.js"?
> **Answer**: Standard whitespace splitters fail on terms like "C++" or ".NET". Our `NLPExtractor` uses word-boundary regexes with punctuation lookarounds and regex escaping (`re.escape`). We maintain a comprehensive inverted index mapping canonical skill names to categories, ensuring case-insensitive detection while preserving official capitalization.

### Q2: Why did you choose a 40/30/20/10 multi-factor formula instead of purely relying on LLMs?
> **Answer**: LLM outputs can hallucinate scores, are nondeterministic, and can introduce subtle demographic biases. By using an explainable mathematical formula (40% required skill overlap, 30% vector cosine similarity, 20% experience/projects, and 10% preferred skills), we ensure 100% determinism, explainability, auditability, and speed (<10ms per calculation).

### Q3: How does your RAG system prevent data leakage between different candidates?
> **Answer**: In `RAGEngine`, each chunk stores a metadata payload with `is_private` and `owner_user_id`. When querying the vector store, our retrieval filter checks the authenticated user's ID against the document owner. Public career guides and job descriptions are accessible to all, but resumes are strictly isolated to their respective owners and authorized recruiters of that specific job.

### Q4: How is security handled for passwords and API endpoints?
> **Answer**: Passwords are never stored as plaintext. We use `bcrypt` with work factor salt rounds (12) directly. Authentication uses JWT tokens signed with HMAC-SHA256 containing expiration timestamps and role claims. FastAPI dependency injection (`get_current_user`, `require_roles`) enforces role-based access control (RBAC) on every endpoint.

### Q5: How do you handle cases where no external LLM API key is provided?
> **Answer**: Per software engineering best practices, we designed a replaceable provider adapter interface (`LLMProviderInterface`). When no API key is configured, the application smoothly invokes `FallbackDeterministicProvider`, which applies rule-based intent routing and RAG context grounding, while explicitly setting `is_fallback: True` in the API response so the user is never deceived.
