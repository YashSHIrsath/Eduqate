from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.organization import Organization

class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, db: Session):
        super().__init__(db, Organization)

    def get_by_slug(self, slug: str) -> Optional[Organization]:
        """Retrieve an organization by its slug."""
        return self.db.query(Organization).filter(
            Organization.slug == slug,
            Organization.deleted_at == None
        ).first()

    def get_first(self) -> Optional[Organization]:
        """Retrieve the first organization in the database (to check if empty)."""
        return self.db.query(Organization).filter(
            Organization.deleted_at == None
        ).first()
