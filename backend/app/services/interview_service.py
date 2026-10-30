from typing import List, Dict, Any, Optional

# Curated role-specific interview question repository
ROLE_QUESTION_BANK = {
    "Full Stack Developer": [
        {
            "question_text": "Explain the difference between optimistic locking and pessimistic locking in relational databases, and when would you choose one over the other in a web application?",
            "question_type": "Technical",
            "rubric": {
                "criteria": ["Definition of both locking paradigms", "Concurrency trade-offs", "Real-world web scenario"],
                "max_score": 10.0
            },
            "sample_answer": "Optimistic locking assumes collisions are rare and verifies record version timestamps prior to committing an update. Pessimistic locking locks the record upon reading (e.g. SELECT FOR UPDATE) to prevent concurrent writes. Optimistic locking is ideal for read-heavy web apps with infrequent edit conflicts, while pessimistic locking suits financial ledger transfers where double-writes cannot occur."
        },
        {
            "question_text": "How do you mitigate Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) vulnerabilities in modern Single Page Applications communicating with REST APIs?",
            "question_type": "Technical",
            "rubric": {
                "criteria": ["XSS mitigation (escaping, CSP)", "CSRF mitigation (SameSite cookies, anti-CSRF tokens)", "Token storage safety"],
                "max_score": 10.0
            },
            "sample_answer": "For XSS: rely on framework escaping (React JSX), sanitize user-generated HTML, and enforce a strict Content Security Policy (CSP). For CSRF: store session/JWT tokens in HttpOnly, Secure, SameSite=Strict cookies or transmit Bearer tokens via custom Authorization headers which browser cross-origin requests cannot forge without CORS authorization."
        },
        {
            "question_text": "Write or describe the algorithm to implement an in-memory Rate Limiter using the Token Bucket or Sliding Window algorithm for an API gateway.",
            "question_type": "Coding",
            "rubric": {
                "criteria": ["Data structures used", "Time and space complexity", "Concurrency thread-safety"],
                "max_score": 10.0
            },
            "sample_answer": "In a Sliding Window Counter using Redis or memory: keep timestamps of requests in a sorted set or ring buffer per client IP. On each request, prune entries older than current_time - window_size. If remaining count is below threshold, add current timestamp and allow request; otherwise reject with HTTP 429."
        },
        {
            "question_text": "Describe a challenging bug you encountered in a previous project that involved multiple layers of the stack. How did you diagnose and resolve it?",
            "question_type": "Project",
            "rubric": {
                "criteria": ["Systematic debugging methodology", "Root cause identification", "Long-term preventative measure"],
                "max_score": 10.0
            },
            "sample_answer": "Candidates should structure their answer using STAR: Situation (high-concurrency connection pool exhaustion), Task (restore service reliability), Action (analyzed distributed APM traces and slow query logs, identified unclosed database sessions in an unhandled async exception branch), Result (added context managers and connection leak alerts, reducing error rate to 0%)."
        },
        {
            "question_text": "Tell me about a time when you had a strong technical disagreement with a team member about an architectural choice. How did you arrive at a resolution?",
            "question_type": "HR",
            "rubric": {
                "criteria": ["Empathy & active listening", "Data-driven decision making", "Team alignment over ego"],
                "max_score": 10.0
            },
            "sample_answer": "Focus on framing the disagreement around system requirements rather than personal preferences. Describe building a fast prototype or benchmark to measure latency/complexity empirically, agreeing on evaluation metrics, and committing fully to the selected path."
        }
    ],
    "Backend Engineer": [
        {
            "question_text": "How does database indexing work under the hood (specifically B-Trees vs Hash Indexes), and what are the trade-offs of adding multiple indexes to a high-write table?",
            "question_type": "Technical",
            "rubric": {
                "criteria": ["B-Tree range query capability", "Write amplification overhead", "Index maintenance cost"],
                "max_score": 10.0
            },
            "sample_answer": "B-Trees keep keys sorted, enabling efficient O(log N) searches, range scans, and prefix lookups. Hash indexes only support exact equality O(1) lookups. Each new index adds write overhead because every INSERT/UPDATE/DELETE must update the primary table pages plus each index structure, increasing disk I/O and locking contention."
        },
        {
            "question_text": "How would you design a distributed job queue system that guarantees at-least-once execution and handles worker node crashes gracefully?",
            "question_type": "Coding",
            "rubric": {
                "criteria": ["Message acknowledgments & heartbeats", "Dead-letter queues", "Idempotency"],
                "max_score": 10.0
            },
            "sample_answer": "Use a broker like RabbitMQ or Redis with visibility timeouts. When a worker pulls a job, the job becomes invisible to others for a lease window. If the worker fails to send an ACK or heartbeat before expiry, the message is re-queued. Ensure idempotent consumer handlers using unique idempotency keys to prevent duplicate processing."
        }
    ],
    "Frontend Engineer": [
        {
            "question_text": "Explain how React's Virtual DOM reconciliation and Fiber architecture work to achieve smooth 60fps rendering during complex state updates.",
            "question_type": "Technical",
            "rubric": {
                "criteria": ["Reconciliation heuristic", "Fiber priority scheduling", "Commit vs render phases"],
                "max_score": 10.0
            },
            "sample_answer": "React creates a lightweight JavaScript tree representing the DOM. In Fiber, rendering is split into an interruptible render/reconciliation phase and a synchronous commit phase. Fiber allows React to pause long-running render computations to yield back to the main browser thread for high-priority user input and animations."
        }
    ]
}

