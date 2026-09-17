from pydantic import BaseModel, Field


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
