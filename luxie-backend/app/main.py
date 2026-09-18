import json
import hashlib
import math
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.coder import Coder
from fastapi_cache.decorator import cache
import google.generativeai as genai
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import select

from .database import Base, engine, get_db
from .auth_utils import decode_access_token
from .models import SearchHistory, User
from .review import generate_literature_review
from .routers.auth import get_current_user, get_optional_current_user, router as auth_router
from .schemas import Paper, ResearchRequest, ResearchResponse, SearchHistoryCreate, SearchHistoryResponse
from .scholar import ScholarError, fetch_citing_papers, search_papers

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
    FastAPICache.init(InMemoryBackend())

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
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


@app.post("/api/history", response_model=SearchHistoryResponse, status_code=201)
def create_search_history(
    payload: SearchHistoryCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> SearchHistory:
    history = SearchHistory(
        user_id=current_user.id,
        query=payload.query.strip(),
        results_count=payload.results_count,
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


@app.get("/api/history", response_model=list[SearchHistoryResponse])
def list_search_history(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> list[SearchHistory]:
    return list(
        db.scalars(
            select(SearchHistory)
            .where(SearchHistory.user_id == current_user.id)
            .order_by(SearchHistory.timestamp.desc())
            .limit(20)
        )
    )


@app.delete("/api/history/{history_id}", status_code=204)
def delete_search_history(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> None:
    history = db.scalar(
        select(SearchHistory).where(
            SearchHistory.id == history_id,
            SearchHistory.user_id == current_user.id,
        )
    )
    if history is None:
        raise HTTPException(status_code=404, detail="Search history item not found")
    db.delete(history)
    db.commit()


@app.delete("/api/history", status_code=204)
def clear_search_history(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> None:
    history_items = db.scalars(select(SearchHistory).where(SearchHistory.user_id == current_user.id)).all()
    for history in history_items:
        db.delete(history)
    db.commit()


@app.get("/api/citations", response_model=list[Paper])
@limiter.limit("30/minute")
@cache(expire=1800, namespace="citations")
async def citations(
    request: Request,
    paper_id: str = Query(..., min_length=1),
    source: str = Query(..., pattern="^(OpenAlex|Semantic Scholar)$"),
) -> list[Paper]:
    return await fetch_citing_papers(paper_id=paper_id, source=source)


def has_valid_bearer_token(request: Request) -> bool:
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    token = token if scheme.lower() == "bearer" else request.cookies.get("access_token", "")
    return bool(token) and decode_access_token(token) is not None


def optimize_failed_query(query: str) -> str:
    """Use Gemini to correct obvious search typos and split compound words."""
    original_query = query.strip()
    print(f'[query-fallback] Triggered for query: "{original_query}"')

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not gemini_key:
        print("[query-fallback] GEMINI_API_KEY is not configured")
        return original_query
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
    if not gemini_model:
        gemini_model = "gemini-3.6-flash"
    print("[query-fallback] Gemini API key found; requesting query correction")

    prompt = (
        "Correct this academic search query only when it contains an obvious typo "
        "or a compound word that should be split. For example, change "
        "'househusbandry' to 'house husbandry'. Preserve valid scientific Latin, "
        "technical terms, names, and already-correct wording. Return ONLY the "
        "corrected query string, with no quotes, explanation, or punctuation added.\n\n"
        f"Query: {original_query}"
    )

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(gemini_model)
        response = model.generate_content(prompt)
        raw_response = getattr(response, "text", "")
        print(f'[query-fallback] Gemini raw response: "{raw_response}"')
        corrected_query = raw_response.replace('"', "").replace("'", "").strip()
        print(f'[query-fallback] Cleaned query: "{corrected_query}"')
        return corrected_query or original_query
    except Exception as exc:
        print(f"[query-fallback] Gemini exception: {type(exc).__name__}: {exc}")
        return original_query


def research_cache_key(
    func: Any,
    namespace: str = "",
    *,
    request: Request | None = None,
    response: Any = None,
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
) -> str:
    """Build a stable cache key from the research body and request filters."""
    payload = next((value for value in (*args, *kwargs.values()) if isinstance(value, ResearchRequest)), None)
    if payload is not None:
        cache_input = "|".join(
            [
                payload.query.strip().lower(),
                str(payload.limit),
                str(payload.start_year),
                str(payload.end_year),
                str(payload.sort_by_recent),
            ]
        )
    else:
        cache_input = repr((args, sorted(kwargs.items())))
    digest = hashlib.sha256(cache_input.encode("utf-8")).hexdigest()
    return f"{namespace}:research:{digest}"


class SearchResultCoder(Coder):
    """Serialize cached provider results without trying to encode an SSE stream."""

    @classmethod
    def encode(cls, value: tuple[list[Any], str | None, dict[str, int]]) -> bytes:
        papers, fallback_message, source_breakdown = value
        return json.dumps(
            {
                "papers": [paper.model_dump(mode="json") for paper in papers],
                "fallback_message": fallback_message,
                "source_breakdown": source_breakdown,
            }
        ).encode("utf-8")

    @classmethod
    def decode(cls, value: bytes) -> tuple[list[Any], str | None, dict[str, int]]:
        payload = json.loads(value.decode("utf-8"))
        return (
            [Paper.model_validate(paper) for paper in payload["papers"]],
            payload.get("fallback_message"),
            payload.get("source_breakdown", {}),
        )


@cache(expire=3600, coder=SearchResultCoder, key_builder=research_cache_key)
async def cached_search_papers(
    query: str,
    limit: int,
    start_year: int | None,
    end_year: int | None,
    sort_by_recent: bool,
    sort_by: str,
    page: int,
) -> tuple[list[Any], str | None, dict[str, int]]:
    return await search_papers(
        query=query,
        limit=limit,
        start_year=start_year,
        end_year=end_year,
        sort_by_recent=sort_by_recent,
        sort_by=sort_by,
    )


@app.post("/api/research")
@limiter.limit(
    "3/day",
    exempt_when=has_valid_bearer_token,
    error_message="Guest search limit reached. Please sign in for unlimited research.",
)
async def research(
    request: Request,
    payload: ResearchRequest,
    current_user: User | None = Depends(get_optional_current_user),
    db=Depends(get_db),
    sort_by: str = Query("relevance", enum=["relevance", "citations", "newest", "oldest"]),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
) -> ResearchResponse:
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query must not be empty")
    effective_sort = "newest" if sort_by == "relevance" and payload.sort_by_recent else sort_by
    fetch_limit = min(50, max(limit, page * limit))

    try:
        print(f'[search] Initial database search for: "{query}"')
        papers, fallback_msg, source_breakdown = await cached_search_papers(
            query=query,
            limit=fetch_limit,
            start_year=payload.start_year,
            end_year=payload.end_year,
            sort_by_recent=payload.sort_by_recent,
            sort_by=effective_sort,
            page=page,
        )
        print(f"[search] Initial search returned {len(papers)} papers")
        if not papers:
            print("[search] Initial result is empty; running Gemini query fallback")
            optimized_query = optimize_failed_query(query)
            print(f'[search] Optimized query returned: "{optimized_query}"')
            if optimized_query and optimized_query != query:
                print(f'[search] Retrying database search with: "{optimized_query}"')
                retry_papers, retry_message, retry_breakdown = await cached_search_papers(
                    query=optimized_query,
                    limit=fetch_limit,
                    start_year=payload.start_year,
                    end_year=payload.end_year,
                    sort_by_recent=payload.sort_by_recent,
                    sort_by=effective_sort,
                    page=page,
                )
                print(f"[search] Retry search returned {len(retry_papers)} papers")
                if retry_papers:
                    query = optimized_query
                    papers = retry_papers
                    source_breakdown = retry_breakdown
                    fallback_msg = retry_message or f'Retried search as "{optimized_query}".'
            else:
                print("[search] Gemini returned the original query; skipping retry")
    except ScholarError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    is_guest = not has_valid_bearer_token(request)
    total_results = len(papers)
    offset = (page - 1) * limit
    paginated_papers = papers[offset : offset + limit]
    total_pages = math.ceil(total_results / limit) if total_results else 0

    if current_user is not None:
        db.add(
            SearchHistory(
                user_id=current_user.id,
                query=query,
                results_count=total_results,
            )
        )
        db.commit()

    async def event_stream():
        metadata = {
            "type": "papers",
            "total_results": total_results,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "source_breakdown": source_breakdown,
            "papers": [paper.model_dump(mode="json") for paper in paginated_papers],
            "fallback_message": fallback_msg,
            "is_guest": is_guest,
        }
        yield f"data: {json.dumps(metadata)}\n\n"
        if not paginated_papers:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return
        try:
            async for chunk in generate_literature_review(query, paginated_papers):
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
