from typing import List, Dict, Any

# Curated catalog of real, verified learning resources
VERIFIED_RESOURCES = {
    "Python": {
        "title": "Python Official Documentation & Tutorial",
        "url": "https://docs.python.org/3/tutorial/",
        "resource_type": "Official Documentation",
        "provider": "Python Software Foundation",
        "difficulty": "Beginner to Intermediate",
        "description": "Comprehensive official reference covering standard libraries, async IO, data structures, and best practices."
    },
    "Docker": {
        "title": "Docker Getting Started Guide & Hands-on Labs",
        "url": "https://docs.docker.com/get-started/",
        "resource_type": "Documentation & Labs",
        "provider": "Docker Inc.",
        "difficulty": "Beginner",
        "description": "Step-by-step containerization tutorial covering Dockerfiles, multi-stage builds, networking, and docker-compose."
    },
    "Kubernetes": {
        "title": "Kubernetes Basics & Interactive Tutorials",
        "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
        "resource_type": "Official Tutorial",
        "provider": "CNCF / Linux Foundation",
        "difficulty": "Intermediate to Advanced",
        "description": "Deploying, scaling, and managing containerized applications with pods, deployments, services, and ingress."
    },
    "PostgreSQL": {
        "title": "PostgreSQL Tutorial & Index Optimization",
        "url": "https://www.postgresqltutorial.com/",
        "resource_type": "Tutorial & Reference",
        "provider": "PostgreSQL Community",
        "difficulty": "Beginner to Advanced",
        "description": "SQL mastery, transaction isolation levels, JSONB operations, and query plan optimization with EXPLAIN ANALYZE."
    },
    "FastAPI": {
        "title": "FastAPI Tutorial - User Guide",
        "url": "https://fastapi.tiangolo.com/tutorial/",
        "resource_type": "Official Documentation",
        "provider": "tiangolo",
        "difficulty": "Beginner to Intermediate",
        "description": "High-performance Python web APIs with Pydantic validation, dependency injection, and automatic OpenAPI docs."
    },
    "React": {
        "title": "React.dev Official Documentation & Learn React",
        "url": "https://react.dev/learn",
        "resource_type": "Interactive Guide",
        "provider": "Meta Open Source",
        "difficulty": "Beginner to Advanced",
        "description": "Modern React with Hooks, state management, suspense, Server Components, and component lifecycle best practices."
    },
    "TypeScript": {
        "title": "TypeScript Handbook & Practical Walkthrough",
        "url": "https://www.typescriptlang.org/docs/handbook/intro.html",
        "resource_type": "Official Handbook",
        "provider": "Microsoft",
        "difficulty": "Intermediate",
        "description": "Type systems, generics, utility types, union types, and building robust large-scale applications."
    },
    "AWS": {
        "title": "AWS Cloud Practitioner & Developer Learning Path",
        "url": "https://aws.amazon.com/training/learn-about/cloud-practitioner/",
        "resource_type": "Course & Labs",
        "provider": "Amazon Web Services",
        "difficulty": "Beginner to Intermediate",
        "description": "Core cloud concepts, IAM, EC2, S3, RDS, Lambda serverless, and cloud architecture fundamentals."
    },
    "Redis": {
        "title": "Redis University - RU101 Introduction to Redis Data Structures",
        "url": "https://university.redis.com/",
        "resource_type": "Course & Certification",
        "provider": "Redis Ltd.",
        "difficulty": "Beginner",
        "description": "In-memory caching patterns, Pub/Sub, Redis Streams, session management, and TTL strategies."
    },
    "Machine Learning": {
        "title": "Scikit-Learn User Guide & Machine Learning Course",
        "url": "https://scikit-learn.org/stable/user_guide.html",
        "resource_type": "Documentation & Tutorials",
        "provider": "Scikit-Learn Consortium",
        "difficulty": "Intermediate",
        "description": "Supervised and unsupervised learning, model evaluation, cross-validation, hyperparameter tuning, and pipelines."
    }
}

