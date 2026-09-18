from pydantic import BaseModel, Field
from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_serializer


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Research topic or question")
    limit: int = Field(default=8, ge=2, le=20)
    start_year: int | None = None
    end_year: int | None = None
    sort_by_recent: bool = False


class Paper(BaseModel):
    paper_id: str | None = None
    title: str
    authors: list[str]
    summary: str
    year: int | None = None
    url: str | None = None
    citation_count: int | None = None
    source: str | None = None
    venue: str | None = None


class ResearchResponse(BaseModel):
    review: str
    papers: list[Paper]
    fallback_message: str | None = None
    is_guest: bool = False


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class SearchHistoryCreate(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    results_count: int = Field(default=0, ge=0)


class SearchHistoryResponse(BaseModel):
    id: int
    query: str
    results_count: int
    timestamp: datetime

    @field_serializer("timestamp")
    def serialize_timestamp(self, value: datetime) -> str:
        normalized = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
        return normalized.isoformat().replace("+00:00", "Z")

    class Config:
        from_attributes = True
