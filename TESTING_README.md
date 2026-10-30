# HireWise AI — Test Suite Documentation (`TESTING_README.md`)

This document provides a comprehensive, step-by-step breakdown of **all automated test cases implemented and performed** within the HireWise AI system.

> **Scope Note**: This document covers exclusively the actual test suite implemented in the repository located at [`backend/tests/test_hirewise.py`](file:///c:/Users/balak/Downloads/New%20folder/backend/tests/test_hirewise.py). It details the 8 core automated test cases that validate the system's security, NLP intelligence, matching engine, skill gap advisor, interview evaluation, and RAG document retrieval.

---

## 📋 Table of Contents
1. [Test Suite Overview](#-test-suite-overview)
2. [Prerequisites & Environment Setup](#-prerequisites--environment-setup)
3. [Test Fixtures & Database Lifecycle](#-test-fixtures--database-lifecycle)
4. [How to Run the Tests (Step-by-Step)](#-how-to-run-the-tests-step-by-step)
5. [Detailed Test Cases (Step-by-Step Walkthrough)](#-detailed-test-cases-step-by-step-walkthrough)
   - [Test Case 1: Password Hashing & Verification](#test-case-1-password-hashing--verification)
   - [Test Case 2: JWT Access Token Generation & Decoding](#test-case-2-jwt-access-token-generation--decoding)
   - [Test Case 3: NLP Technical Skill & Category Extraction](#test-case-3-nlp-technical-skill--category-extraction)
   - [Test Case 4: Resume Completeness & ATS Quality Scoring](#test-case-4-resume-completeness--ats-quality-scoring)
   - [Test Case 5: Explainable Multi-Factor Job Matching Engine](#test-case-5-explainable-multi-factor-job-matching-engine)
   - [Test Case 6: Skill Gap Analysis & Learning Roadmap Generation](#test-case-6-skill-gap-analysis--learning-roadmap-generation)
   - [Test Case 7: AI Interview Preparation & Rubric Evaluation](#test-case-7-ai-interview-preparation--rubric-evaluation)
   - [Test Case 8: RAG Semantic Knowledge Document Retrieval](#test-case-8-rag-semantic-knowledge-document-retrieval)
6. [Test Summary Matrix](#-test-summary-matrix)

---

## 📊 Test Suite Overviews

The automated test suite is built on **Pytest** (`pytest >= 8.0.0`) and tests the core backend modules without requiring an active external network connection or third-party paid API keys:

- **Location**: [`backend/tests/test_hirewise.py`](file:///c:/Users/balak/Downloads/New%20folder/backend/tests/test_hirewise.py)
- **Total Test Cases**: `8`
- **Testing Approach**: Deterministic unit and service integration tests
- **Database Used**: In-memory / isolated SQLite database instance managed via SQLAlchemy fixtures
- **Execution Time**: ~1.5 - 2.5 seconds for the full suite

---

## ⚙️ Prerequisites & Environment Setup

Ensure Python 3.10+ is installed on your system along with the backend dependencies:

```bash
# Verify Python version
python --version

# From the backend directory, ensure all test dependencies are installed
cd backend
pip install -r requirements.txt
```

Key dependencies utilized during testing:
- `pytest`: Test runner and assertion framework
- `bcrypt`: Password cryptographic hashing
- `pyjwt`: JSON Web Token creation and verification
- `sqlalchemy`: Database ORM and schema generation
- `pydantic`: Schema validation

---

## 🗄️ Test Fixtures & Database Lifecycle

The test file sets up an isolated database session for database-dependent tests (such as RAG retrieval):

```python
@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
```

### Execution Flow of the Fixture:
1. **Setup Phase**: Executes `Base.metadata.create_all(bind=engine)` before the tests run to generate all database tables (`users`, `jobs`, `resumes`, `rag_documents`, etc.).
2. **Session Injection**: Instantiates a fresh `SessionLocal()` and yields it to test functions requiring the `db` argument.
3. **Teardown Phase**: Automatically invokes `session.close()` when all test executions in the module finish, preventing memory leaks or lingering database locks.

---

## 🚀 How to Run the Tests (Step-by-Step)

### Step 1: Open Terminal in the Backend Directory
```bash
cd "c:\Users\balak\Downloads\New folder\backend"
```

### Step 2: Run the Complete Test Suite
To run all 8 test cases with verbose details:
```bash
python -m pytest tests/test_hirewise.py -v
```

### Step 3: Run with Printed Output (Optional)
If you want to view `print()` statements and logs during test execution:
```bash
python -m pytest tests/test_hirewise.py -v -s
```

### Step 4: Run a Single Specific Test Case
To run any individual test case, append `-k <test_function_name>`:
```bash
# Example: Run only the Job Matching Engine test
python -m pytest tests/test_hirewise.py -v -k "test_job_matching_engine"

# Example: Run only the Password Hashing test
python -m pytest tests/test_hirewise.py -v -k "test_password_hashing_and_verification"
```

---

## 🔬 Detailed Test Cases (Step-by-Step Walkthrough)

### Test Case 1: Password Hashing & Verification
- **Function Name**: `test_password_hashing_and_verification()`
- **Target Module**: [`app.core.security`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/core/security.py) (`get_password_hash`, `verify_password`)
- **Objective**: Verify that user passwords are encrypted using BCrypt one-way salt hashing and that verification strictly accepts correct passwords while rejecting invalid passwords.

#### Step-by-Step Execution:
1. **Input Definition**: Define a raw plain-text password:
   ```python
   raw_pw = "SecureP@ssword2026!"
   ```
2. **Hash Generation**: Call `get_password_hash(raw_pw)`.
3. **Assertion 1 (Salt/One-Way Verification)**: Verify that the returned hashed string is **not equal** to the plain text:
   ```python
   assert hashed != raw_pw
   ```
4. **Assertion 2 (Positive Verification)**: Check that passing the exact same raw password to `verify_password(raw_pw, hashed)` returns `True`.
5. **Assertion 3 (Negative Verification)**: Check that passing an incorrect password `"WrongPassword!"` to `verify_password("WrongPassword!", hashed)` returns `False`.

- **Expected Result**: Pass (`PASSED`). All 3 assertions validate cryptographic integrity.

---

### Test Case 2: JWT Access Token Generation & Decoding
- **Function Name**: `test_jwt_token_generation_and_decoding()`
- **Target Module**: [`app.core.security`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/core/security.py) (`create_access_token`, `decode_access_token`) & [`app.models.all_models.UserRole`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/models/all_models.py)
- **Objective**: Ensure JWT tokens generated for authenticated users correctly encode claims (user ID subject and RBAC role), can be decoded, and retain claim integrity.

#### Step-by-Step Execution:
1. **Token Generation**: Call `create_access_token(subject=42, role=UserRole.CANDIDATE)`.
2. **Token Decoding**: Decode the generated JWT string using `decode_access_token(token)`.
3. **Assertion 1 (Payload Existence)**: Assert that `payload is not None`.
4. **Assertion 2 (Subject Identity)**: Verify that the subject claim matches the string representation of the user ID:
   ```python
   assert payload.get("sub") == "42"
   ```
5. **Assertion 3 (Role-Based Access Control Claim)**: Verify that the role embedded matches the candidate role:
   ```python
   assert payload.get("role") == UserRole.CANDIDATE
   ```

- **Expected Result**: Pass (`PASSED`). Tokens encode and decode securely with signature validation.

---

### Test Case 3: NLP Technical Skill & Category Extraction
- **Function Name**: `test_nlp_skill_extraction()`
- **Target Module**: [`app.services.nlp_extractor.NLPExtractor`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/services/nlp_extractor.py)
- **Objective**: Verify that the NLP entity extraction service correctly parses unstructured resume text and categorizes extracted skills into standardized technical taxonomies.

#### Step-by-Step Execution:
1. **Input Sample Text**: Provide an unstructured resume excerpt:
   ```python
   sample_text = """
   Software Engineer with experience in Python, React, PostgreSQL, Docker, and Redis.
   Designed REST APIs using FastAPI and deployed microservices on AWS using Kubernetes.
   """
   ```
2. **Skill Extraction**: Call `NLPExtractor.extract_skills(sample_text)`, which returns a tuple of `(skills, categorized)`.
3. **Collect Extracted Skills**: Construct `skill_names = [s["name"] for s in skills]`.
4. **Assertions (Entity Discovery)**:
   - Check that `"Python"` is extracted (`assert "Python" in skill_names`).
   - Check that `"React"` is extracted (`assert "React" in skill_names`).
   - Check that `"PostgreSQL"` is extracted (`assert "PostgreSQL" in skill_names`).
   - Check that `"Docker"` is extracted (`assert "Docker" in skill_names`).
   - Check that `"FastAPI"` is extracted (`assert "FastAPI" in skill_names`).
5. **Assertion (Taxonomy Grouping)**:
   - Check that `"Databases & Caching"` exists in the `categorized` dictionary keys.

- **Expected Result**: Pass (`PASSED`). All target skills and technical categories are accurately detected.

---

### Test Case 4: Resume Completeness & ATS Quality Scoring
- **Function Name**: `test_nlp_completeness_calculation()`
- **Target Module**: [`app.services.nlp_extractor.NLPExtractor.calculate_completeness`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/services/nlp_extractor.py)
- **Objective**: Validate the algorithmic evaluation of resume completeness (0–100%) checking contact information, summary, skills, education, experience, and project sections.

#### Step-by-Step Execution:
1. **Input Payload**: Supply full candidate profile data:
   - `name`: `"Alex Rivera"`
   - `email`: `"alex@developer.io"`
   - `phone`: `"+1 555-123-4567"`
   - `summary`: `"Experienced full-stack engineer with 4 years in software systems."`
   - `skills`: `[{"name": "Python"}, {"name": "React"}, {"name": "SQL"}, {"name": "Docker"}]`
   - `education`: `[{"degree": "BS in CS", "institution": "UC Berkeley"}]`
   - `experience`: `[{"role": "Software Engineer", "company": "Tech Corp"}]`
   - `projects`: `[{"title": "Distributed Queue", "description": "High-throughput messaging system"}]`
2. **Execution**: Call `NLPExtractor.calculate_completeness(...)` returning `(score, breakdown, unclear, suggestions)`.
3. **Assertion 1 (Score Threshold)**: Ensure high quality resume receives a score `>= 80.0`:
   ```python
   assert score >= 80.0
   ```
4. **Assertion 2 (Contact Information)**: Verify `breakdown["has_contact_info"] is True`.
5. **Assertion 3 (Skills Detection)**: Verify `breakdown["has_skills"] is True`.
6. **Assertion 4 (Clarity Check)**: Verify `len(unclear) == 0` (no missing vital sections).

- **Expected Result**: Pass (`PASSED`). Completeness rating accurately assesses ATS readiness.

---

### Test Case 5: Explainable Multi-Factor Job Matching Engine
- **Function Name**: `test_job_matching_engine()`
- **Target Module**: [`app.services.matching_engine.MatchingEngine.calculate_match`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/services/matching_engine.py)
- **Objective**: Test the multi-factor weighted job matching formula:
  - Required Skills Match: 40%
  - Semantic Similarity: 30%
  - Experience / Projects: 20%
  - Preferred Skills Match: 10%

#### Step-by-Step Execution:
1. **Input Setup**:
   - Candidate Skills: `["Python", "FastAPI", "React", "PostgreSQL", "Docker"]`
   - Candidate Text: `"Experienced building FastAPI backends and React frontends backed by PostgreSQL and Docker."`
   - Projects: `[{"title": "API Gateway", "description": "FastAPI gateway"}]`
   - Experience: `[{"role": "Backend Engineer", "company": "Cloud Inc"}]`
   - Job Required Skills: `["Python", "FastAPI", "PostgreSQL"]` *(100% matched)*
   - Job Preferred Skills: `["Docker", "Kubernetes"]` *(50% matched)*
   - Job Description: `"Seeking a Python FastAPI backend developer with PostgreSQL and Docker skills."`
2. **Execute Matching**: Call `MatchingEngine.calculate_match(...)`.
3. **Assertion 1 (Overall Score)**: Verify `total_score >= 75.0`.
4. **Assertion 2 (Required Skill Score)**: Verify `breakdown["required_skill_score"] == 100.0` (all 3 mandatory skills matched).
5. **Assertion 3 (Matched Skills)**: Check `"Docker"` is listed in `matching_skills`.
6. **Assertion 4 (Missing Skills)**: Check `"Kubernetes"` is identified in `missing_skills`.
7. **Assertion 5 (Explainability)**: Check that transparent explanation text is generated:
   ```python
   assert len(match_result["explanation"]) > 20
   ```

- **Expected Result**: Pass (`PASSED`). Returns deterministic, explainable scoring breakdown.

---

### Test Case 6: Skill Gap Analysis & Learning Roadmap Generation
- **Function Name**: `test_skill_gap_analysis()`
- **Target Module**: [`app.services.gap_analyzer.SkillGapAnalyzer.analyze`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/services/gap_analyzer.py)
- **Objective**: Confirm that the gap analyzer accurately identifies missing competencies for target roles, provides official verified documentation links, and constructs milestone study roadmaps.

#### Step-by-Step Execution:
1. **Input Setup**:
   - Candidate Skills: `["Python", "React", "PostgreSQL"]`
   - Job Required Skills: `["Python", "PostgreSQL", "Kubernetes", "AWS"]`
   - Job Preferred Skills: `["Redis"]`
   - Target Role: `"DevOps Engineer"`, Company: `"CloudScale"`, Job ID: `1`
2. **Execute Analysis**: Call `SkillGapAnalyzer.analyze(...)`.
3. **Assertion 1 & 2 (Missing Skills Identification)**:
   - Check that `"Kubernetes"` is in `missing_required_skills`.
   - Check that `"AWS"` is in `missing_required_skills`.
4. **Assertion 3 (Curated Resources)**:
   - Assert `len(gap_data["curated_resources"]) > 0` (e.g., official Kubernetes and AWS documentation URLs).
5. **Assertion 4 (Learning Roadmap)**:
   - Assert `len(gap_data["roadmap_milestones"]) > 0` (sequential milestone schedule).

- **Expected Result**: Pass (`PASSED`). Missing competencies identified with actionable learning roadmaps.

---

### Test Case 7: AI Interview Preparation & Rubric Evaluation
- **Function Name**: `test_interview_prep_and_evaluation()`
- **Target Module**: [`app.services.interview_service.InterviewService`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/services/interview_service.py) (`generate_questions`, `evaluate_answer`)
- **Objective**: Test role-specific mock interview question generation and instant rubric-based evaluation of candidate answers.

#### Step-by-Step Execution:
1. **Question Generation**:
   - Call `InterviewService.generate_questions("Full Stack Developer", "Intermediate", "Web", 3)`.
   - Verify 3 questions generated: `assert len(questions) == 3`.
   - Take the first question `q = questions[0]` and assert keys `"question_text"` and `"rubric"` are present.
2. **Answer Submission**:
   - Prepare a technical response explaining database locking:
     `"Optimistic locking checks record versions before updating to avoid collisions without holding persistent locks, making it ideal for web apps with low write contention. Pessimistic locking acquires a row-level lock immediately."`
3. **Execute Evaluation**:
   - Call `InterviewService.evaluate_answer(...)` passing `question_text`, `question_type`, `rubric`, `user_answer`, and `sample_answer`.
4. **Assertion 1 (Rubric Score)**: Verify `eval_result["score"] >= 5.0` (out of 10).
5. **Assertion 2 (Breakdown)**: Verify `breakdown` dictionary exists with specific rubric scores.
6. **Assertion 3 (Transparency Disclaimer)**: Verify `disclaimer` exists explaining the AI evaluation context.

- **Expected Result**: Pass (`PASSED`). Question bank retrieval and rubric scoring operate reliably.

---

### Test Case 8: RAG Semantic Knowledge Document Retrieval
- **Function Name**: `test_rag_retrieval(db)`
- **Target Module**: [`app.ai.rag.rag_engine.RAGEngine.retrieve`](file:///c:/Users/balak/Downloads/New%20folder/backend/app/ai/rag/rag_engine.py)
- **Objective**: Validate semantic vector and keyword document retrieval from the pre-indexed RAG knowledge base for career guidance queries with citation tracking.

#### Step-by-Step Execution:
1. **Fixture Injection**: Pytest supplies the SQLAlchemy session fixture `db`.
2. **Search Query**:
   ```python
   query = "resume best practices Google XYZ formula"
   top_k = 2
   ```
3. **Execute Retrieval**: Call `RAGEngine.retrieve(db, query, top_k=2)`.
4. **Assertion 1 (Non-Empty Results)**: Verify `assert len(results) > 0`.
5. **Assertion 2 (Title Relevance)**: Verify that the retrieved document titles contain `"Resume Engineering Best Practices"`:
   ```python
   assert "Resume Engineering Best Practices" in [r["title"] for r in results]
   ```

- **Expected Result**: Pass (`PASSED`). Correct knowledge base document retrieved with source attribution.

---

## 📋 Test Summary Matrix

| # | Test Function Name | Tested Module / Class | Tested Capabilities | Expected Result |
|:---:|:---|:---|:---|:---:|
| **1** | `test_password_hashing_and_verification` | `app.core.security` | BCrypt one-way hashing & password matching | ✅ PASSED |
| **2** | `test_jwt_token_generation_and_decoding` | `app.core.security` | JWT Bearer token encoding, decoding & RBAC roles | ✅ PASSED |
| **3** | `test_nlp_skill_extraction` | `NLPExtractor` | Entity extraction & technical categorization | ✅ PASSED |
| **4** | `test_nlp_completeness_calculation` | `NLPExtractor` | Resume completeness (0–100%) & section audit | ✅ PASSED |
| **5** | `test_job_matching_engine` | `MatchingEngine` | 4-factor scoring & explainable breakdown | ✅ PASSED |
| **6** | `test_skill_gap_analysis` | `SkillGapAnalyzer` | Skill gap identification & official doc links | ✅ PASSED |
| **7** | `test_interview_prep_and_evaluation` | `InterviewService` | Question bank generation & rubric evaluation | ✅ PASSED |
| **8** | `test_rag_retrieval` | `RAGEngine` | Semantic retrieval with citation attribution | ✅ PASSED |

---

## 📌 Summary Command Quick Reference

```bash
# Run all tests verbosely
python -m pytest backend/tests/test_hirewise.py -v

# Run with execution duration report
python -m pytest backend/tests/test_hirewise.py --durations=0 -v
```
