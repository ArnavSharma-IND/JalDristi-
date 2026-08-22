"""
Authentication and Authorization Dependencies for Enterprise Security.
"""

from fastapi import Header, HTTPException
import logging

logger = logging.getLogger(__name__)


async def verify_admin_token(x_admin_token: str = Header(default=None)):
    """
    Middleware to verify administrative privileges.
    In production, this decodes a JWT and verifies RBAC roles against the DB.
    For SIH demo, accepts 'SIH-ADMIN-SECRET-2026' or 'admin-token'.
    """
    if not x_admin_token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token missing. Provide 'X-Admin-Token' header."
        )
    
    # Validation for SIH Demo & testing
    valid_tokens = {"SIH-ADMIN-SECRET-2026", "admin-token", "Bearer SIH-ADMIN-SECRET-2026"}
    if x_admin_token not in valid_tokens:
        logger.warning(f"Unauthorized access attempt blocked with token: {x_admin_token[:4]}***")
        raise HTTPException(status_code=403, detail="Invalid token or insufficient permissions.")
    
    return True