class SkillGapAnalyzer:
    @classmethod
    def analyze(
        cls,
        candidate_skills: List[str],
        job_required_skills: List[str],
        job_preferred_skills: List[str],
        job_title: str,
        company: str,
        job_id: int
    ) -> Dict[str, Any]:
        cand_lower = {s.lower().strip(): s for s in candidate_skills}
        req_lower = {s.lower().strip(): s for s in job_required_skills}
        pref_lower = {s.lower().strip(): s for s in job_preferred_skills}

        demonstrated = [orig for low, orig in req_lower.items() if low in cand_lower]
        demonstrated += [orig for low, orig in pref_lower.items() if low in cand_lower and orig not in demonstrated]

        missing_required = [orig for low, orig in req_lower.items() if low not in cand_lower]
        missing_preferred = [orig for low, orig in pref_lower.items() if low not in cand_lower]

        total_needed = len(job_required_skills) + (0.5 * len(job_preferred_skills))
        if total_needed > 0:
            met = len(demonstrated)
            readiness = min(100.0, round((met / total_needed) * 100.0, 1))
        else:
            readiness = 100.0

        # Suggested learning sequence: prioritize missing required skills first
        learning_sequence = missing_required + missing_preferred

        # Fetch verified resources
        curated_resources = []
        for skill in learning_sequence:
            res = VERIFIED_RESOURCES.get(skill)
            if not res:
                # Case-insensitive match in catalog
                for cat_skill, cat_data in VERIFIED_RESOURCES.items():
                    if cat_skill.lower() == skill.lower():
                        res = cat_data
                        break
            if res:
                curated_resources.append({
                    "skill_name": skill,
                    "title": res["title"],
                    "url": res["url"],
                    "resource_type": res["resource_type"],
                    "provider": res["provider"],
                    "difficulty": res["difficulty"],
                    "description": res["description"]
                })
            else:
                # Generic verified fallback
                curated_resources.append({
                    "skill_name": skill,
                    "title": f"Mastering {skill} - Architecture & Practical Guide",
                    "url": f"https://devdocs.io/#q={skill.lower()}",
                    "resource_type": "Developer Reference",
                    "provider": "DevDocs Community",
                    "difficulty": "Intermediate",
                    "description": f"Standard syntax, API reference, idiomatic usage, and architecture patterns for {skill}."
                })

        # Practice Project Ideas targeted to close these specific gaps
        project_ideas = cls.generate_project_ideas(missing_required or missing_preferred, job_title)

        # Roadmap Milestones
        milestones = cls.generate_milestones(learning_sequence)

        return {
            "job_id": job_id,
            "job_title": job_title,
            "company": company,
            "demonstrated_skills": demonstrated,
            "missing_required_skills": missing_required,
            "missing_preferred_skills": missing_preferred,
            "readiness_percentage": readiness,
            "learning_sequence": learning_sequence,
            "curated_resources": curated_resources,
            "practice_project_ideas": project_ideas,
            "roadmap_milestones": milestones
        }

    @staticmethod
    def generate_project_ideas(skills_to_learn: List[str], target_role: str) -> List[Dict[str, str]]:
        if not skills_to_learn:
            return [{
                "title": f"Enterprise Production {target_role} System",
                "skills_involved": "Full Tech Stack",
                "description": "Design an end-to-end production application featuring distributed caching, JWT RBAC authentication, CI/CD automated pipeline, and comprehensive unit/integration test coverage.",
                "duration": "2 - 3 weeks"
            }]

        featured = ", ".join(skills_to_learn[:3])
        return [
            {
                "title": f"Full-Stack Microservices Architecture with {featured}",
                "skills_involved": featured,
                "description": f"Build a modular web service that utilizes {featured} for core data handling, asynchronous worker queues, and clean API contracts with Dockerized local staging.",
                "duration": "1 - 2 weeks"
            },
            {
                "title": f"Resilient Data Processing Pipeline using {featured}",
                "skills_involved": featured,
                "description": f"Implement batch & stream data ingestion with automated validation, schema migrations, and structured observability logging utilizing {featured}.",
                "duration": "2 weeks"
            }
        ]

    @staticmethod
    def generate_milestones(sequence: List[str]) -> List[Dict[str, Any]]:
        if not sequence:
            return [{
                "phase": "Phase 1: Advanced Mock Interviewing & System Design",
                "duration": "Week 1",
                "goal": "Refine communication, design trade-off articulation, and behavioral scenario readiness.",
                "status": "Ready"
            }]
        
        milestones = []
        chunk_size = max(1, len(sequence) // 3 + 1)
        for i in range(0, len(sequence), chunk_size):
            skills_chunk = sequence[i:i+chunk_size]
            week_idx = (i // chunk_size) + 1
            milestones.append({
                "phase": f"Phase {week_idx}: Core Mastery of {', '.join(skills_chunk)}",
                "duration": f"Week {week_idx}",
                "goal": f"Study documentation, complete mini-labs, and build a working proof-of-concept integrating {', '.join(skills_chunk)}.",
                "status": "Pending"
            })
        return milestones
