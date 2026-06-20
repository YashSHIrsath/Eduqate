from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse, RolePermissionAssign
from app.repositories.role import RoleRepository
from app.repositories.permission import PermissionRepository

router = APIRouter(prefix="/roles", tags=["Role Management"])

@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    current_user: User = Depends(RequiresPermission("roles:create")),
    db: Session = Depends(get_db)
):
    role_repo = RoleRepository(db)
    
    # Check if a role with the same name already exists in this organization
    existing_role = role_repo.get_by_name(payload.name, organization_id=current_user.organization_id)
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists in the organization."
        )
        
    role = Role(
        name=payload.name,
        description=payload.description,
        organization_id=current_user.organization_id,
        is_system_role=False
    )
    
    return role_repo.create(role)

@router.get("/", response_model=List[RoleResponse])
def list_roles(
    current_user: User = Depends(RequiresPermission("roles:view")),
    db: Session = Depends(get_db)
):
    role_repo = RoleRepository(db)
    # Filter by user's organization
    roles = db.query(Role).filter(
        Role.organization_id == current_user.organization_id,
        Role.deleted_at == None
    ).all()
    return roles

@router.get("/{role_id}", response_model=RoleResponse)
def get_role(
    role_id: UUID,
    current_user: User = Depends(RequiresPermission("roles:view")),
    db: Session = Depends(get_db)
):
    role_repo = RoleRepository(db)
    role = role_repo.get(role_id)
    if not role or role.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found."
        )
    return role

@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: UUID,
    payload: RoleUpdate,
    current_user: User = Depends(RequiresPermission("roles:update")),
    db: Session = Depends(get_db)
):
    role_repo = RoleRepository(db)
    role = role_repo.get(role_id)
    if not role or role.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found."
        )
        
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System roles cannot be modified."
        )

    if payload.name:
        existing_role = role_repo.get_by_name(payload.name, organization_id=current_user.organization_id)
        if existing_role and existing_role.id != role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this name already exists."
            )

    return role_repo.update(role, payload)

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: UUID,
    current_user: User = Depends(RequiresPermission("roles:delete")),
    db: Session = Depends(get_db)
):
    role_repo = RoleRepository(db)
    role = role_repo.get(role_id)
    if not role or role.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found."
        )
        
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System roles cannot be deleted."
        )

    role_repo.remove(role_id)

@router.post("/{role_id}/permissions", response_model=RoleResponse)
def assign_permissions_to_role(
    role_id: UUID,
    payload: RolePermissionAssign,
    current_user: User = Depends(RequiresPermission("roles:assign_permissions")),
    db: Session = Depends(get_db)
):
    role_repo = RoleRepository(db)
    role = role_repo.get(role_id)
    if not role or role.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found."
        )
        
    perm_repo = PermissionRepository(db)
    success = perm_repo.update_role_permissions(role_id, payload.permission_ids)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update role permissions. Verify permission IDs."
        )
        
    db.refresh(role)
    return role
