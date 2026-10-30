import math
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.all_models import DocumentChunk, User

class RAGEngine:
    @classmethod
    def chunk_document(cls, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        words = text.split()
        if not words:
            return []
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + chunk_size]
            chunks.append(" ".join(chunk_words))
            i += (chunk_size - overlap)
        return chunks

    @classmethod
    def compute_text_vector(cls, text: str) -> Dict[str, float]:
        tokens = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        
        # Normalize
        norm = math.sqrt(sum(v * v for v in tf.values()))
        if norm > 0:
            return {k: round(v / norm, 4) for k, v in tf.items()}
        return {}

    @classmethod
    def index_document(
        cls, db: Session, doc_type: str, title: str, text: str, metadata: Dict[str, Any]
    ) -> int:
        chunks = cls.chunk_document(text)
        created_count = 0
        for idx, chunk_text in enumerate(chunks):
            vector = cls.compute_text_vector(chunk_text)
            doc_chunk = DocumentChunk(
                document_type=doc_type,
                title=title,
                chunk_text=chunk_text,
                chunk_index=idx,
                metadata_json=metadata,
                embedding_vector=list(vector.items()) # serializable sparse vector representation
            )
            db.add(doc_chunk)
            created_count += 1
        db.commit()
        return created_count

    @classmethod
    def retrieve(
        cls, db: Session, query: str, user: Optional[User] = None, top_k: int = 3
    ) -> List[Dict[str, Any]]:
        query_vec = cls.compute_text_vector(query)
        if not query_vec:
            return []

        # Retrieve documents respecting authorization
        # Candidates can only retrieve public platform knowledge and their own data
        query_set = db.query(DocumentChunk)
        
        # Filter: only public knowledge or user-specific metadata
        chunks = query_set.all()
        scored_chunks = []

        for c in chunks:
            # Enforce access boundaries
            meta = c.metadata_json or {}
            is_private = meta.get("is_private", False)
            owner_id = meta.get("owner_user_id")

            if is_private and (not user or user.id != owner_id):
                # Unauthorized access prevented
                continue

            # Compute similarity
            c_vec = dict(c.embedding_vector) if c.embedding_vector else {}
            score = sum(query_vec.get(token, 0) * weight for token, weight in c_vec.items())
            
            if score > 0.05:
                scored_chunks.append((score, c))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, chunk in scored_chunks[:top_k]:
            results.append({
                "id": chunk.id,
                "title": chunk.title,
                "source_type": chunk.document_type,
                "chunk_text": chunk.chunk_text,
                "snippet": chunk.chunk_text[:200] + "...",
                "score": round(score, 3)
            })
        return results
