from fastapi import APIRouter, Depends
from app.core.constants import PersonaType
from app.dependencies.permissions import RequiresPersona
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.roles import router as roles_router
from app.api.v1.endpoints.permissions import router as permissions_router
from app.api.v1.endpoints.dashboard import router as dashboard_router

# Gate 1: only SUPER_ADMIN and HEADMASTER may enter this portal
_persona_gate = [Depends(RequiresPersona(PersonaType.SUPER_ADMIN, PersonaType.HEADMASTER))]

router = APIRouter(prefix="/admin", dependencies=_persona_gate)

router.include_router(dashboard_router)
router.include_router(users_router)
router.include_router(roles_router)
router.include_router(permissions_router)
