from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth_utils import create_access_token, decode_access_token, hash_password, verify_password
from ..database import get_db
from ..models import User
from ..schemas import UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def get_current_user(
    request: Request,
    token: Annotated[str | None, Depends(optional_oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    token = token or request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    email = decode_access_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_current_user(
    request: Request,
    token: Annotated[str | None, Depends(optional_oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    token = token or request.cookies.get("access_token")
    if not token:
        return None
    email = decode_access_token(token)
    if not email:
        return None
    return db.scalar(select(User).where(User.email == email))


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, db: Annotated[Session, Depends(get_db)]) -> User:
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        email=email,
        full_name=payload.full_name.strip() if payload.full_name else None,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    response.set_cookie(key="access_token", value=create_access_token(user.email), httponly=True, samesite="lax", secure=True, max_age=3600, path="/")
    return user


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Annotated[Session, Depends(get_db)]) -> User:
    email = str(payload.email).lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    response.set_cookie(key="access_token", value=create_access_token(user.email), httponly=True, samesite="lax", secure=True, max_age=3600, path="/")
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/")


@router.get("/me", response_model=UserResponse)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> UserResponse:
    return current_user
