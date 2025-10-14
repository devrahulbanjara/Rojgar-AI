"""
Security - Authentication and password handling
Simple, easy to understand JWT and password functions
"""

import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Request

from app.core.config import settings


# ============= Password Functions =============

def hash_password(password: str) -> str:
    """
    Hash a plain text password using SHA-256
    Use this when creating a new user
    
    Note: For learning purposes, we use SHA-256 with a secret key.
    In production, you'd use bcrypt or argon2.
    """
    return hashlib.sha256(f"{password}{settings.SECRET_KEY}".encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a password matches its hash
    Use this when logging in
    """
    return hash_password(plain_password) == hashed_password


# ============= JWT Token Functions =============

def create_token(user_id: str, expires_minutes: Optional[int] = None) -> str:
    """
    Create a JWT token for a user
    
    Args:
        user_id: The user's ID to encode in the token
        expires_minutes: How long the token should last (optional)
    
    Returns:
        The JWT token as a string
    """
    if expires_minutes:
        expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Create the token payload
    token_data = {
        "sub": user_id,  # "sub" = subject (the user ID)
        "exp": expire     # "exp" = expiration time
    }
    
    # Encode and return the token
    token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


def verify_token(token: str) -> str:
    """
    Verify a JWT token and return the user ID
    
    Args:
        token: The JWT token to verify
    
    Returns:
        The user ID from the token
    
    Raises:
        HTTPException: If the token is invalid or expired
    """
    try:
        # Decode the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        
        return user_id
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user_id(request: Request) -> str:
    """
    Get the current user's ID from the request cookie
    
    Use this as a dependency in your routes:
        @router.get("/protected")
        def protected_route(user_id: str = Depends(get_current_user_id)):
            ...
    
    Args:
        request: The FastAPI request object
    
    Returns:
        The current user's ID
    
    Raises:
        HTTPException: If no valid token is found
    """
    # Get token from cookie
    token = request.cookies.get("auth_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in",
        )
    
    # Verify and return user ID
    return verify_token(token)
