from fastapi import APIRouter

from app.api.v1.endpoints.academic_years import router as years_router
from app.api.v1.endpoints.academic_terms import router as terms_router
from app.api.v1.endpoints.departments import router as departments_router
from app.api.v1.endpoints.classes import router as classes_router
from app.api.v1.endpoints.sections import router as sections_router
from app.api.v1.endpoints.subjects import router as subjects_router
from app.api.v1.endpoints.teacher_assignments import router as teacher_assignments_router

router = APIRouter(prefix="/academic")

router.include_router(years_router)
router.include_router(terms_router)
router.include_router(departments_router)
router.include_router(classes_router)
router.include_router(sections_router)
router.include_router(subjects_router)
router.include_router(teacher_assignments_router)
