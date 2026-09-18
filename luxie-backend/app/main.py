import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import google.generativeai as genai
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


def optimize_failed_query(query: str) -> str:
    """Use Gemini to correct obvious search typos and split compound words."""
    original_query = query.strip()
    print(f'[query-fallback] Triggered for query: "{original_query}"')

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    api_keys = [gemini_key] if gemini_key else []
    if not api_keys:
        api_keys = [
            key.strip()
            for key in os.getenv("GOOGLE_API_KEYS", "").split(",")
            if key.strip()
        ]
    if not api_keys:
        single_key = os.getenv("GOOGLE_API_KEY", "").strip()
        if single_key:
            api_keys.append(single_key)
    if not api_keys:
        print("[query-fallback] No GEMINI_API_KEY, GOOGLE_API_KEYS, or GOOGLE_API_KEY configured")
        return original_query
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
        genai.configure(api_key=api_keys[0])
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        raw_response = getattr(response, "text", "")
        print(f'[query-fallback] Gemini raw response: "{raw_response}"')
        corrected_query = raw_response.replace('"', "").replace("'", "").strip()
        print(f'[query-fallback] Cleaned query: "{corrected_query}"')
        return corrected_query or original_query
    except Exception as exc:
        print(f"[query-fallback] Gemini exception: {type(exc).__name__}: {exc}")
        return original_query


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
        print(f'[search] Initial database search for: "{query}"')
        papers, fallback_msg = await search_papers(
            query=query,
            limit=payload.limit,
            start_year=payload.start_year,
            end_year=payload.end_year,
            sort_by_recent=payload.sort_by_recent,
        )
        print(f"[search] Initial search returned {len(papers)} papers")
        if not papers:
            print("[search] Initial result is empty; running Gemini query fallback")
            optimized_query = optimize_failed_query(query)
            print(f'[search] Optimized query returned: "{optimized_query}"')
            if optimized_query and optimized_query != query:
                print(f'[search] Retrying database search with: "{optimized_query}"')
                retry_papers, retry_message = await search_papers(
                    query=optimized_query,
                    limit=payload.limit,
                    start_year=payload.start_year,
                    end_year=payload.end_year,
                    sort_by_recent=payload.sort_by_recent,
                )
                print(f"[search] Retry search returned {len(retry_papers)} papers")
                if retry_papers:
                    query = optimized_query
                    papers = retry_papers
                    fallback_msg = retry_message or f'Retried search as "{optimized_query}".'
            else:
                print("[search] Gemini returned the original query; skipping retry")
    except ScholarError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    is_guest = not has_valid_bearer_token(request)

    async def event_stream():
        metadata = {
            "type": "papers",
            "papers": [paper.model_dump(mode="json") for paper in papers],
            "fallback_message": fallback_msg,
            "is_guest": is_guest,
        }
        yield f"data: {json.dumps(metadata)}\n\n"
        if not papers:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return
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
