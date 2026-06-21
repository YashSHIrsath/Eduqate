from typing import Generic, Type, TypeVar, Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, db: Session, model: Type[ModelType]):
        self.db = db
        self.model = model

    def get(self, id: UUID) -> Optional[ModelType]:
        """Retrieve a record by its UUID."""
        return self.db.query(self.model).filter(
            self.model.id == id,
            # Handle soft delete if available
            (getattr(self.model, "deleted_at", None) == None)
        ).first()

    def get_multi(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Retrieve multiple records with pagination."""
        query = self.db.query(self.model)
        if hasattr(self.model, "deleted_at"):
            query = query.filter(self.model.deleted_at == None)
        return query.offset(skip).limit(limit).all()

    def create(self, obj_in) -> ModelType:
        """Create a new database record."""
        self.db.add(obj_in)
        self.db.commit()
        self.db.refresh(obj_in)
        return obj_in

    def update(self, db_obj: ModelType, obj_in) -> ModelType:
        """Update an existing database record."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            # exclude_none so optional unset fields don't overwrite existing values with NULL
            update_data = obj_in.model_dump(exclude_none=True)
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def remove(self, id: UUID) -> Optional[ModelType]:
        """Perform a soft delete (if deleted_at is present) or hard delete."""
        obj = self.get(id)
        if obj:
            if hasattr(obj, "deleted_at"):
                from datetime import datetime, timezone
                obj.deleted_at = datetime.now(timezone.utc)
                self.db.commit()
            else:
                self.db.delete(obj)
                self.db.commit()
        return obj
