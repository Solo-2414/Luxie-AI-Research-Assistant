import json

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .database import Base, engine
from .auth_utils import decode_access_token
from .review import generate_literature_review
from .routers.auth import router as auth_router
from .schemas import ResearchRequest, ResearchResponse
from .scholar import ScholarError, search_papers

load_dotenv()

app = FastAPI(title="Luxcie AI Research Assistant")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": str(exc.detail)})


app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.include_router(auth_router)


@app.on_event("startup")
def create_database_tables() -> None:
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Luxcie AI Research Assistant Backend is running!"}

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def has_valid_bearer_token(request: Request) -> bool:
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    return scheme.lower() == "bearer" and bool(token) and decode_access_token(token) is not None


@app.post("/api/research")
@limiter.limit(
    "3/day",
    exempt_when=has_valid_bearer_token,
    error_message="Guest search limit reached. Please sign in for unlimited research.",
)
async def research(request: Request, payload: ResearchRequest) -> ResearchResponse:
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query must not be empty")

    try:
        papers, fallback_msg = await search_papers(
            query=query,
            limit=payload.limit,
            start_year=payload.start_year,
            end_year=payload.end_year,
            sort_by_recent=payload.sort_by_recent,
        )
    except ScholarError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not papers:
        raise HTTPException(
            status_code=400,
            detail="No papers found matching your search and filter criteria.",
        )

    is_guest = not has_valid_bearer_token(request)

    async def event_stream():
        metadata = {
            "type": "papers",
            "papers": [paper.model_dump(mode="json") for paper in papers],
            "fallback_message": fallback_msg,
            "is_guest": is_guest,
        }
        yield f"data: {json.dumps(metadata)}\n\n"
        try:
            async for chunk in generate_literature_review(query, papers):
                yield f"data: {json.dumps({'type': 'text', 'text': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except RuntimeError as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Gemini failed to generate the literature review'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
