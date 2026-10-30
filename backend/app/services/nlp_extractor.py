import re
from typing import Dict, List, Any, Optional

# Comprehensive technical skills taxonomy
SKILL_TAXONOMY = {
    "Programming Languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Golang", 
        "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "SQL", "Bash", "Shell", "HTML5", "CSS3"
    ],
    "Frameworks & Libraries": [
        "React", "React.js", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js", 
        "FastAPI", "Django", "Flask", "Spring Boot", "ASP.NET", "Tailwind CSS", 
        "Redux", "GraphQL", "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy"
    ],
    "Databases & Caching": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Elasticsearch", 
        "Cassandra", "DynamoDB", "Firebase", "Supabase", "Oracle", "Neo4j"
    ],
    "Cloud & DevOps": [
        "AWS", "Amazon Web Services", "Azure", "Google Cloud", "GCP", "Docker", 
        "Kubernetes", "CI/CD", "Git", "GitHub Actions", "Terraform", "Linux", 
        "Nginx", "Jenkins", "Ansible", "Prometheus", "Grafana"
    ],
    "AI & Data Science": [
        "Machine Learning", "Deep Learning", "Natural Language Processing", "NLP", 
        "Computer Vision", "Large Language Models", "LLMs", "RAG", "Embeddings", 
        "Vector Databases", "LangChain", "Hugging Face", "Data Pipelines"
    ],
    "Architecture & Methodologies": [
        "REST APIs", "Microservices", "System Design", "Agile", "Scrum", 
        "Unit Testing", "Test-Driven Development", "TDD", "Clean Code", "Design Patterns"
    ]
}

# Inverted index for fast lookup: lowercase_skill -> (canonical_name, category)
SKILL_LOOKUP = {}
for category, skills in SKILL_TAXONOMY.items():
    for skill in skills:
        SKILL_LOOKUP[skill.lower()] = (skill, category)

