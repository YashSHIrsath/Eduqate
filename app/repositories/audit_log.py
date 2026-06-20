from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.audit_log import AuditLog

class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(db, AuditLog)

    def log_action(
        self,
        user_id: str,
        organization_id: str,
        action: str,
        ip_address: str,
        user_agent: str,
        request_id: str = None,
        entity_type: str = None,
        entity_id: str = None,
        payload: dict = None
    ) -> AuditLog:
        """Create and persist an operational audit log entry."""
        log_entry = AuditLog(
            user_id=user_id,
            organization_id=organization_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            payload=payload
        )
        self.db.add(log_entry)
        self.db.commit()
        return log_entry
