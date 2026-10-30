import json
import logging
import requests
from typing import Dict, List, Any, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMProviderInterface:
    def generate_chat_reply(
        self, prompt: str, system_prompt: str, context_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, bool]:
        """Returns (reply_text, is_fallback)"""
        raise NotImplementedError

class GeminiLLMProvider(LLMProviderInterface):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    def generate_chat_reply(
        self, prompt: str, system_prompt: str, context_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, bool]:
        if not self.api_key:
            return FallbackDeterministicProvider().generate_chat_reply(prompt, system_prompt, context_chunks)
        
        try:
            # Build context prompt
            context_text = "\n\n".join([f"Source [{c.get('title', 'Knowledge')}]: {c.get('chunk_text', '')}" for c in context_chunks])
            full_prompt = f"System Instructions: {system_prompt}\n\nContext Documents:\n{context_text}\n\nCandidate Question: {prompt}"
            
            payload = {
                "contents": [{
                    "parts": [{"text": full_prompt}]
                }]
            }
            resp = requests.post(self.endpoint, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                reply = data["candidates"][0]["content"]["parts"][0]["text"]
                return reply, False
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
                return FallbackDeterministicProvider().generate_chat_reply(prompt, system_prompt, context_chunks)
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return FallbackDeterministicProvider().generate_chat_reply(prompt, system_prompt, context_chunks)

class FallbackDeterministicProvider(LLMProviderInterface):
    """
    Deterministic rule-based and retrieval-grounded career intelligence engine.
    Always clearly labeled as non-LLM functionality per Section 6 requirements.
    """
    def generate_chat_reply(
        self, prompt: str, system_prompt: str, context_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, bool]:
        p_lower = prompt.lower()

        # If context chunks are available from RAG, ground response directly in them
        if context_chunks:
            primary_chunk = context_chunks[0]
            reply = (
                f"Based on authorized platform career guidelines ({primary_chunk.get('title', 'Reference Document')}):\n\n"
                f"{primary_chunk.get('chunk_text', '')}\n\n"
                f"**Recommendation**: Apply these verified standards to your resume and interview preparation. "
                f"Would you like me to analyze a specific job description or target skill?"
            )
            return reply, True

        # Rule-based intent classification
        if any(w in p_lower for w in ["resume", "cv", "improve", "format"]):
            reply = (
                "### Resume Improvement Recommendations (Deterministic Engine)\n\n"
                "1. **Quantify Accomplishments**: Use Google's XYZ formula: *Accomplished [X], as measured by [Y], by doing [Z]*.\n"
                "2. **Section Hierarchy**: Structure your resume as: Contact Info → Professional Summary → Core Technical Skills → Work Experience / Internships → Notable Projects → Education.\n"
                "3. **ATS Alignment**: Match exact keywords from the target job description in your Skills and Experience sections.\n"
                "4. **Brevity & Focus**: Keep to 1 page for <5 years experience; ensure consistent bullet styles and avoid graphic tables that break ATS parsers.\n\n"
                "*Note: Running in deterministic career advisor mode (no external LLM API key configured).*"
            )
        elif any(w in p_lower for w in ["interview", "prep", "question", "hr", "behavioral"]):
            reply = (
                "### Interview Preparation Strategy\n\n"
                "1. **STAR Method for Behavioral Questions**: Structure responses into Situation, Task, Action, and Result.\n"
                "2. **System Design Fundamentals**: For senior roles, review load balancing, caching (Redis), database sharding, CAP theorem, and asynchronous messaging.\n"
                "3. **Live Coding & Algorithmic Practice**: Practice explaining your thought process out loud before typing code.\n\n"
                "You can also use our dedicated **AI Interview Preparation** tab to run a mock interview with automated rubric scoring!"
            )
        elif any(w in p_lower for w in ["skill", "gap", "learn", "roadmap"]):
            reply = (
                "### Targeted Skill Acquisition Strategy\n\n"
                "1. **Identify High-Value Gaps**: Check your **Skill Gap Analysis** dashboard for target jobs to see missing required vs preferred technologies.\n"
                "2. **Project-Based Learning**: Don't just watch tutorials; build a full-stack project demonstrating authentication, CRUD operations, database indexing, and Docker containerization.\n"
                "3. **Verified Learning**: Focus on official documentation and hands-on GitHub repositories.\n\n"
                "Select any recommended job on your dashboard to see a personalized step-by-step learning sequence!"
            )
        else:
            reply = (
                f"HireWise Career Assistant (Deterministic Mode):\n\n"
                f"I can assist you with:\n"
                f"- Analyzing and optimizing your resume for ATS screening.\n"
                f"- Identifying missing skill gaps against specific job descriptions.\n"
                f"- Structuring behavioral and technical interview responses.\n"
                f"- Exploring career roadmaps for Full-Stack, Backend, Frontend, and AI engineering roles.\n\n"
                f"What specific area or role would you like guidance on today?"
            )
        
        return reply, True

def get_llm_provider() -> LLMProviderInterface:
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMProvider(settings.GEMINI_API_KEY)
    return FallbackDeterministicProvider()