class NLPExtractor:
    @classmethod
    def extract_all(cls, raw_text: str) -> Dict[str, Any]:
        email = cls.extract_email(raw_text)
        phone = cls.extract_phone(raw_text)
        name = cls.extract_name(raw_text, email)
        summary = cls.extract_summary(raw_text)
        skills_found, categorized = cls.extract_skills(raw_text)
        education = cls.extract_education(raw_text)
        experience = cls.extract_experience(raw_text)
        projects = cls.extract_projects(raw_text)
        
        completeness_score, breakdown, unclear_fields, suggestions = cls.calculate_completeness(
            name, email, phone, summary, skills_found, education, experience, projects
        )

        return {
            "candidate_name": name,
            "email": email,
            "phone": phone,
            "summary": summary,
            "skills": skills_found,
            "technical_categories": categorized,
            "education": education,
            "experience": experience,
            "projects": projects,
            "completeness_score": completeness_score,
            "completeness_breakdown": breakdown,
            "unclear_fields": unclear_fields,
            "improvement_suggestions": suggestions
        }

    @staticmethod
    def extract_email(text: str) -> Optional[str]:
        match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
        return match.group(0) if match else None

    @staticmethod
    def extract_phone(text: str) -> Optional[str]:
        # Matches formats like +1-555-123-4567, (555) 123-4567, 9876543210, +91 98765 43210
        pattern = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"
        match = re.search(pattern, text)
        return match.group(0).strip() if match else None

    @staticmethod
    def extract_name(text: str, email: Optional[str] = None) -> str:
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:5]:
            # Skip if line contains email or website or phone
            if "@" in line or "http" in line or re.search(r"\d", line):
                continue
            words = line.split()
            if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w.isalpha()):
                return line
        if email:
            # Fallback heuristic: user part of email capitalized
            user_part = email.split("@")[0].replace(".", " ").replace("_", " ")
            return user_part.title()
        return "Candidate"

    @staticmethod
    def extract_summary(text: str) -> str:
        summary_headers = r"(?:summary|professional summary|profile|about me|objective|career objective)"
        match = re.search(rf"{summary_headers}[:\n\s]+(.*?)(?=\n[A-Z\s]{{3,}}|\n\n[A-Z]|\Z)", text, re.IGNORECASE | re.DOTALL)
        if match:
            extracted = match.group(1).strip()
            # return first paragraph
            return extracted.split("\n\n")[0].strip()
        return ""

    @classmethod
    def extract_skills(cls, text: str) -> Tuple[List[Dict[str, Any]], Dict[str, List[str]]]:
        found_skills = {}
        categorized = {cat: [] for cat in SKILL_TAXONOMY.keys()}
        
        # Word boundary search for each taxonomy term
        for skill_key, (canonical_name, category) in SKILL_LOOKUP.items():
            # Escape regex special characters (e.g. C++, .NET)
            escaped = re.escape(skill_key)
            pattern = rf"(?i)(?:\b|(?<=[^a-zA-Z0-9])){escaped}(?:\b|(?=[^a-zA-Z0-9]))"
            if re.search(pattern, text):
                if canonical_name not in found_skills:
                    found_skills[canonical_name] = {
                        "name": canonical_name,
                        "category": category,
                        "proficiency": "Proficient",
                        "confidence": 0.95
                    }
                    categorized[category].append(canonical_name)

        # Remove empty categories
        categorized = {k: v for k, v in categorized.items() if v}
        return list(found_skills.values()), categorized

    @staticmethod
    def extract_education(text: str) -> List[Dict[str, Any]]:
        education_list = []
        edu_keywords = ["Bachelor", "Master", "B.Tech", "B.E.", "B.S.", "M.S.", "M.Tech", "Ph.D.", "Diploma", "Degree"]
        lines = text.split("\n")
        
        for i, line in enumerate(lines):
            line_str = line.strip()
            for kw in edu_keywords:
                if re.search(rf"\b{re.escape(kw)}\b", line_str, re.IGNORECASE):
                    # Check next line for university/institution
                    institution = lines[i+1].strip() if i + 1 < len(lines) else ""
                    # Check year
                    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", line_str + " " + institution)
                    grad_year = year_match.group(0) if year_match else "N/A"
                    
                    education_list.append({
                        "degree": line_str[:120],
                        "institution": institution[:120] if institution else "University / College",
                        "year": grad_year
                    })
                    break
        return education_list[:3]

    @staticmethod
    def extract_experience(text: str) -> List[Dict[str, Any]]:
        exp_list = []
        # Look for experience section
        pattern = r"(?:experience|employment history|work experience|work history)[\s\S]*?(?=(?:education|projects|skills|certifications|$))"
        match = re.search(pattern, text, re.IGNORECASE)
        target_text = match.group(0) if match else text
        
        # Look for bullet points or role markers
        role_keywords = ["Developer", "Engineer", "Architect", "Intern", "Analyst", "Lead", "Manager", "Consultant"]
        for line in target_text.split("\n"):
            line_clean = line.strip()
            for rk in role_keywords:
                if re.search(rf"\b{rk}\b", line_clean, re.IGNORECASE) and len(line_clean) < 100:
                    exp_list.append({
                        "role": line_clean,
                        "company": "Company",
                        "duration": "Not explicitly specified",
                        "highlights": []
                    })
                    break
        return exp_list[:4]

    @staticmethod
    def extract_projects(text: str) -> List[Dict[str, Any]]:
        projects = []
        pattern = r"(?:projects|personal projects|academic projects)[\s\S]*?(?=(?:experience|education|skills|certifications|$))"
        match = re.search(pattern, text, re.IGNORECASE)
        target_text = match.group(0) if match else ""
        
        if target_text:
            lines = [l.strip() for l in target_text.split("\n") if l.strip()]
            for l in lines[1:]:
                if (l.startswith("-") or l.startswith("•") or ":" in l) and len(l) > 15:
                    parts = l.split(":", 1)
                    title = parts[0].strip("- •*#")
                    desc = parts[1].strip() if len(parts) > 1 else l
                    projects.append({
                        "title": title[:60],
                        "description": desc[:250]
                    })
                    if len(projects) >= 4:
                        break
        return projects

    @classmethod
    def calculate_completeness(
        cls, name: str, email: Optional[str], phone: Optional[str], 
        summary: str, skills: list, education: list, experience: list, projects: list
    ) -> Tuple[float, Dict[str, bool], List[str], List[str]]:
        breakdown = {
            "has_contact_info": bool(email and phone),
            "has_summary": bool(summary and len(summary) > 20),
            "has_skills": len(skills) >= 4,
            "has_education": len(education) > 0,
            "has_experience": len(experience) > 0,
            "has_projects": len(projects) > 0
        }
        
        weights = {
            "has_contact_info": 15.0,
            "has_summary": 10.0,
            "has_skills": 25.0,
            "has_education": 15.0,
            "has_experience": 20.0,
            "has_projects": 15.0
        }
        
        score = sum(weights[k] for k, v in breakdown.items() if v)
        
        unclear_fields = []
        if not email: unclear_fields.append("Email Address")
        if not phone: unclear_fields.append("Phone Number")
        if not summary: unclear_fields.append("Professional Summary")
        if not education: unclear_fields.append("Education Details")
        if not experience: unclear_fields.append("Work Experience History")
        if not projects: unclear_fields.append("Demonstrated Projects")
        
        suggestions = []
        if not breakdown["has_summary"]:
            suggestions.append("Add a concise 3-4 sentence professional summary highlighting your core expertise and target role.")
        if len(skills) < 8:
            suggestions.append("Enrich your technical skills section with relevant databases, tools, or cloud platforms.")
        if not breakdown["has_projects"]:
            suggestions.append("Showcase 2-3 technical projects with links to GitHub repos or live deployments.")
        if breakdown["has_experience"]:
            suggestions.append("Quantify your accomplishments in work experience using metrics (e.g. 'Improved API response time by 35%').")
        else:
            suggestions.append("Include internship, capstone project, or open-source contribution experience to substantiate your skillset.")
        
        return round(score, 1), breakdown, unclear_fields, suggestions
