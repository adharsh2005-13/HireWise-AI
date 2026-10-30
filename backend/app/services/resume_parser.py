import os
import re
from typing import Tuple, Optional
from pypdf import PdfReader
from docx import Document
from app.core.config import settings

class ResumeParserError(Exception):
    pass

class ResumeParser:
    @staticmethod
    def validate_file(filename: str, file_size: int) -> Tuple[bool, str]:
        ext = os.path.splitext(filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            return False, f"File size exceeds maximum permitted limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        
        return True, ""

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        try:
            reader = PdfReader(file_path)
            extracted_pages = []
            for idx, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    extracted_pages.append(text)
            
            full_text = "\n\n".join(extracted_pages)
            if not full_text.strip():
                raise ResumeParserError("No readable text found in the PDF. It may contain scanned images or be password protected.")
            return full_text
        except Exception as e:
            if isinstance(e, ResumeParserError):
                raise e
            raise ResumeParserError(f"Error parsing PDF document: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        try:
            doc = Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            
            # Also extract text inside tables
            table_text = []
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        table_text.append(" | ".join(row_cells))
            
            all_text = "\n".join(paragraphs + table_text)
            if not all_text.strip():
                raise ResumeParserError("No readable text found in the DOCX document.")
            return all_text
        except Exception as e:
            if isinstance(e, ResumeParserError):
                raise e
            raise ResumeParserError(f"Error parsing DOCX document: {str(e)}")

    @classmethod
    def parse_document(cls, file_path: str, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            raw = cls.extract_text_from_pdf(file_path)
        elif ext == ".docx":
            raw = cls.extract_text_from_docx(file_path)
        else:
            raise ResumeParserError(f"Unsupported format: {ext}")
        
        return cls.clean_text(raw)

    @staticmethod
    def clean_text(text: str) -> str:
        # Normalize non-breaking spaces and unicode quotes
        text = text.replace("\u00a0", " ").replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
        # Remove consecutive blank lines
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Normalize horizontal whitespace
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()
