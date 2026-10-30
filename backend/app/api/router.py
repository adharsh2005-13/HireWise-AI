from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.resumes import router as resumes_router
from app.api.jobs import router as jobs_router
from app.api.matches import router as matches_router
from app.api.applications import router as applications_router
from app.api.ai import router as ai_router
from app.api.admin import router as admin_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(resumes_router)
api_router.include_router(jobs_router)
api_router.include_router(matches_router)
api_router.include_router(applications_router)
api_router.include_router(ai_router)
api_router.include_router(admin_router)
