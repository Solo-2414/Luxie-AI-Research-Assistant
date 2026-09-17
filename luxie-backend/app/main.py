from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .review import generate_literature_review
from .schemas import ResearchRequest, ResearchResponse
from .scholar import ScholarError, search_papers

load_dotenv()

app = FastAPI(title="Luxie AI Research Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Luxie AI Research Assistant Backend is running!"}

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/research", response_model=ResearchResponse)
async def research(payload: ResearchRequest) -> ResearchResponse:
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

    try:
        review = await generate_literature_review(query, papers)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Gemini failed to generate the literature review",
        ) from exc

    return ResearchResponse(
        review=review,
        papers=papers,
        fallback_message=fallback_msg,
    )
