import uuid
import hashlib
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from app.core.config import settings

class TokenService:
    def create_access_token(self, subject: str, organization_id: str, session_id: str) -> str:
        """
        Generates a stateless JWT access token.
        Includes subject, organization ID, session identifier, type, and unique token ID.
        """
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            "sub": str(subject),
            "org": str(organization_id),
            "sid": str(session_id),
            "type": "access",
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
            "jti": str(uuid.uuid4())
        }
        
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def generate_raw_refresh_token(self) -> str:
        """
        Generates a high-entropy cryptographically secure random refresh token.
        """
        # Return a 64-character hex string (32 bytes of entropy)
        import secrets
        return secrets.token_hex(32)

    def hash_token(self, raw_token: str) -> str:
        """
        Hashes a raw refresh token using SHA-256 for secure database storage.
        """
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    def decode_token(self, token: str) -> Dict[str, Any]:
        """
        Decodes a JWT access token and verifies its signature.
        Raises jwt.PyJWTError on failure.
        """
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

    def validate_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decodes and validates that the token is a valid, non-expired access token.
        Returns the payload claims on success, otherwise returns None.
        """
        try:
            payload = self.decode_token(token)
            if payload.get("type") != "access":
                return None
            return payload
        except jwt.PyJWTError:
            return None
        except Exception:
            return None