class InterviewService:
    @classmethod
    def generate_questions(
        cls, role: str, difficulty: str = "Intermediate", topic: str = "General", count: int = 5
    ) -> List[Dict[str, Any]]:
        # Match closest role
        bank = ROLE_QUESTION_BANK.get(role)
        if not bank:
            # Check substring
            for r_key, q_list in ROLE_QUESTION_BANK.items():
                if any(word.lower() in role.lower() for word in r_key.split()):
                    bank = q_list
                    break
        if not bank:
            bank = ROLE_QUESTION_BANK["Full Stack Developer"]

        # Adapt questions to requested count
        selected = bank[:count]
        # If requested count is higher than bank, duplicate with slight variations
        while len(selected) < count:
            base = bank[len(selected) % len(bank)]
            selected.append({
                "question_text": f"In {difficulty} {topic}: {base['question_text']}",
                "question_type": base["question_type"],
                "rubric": base["rubric"],
                "sample_answer": base["sample_answer"]
            })
        return selected

    @classmethod
    def evaluate_answer(
        cls, question_text: str, question_type: str, rubric: Dict[str, Any], user_answer: str, sample_answer: str
    ) -> Dict[str, Any]:
        answer_clean = user_answer.strip()
        word_count = len(answer_clean.split())

        if word_count < 10:
            score = 3.0
            feedback = "Your response is very brief. Provide more concrete technical details, trade-offs, and examples to demonstrate your depth of knowledge."
            breakdown = {
                "relevance": 4.0,
                "technical_correctness": 3.0,
                "explanation_quality": 3.0,
                "problem_solving": 2.0
            }
        else:
            # Check keyword overlap with sample answer
            sample_keywords = set([w.lower() for w in sample_answer.split() if len(w) > 4])
            user_keywords = set([w.lower() for w in answer_clean.split() if len(w) > 4])
            overlap = len(sample_keywords.intersection(user_keywords))
            
            relevance = min(10.0, 5.0 + (overlap * 0.8))
            correctness = min(10.0, 5.0 + (overlap * 0.7))
            explanation = min(10.0, 6.0 + (word_count / 30.0))
            problem_solving = min(10.0, 6.0 + (1.5 if "trade-off" in answer_clean.lower() or "for example" in answer_clean.lower() or "because" in answer_clean.lower() else 0.5))

            score = round((relevance * 0.3) + (correctness * 0.3) + (explanation * 0.2) + (problem_solving * 0.2), 1)
            
            feedback = (
                f"Solid response demonstrating clear understanding of {question_type.lower()} concepts. "
                f"You articulated core considerations well. "
                f"To strengthen this in a real interview, explicitly highlight edge cases and concrete performance benchmarks."
            )
            breakdown = {
                "relevance": round(relevance, 1),
                "technical_correctness": round(correctness, 1),
                "explanation_quality": round(explanation, 1),
                "problem_solving": round(problem_solving, 1)
            }

        return {
            "score": score,
            "feedback": feedback,
            "breakdown": breakdown,
            "sample_answer": sample_answer,
            "disclaimer": "This evaluation is AI-generated practice feedback to guide your interview readiness and does not represent an actual hiring decision."
        }
