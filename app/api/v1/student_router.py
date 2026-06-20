from fastapi import APIRouter, Depends
from app.core.constants import PersonaType
from app.dependencies.permissions import RequiresPersona

# Gate 1: only STUDENT may enter this portal
_persona_gate = [Depends(RequiresPersona(PersonaType.STUDENT))]

router = APIRouter(prefix="/student", dependencies=_persona_gate)

# Student portal endpoints are added here as Learning modules are built (Phase 4+).
