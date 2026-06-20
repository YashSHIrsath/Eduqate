from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.roles import router as roles_router
from app.api.v1.endpoints.permissions import router as permissions_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.dashboard import router as dashboard_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(roles_router)
router.include_router(permissions_router)
router.include_router(users_router)
router.include_router(dashboard_router)


