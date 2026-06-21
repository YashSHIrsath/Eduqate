from fastapi import APIRouter, Depends
from app.core.constants import PersonaType
from app.dependencies.permissions import RequiresPersona

# Gate 1: only TEACHER may enter this portal
_persona_gate = [Depends(RequiresPersona(PersonaType.TEACHER))]

router = APIRouter(prefix="/teacher", dependencies=_persona_gate)

# Teacher portal endpoints are added here as Teaching modules are built (Phase 3+).
