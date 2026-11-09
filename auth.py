"""
RACING ZONE - Pure Python Authentication Module
Implements PBKDF2-SHA256 hashing compatible with Django's password storage,
enabling 100% standalone authentication without Django dependencies.
"""

import base64
import hashlib
import hmac
import secrets


def make_password(password: str) -> str:
    """Hash password using PBKDF2-SHA256 (600,000 iterations)."""
    salt = secrets.token_hex(11)
    iterations = 600000
    hash_bytes = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations
    )
    encoded_hash = base64.b64encode(hash_bytes).decode("ascii").strip()
    return f"pbkdf2_sha256${iterations}${salt}${encoded_hash}"


def check_password(password: str, encoded: str) -> bool:
    """Verify password against stored PBKDF2 hash."""
    if not encoded or encoded.startswith("!"):
        return False
    parts = encoded.split("$", 3)
    if len(parts) != 4:
        return False
    algorithm, iterations_str, salt, stored_hash = parts
    if algorithm != "pbkdf2_sha256":
        return False
    try:
        iterations = int(iterations_str)
    except ValueError:
        return False

    hash_bytes = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations
    )
    computed_hash = base64.b64encode(hash_bytes).decode("ascii").strip()
    return hmac.compare_digest(computed_hash, stored_hash)


def make_unusable_password() -> str:
    """Generate unusable password hash for guest users."""
    return f"!{secrets.token_urlsafe(32)}"
