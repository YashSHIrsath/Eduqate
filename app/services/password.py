import re
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

class PasswordService:
    def __init__(self):
        # Default Argon2 settings are secure and standardized in PasswordHasher
        self.hasher = PasswordHasher()

    def hash_password(self, password: str) -> str:
        """Hash a password using Argon2id."""
        return self.hasher.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its Argon2id hash."""
        try:
            return self.hasher.verify(hashed_password, plain_password)
        except VerifyMismatchError:
            return False
        except Exception:
            return False

    def validate_password_strength(self, password: str) -> bool:
        """
        Validate password strength policy:
        - Minimum 10 characters
        - At least one lowercase letter
        - At least one uppercase letter
        - At least one digit
        - At least one special character from: @$!%*?&
        """
        if len(password) < 10:
            return False
        if not re.search(r"[a-z]", password):
            return False
        if not re.search(r"[A-Z]", password):
            return False
        if not re.search(r"\d", password):
            return False
        if not re.search(r"[@$!%*?&]", password):
            return False
        return True
