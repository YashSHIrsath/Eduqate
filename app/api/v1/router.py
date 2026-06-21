from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.admin_router import router as admin_router
from app.api.v1.teacher_router import router as teacher_router
from app.api.v1.student_router import router as student_router
from app.api.v1.academic_router import router as academic_router

router = APIRouter()

# Public — no persona gate
router.include_router(auth_router)

# Portal routers — persona gates applied inside each portal router
router.include_router(admin_router)
router.include_router(teacher_router)
router.include_router(student_router)

# Academic Foundation Router
router.include_router(academic_router)

