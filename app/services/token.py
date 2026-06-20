from typing import Optional, Dict, Any

class TokenService:
    def create_access_token(self, subject: str, expires_delta: Optional[int] = None) -> str:
        """
        Skeleton method to generate a short-lived access token.
        Will be implemented in the next phase using PyJWT.
        """
        # Placeholder returns a dummy access token string
        return f"dummy_access_token_for_{subject}"

    def create_refresh_token(self, subject: str, expires_delta: Optional[int] = None) -> str:
        """
        Skeleton method to generate a long-lived refresh token.
        Will be implemented in the next phase.
        """
        # Placeholder returns a dummy refresh token string
        return f"dummy_refresh_token_for_{subject}"

    def decode_token(self, token: str) -> Dict[str, Any]:
        """
        Skeleton method to decode a token and extract claims.
        """
        # Placeholder returns empty claims dictionary
        return {}

    def validate_token(self, token: str) -> bool:
        """
        Skeleton method to validate JWT signature and expiration.
        """
        # Placeholder returns True for mock validation
        return True
