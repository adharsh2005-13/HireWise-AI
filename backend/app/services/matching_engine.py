import math
import re
from typing import Dict, List, Any, Set, Tuple

class MatchingEngine:
    # Configurable weights specified in Section 5
    DEFAULT_WEIGHTS = {
        "required_skills": 0.40,
        "semantic_similarity": 0.30,
        "experience_and_projects": 0.20,
        "preferred_skills": 0.10
    }

    @classmethod
    def calculate_match(
        cls,
        candidate_skills: List[str],
        candidate_text: str,
        candidate_projects: List[Dict[str, Any]],
        candidate_experience: List[Dict[str, Any]],
        job_required_skills: List[str],
        job_preferred_skills: List[str],
        job_description: str,
        job_title: str,
        job_experience_level: str = "Mid-level",
        weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        if weights is None:
            weights = cls.DEFAULT_WEIGHTS

        cand_skills_lower = {s.lower().strip() for s in candidate_skills}
        req_skills_lower = {s.lower().strip() for s in job_required_skills}
        pref_skills_lower = {s.lower().strip() for s in job_preferred_skills}

        # 1. Required Skill Overlap Score (0 - 100)
        matching_req_set = cand_skills_lower.intersection(req_skills_lower)
        missing_req_set = req_skills_lower.difference(cand_skills_lower)
        
        if req_skills_lower:
            req_score = (len(matching_req_set) / len(req_skills_lower)) * 100.0
        else:
            req_score = 100.0

        # 2. Preferred Skill Overlap Score (0 - 100)
        matching_pref_set = cand_skills_lower.intersection(pref_skills_lower)
        missing_pref_set = pref_skills_lower.difference(cand_skills_lower)
        
        if pref_skills_lower:
            pref_score = (len(matching_pref_set) / len(pref_skills_lower)) * 100.0
        else:
            pref_score = 100.0

        # 3. Semantic Similarity Score (0 - 100)
        semantic_score = cls.compute_semantic_similarity(candidate_text, job_description)

        # 4. Experience & Project Match Score (0 - 100)
        exp_score = cls.compute_experience_project_score(
            candidate_projects, candidate_experience, job_title, job_description, job_experience_level
        )

        # Total Weighted Score
        total_score = (
            (weights["required_skills"] * req_score) +
            (weights["semantic_similarity"] * semantic_score) +
            (weights["experience_and_projects"] * exp_score) +
            (weights["preferred_skills"] * pref_score)
        )
        total_score = max(0.0, min(100.0, round(total_score, 1)))

        # Format matching and missing skills preserving proper casing
        matching_display = []
        for s in job_required_skills + job_preferred_skills:
            if s.lower().strip() in cand_skills_lower and s not in matching_display:
                matching_display.append(s)

        missing_display = []
        for s in job_required_skills + job_preferred_skills:
            if (s.lower().strip() in missing_req_set or s.lower().strip() in missing_pref_set) and s not in missing_display:
                missing_display.append(s)

        explanation = cls.generate_explanation(
            total_score, req_score, semantic_score, exp_score, pref_score,
            matching_display, missing_display, job_title
        )

        recommended_steps = cls.generate_recommendations(missing_display, req_score, total_score)

        return {
            "total_score": total_score,
            "breakdown": {
                "required_skill_score": round(req_score, 1),
                "semantic_score": round(semantic_score, 1),
                "experience_score": round(exp_score, 1),
                "preferred_skill_score": round(pref_score, 1)
            },
            "matching_skills": matching_display,
            "missing_skills": missing_display,
            "explanation": explanation,
            "recommended_steps": recommended_steps,
            "disclaimer": "This score indicates alignment with documented job requirements and qualifications. It is not a probability or guarantee of employment."
        }

    @staticmethod
    def compute_semantic_similarity(text1: str, text2: str) -> float:
        # Cosine similarity using sublinear TF-IDF representation
        if not text1.strip() or not text2.strip():
            return 40.0

        words1 = re.findall(r"\b[a-zA-Z]{3,}\b", text1.lower())
        words2 = re.findall(r"\b[a-zA-Z]{3,}\b", text2.lower())

        if not words1 or not words2:
            return 40.0

        # Term frequency vectors
        tf1 = {}
        for w in words1:
            tf1[w] = tf1.get(w, 0) + 1
        tf2 = {}
        for w in words2:
            tf2[w] = tf2.get(w, 0) + 1

        all_words = set(tf1.keys()).union(set(tf2.keys()))
        
        dot = 0.0
        norm1 = 0.0
        norm2 = 0.0
        for w in all_words:
            v1 = (1 + math.log(tf1[w])) if w in tf1 else 0
            v2 = (1 + math.log(tf2[w])) if w in tf2 else 0
            dot += v1 * v2
            norm1 += v1 * v1
            norm2 += v2 * v2

        if norm1 == 0 or norm2 == 0:
            return 40.0

        cosine = dot / (math.sqrt(norm1) * math.sqrt(norm2))
        # Rescale cosine typically between 0.1 to 0.7 into 40-98 scale
        scaled = min(98.0, max(25.0, (cosine * 110.0)))
        return round(scaled, 1)

    @staticmethod
    def compute_experience_project_score(
        projects: List[Dict[str, Any]],
        experience: List[Dict[str, Any]],
        job_title: str,
        job_description: str,
        job_exp_level: str
    ) -> float:
        score = 50.0 # base score
        if len(projects) >= 1:
            score += 15.0
        if len(projects) >= 3:
            score += 10.0
        if len(experience) >= 1:
            score += 15.0
        if len(experience) >= 2:
            score += 10.0

        # Check for role keywords match
        title_words = set(re.findall(r"\b\w+\b", job_title.lower()))
        combined_text = " ".join([p.get("title", "") + " " + p.get("description", "") for p in projects])
        combined_text += " " + " ".join([e.get("role", "") for e in experience])
        
        matches = [w for w in title_words if len(w) > 3 and w in combined_text.lower()]
        if matches:
            score += 10.0

        return min(100.0, round(score, 1))

    @staticmethod
    def generate_explanation(
        total: float, req: float, sem: float, exp: float, pref: float,
        matching: List[str], missing: List[str], job_title: str
    ) -> str:
        if total >= 80:
            tone = f"Strong alignment for the {job_title} role."
        elif total >= 60:
            tone = f"Moderate qualification match for the {job_title} opening."
        else:
            tone = f"Partial match with notable skill gaps identified for {job_title}."

        req_part = f"You satisfy {round(req)}% of the mandatory required skills, demonstrating competencies in {', '.join(matching[:4]) if matching else 'core areas'}."
        
        if missing:
            gap_part = f"Key skills to acquire or emphasize on your resume include: {', '.join(missing[:4])}."
        else:
            gap_part = "You have met all primary technical prerequisites defined by the recruiter."

        sem_part = f"Contextual relevance between your background and the role description is scored at {round(sem)}%."

        return f"{tone} {req_part} {gap_part} {sem_part}"

    @staticmethod
    def generate_recommendations(missing: List[str], req_score: float, total_score: float) -> List[str]:
        steps = []
        if missing:
            steps.append(f"Review and upskill on required competencies: {', '.join(missing[:3])}.")
            steps.append("Build a portfolio project demonstrating hands-on experience with the missing technologies.")
        if req_score < 75:
            steps.append("Tailor your resume project bullets to explicitly highlight technologies mentioned in the job description.")
        steps.append("Complete the AI Interview Preparation module for this role to prepare for technical screenings.")
        if total_score >= 65:
            steps.append("Proceed with submitting your application; your profile is within competitive review range.")
        return steps
