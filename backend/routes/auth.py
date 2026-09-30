"""Auth Router — login and token endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from backend.services.auth_service import authenticate_user, create_access_token
from backend.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """
    Authenticate with username + password.
    Returns a JWT Bearer token valid for JWT_EXPIRE_HOURS hours.
    """
    if not authenticate_user(req.username, req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(req.username)
    return TokenResponse(access_token=token, username=req.username)


@router.get("/me")
async def get_me(current_user: str = Depends(get_current_user)):
    """Return the authenticated user's profile. Used by frontend to validate stored token."""
    return {"username": current_user, "role": "analyst"}
