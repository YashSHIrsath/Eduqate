from typing import Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.refresh_token import RefreshToken

class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: Session):
        super().__init__(db, RefreshToken)

    def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Retrieve a refresh token by its SHA-256 hash."""
        return self.db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()

    def revoke_token(self, token_hash: str) -> bool:
        """Mark a specific refresh token as revoked."""
        token = self.get_by_hash(token_hash)
        if token and not token.is_revoked:
            token.is_revoked = True
            token.revoked_at = datetime.now(timezone.utc)
            self.db.commit()
            return True
        return False

    def revoke_all_user_tokens(self, user_id: UUID) -> int:
        """
        Revoke all active refresh tokens for a specific user.
        Used on logout-all-devices or under security replay attack mitigation.
        Returns the number of tokens updated.
        """
        tokens = self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).all()
        
        now = datetime.now(timezone.utc)
        for token in tokens:
            token.is_revoked = True
            token.revoked_at = now
            
        self.db.commit()
        return len(tokens)
