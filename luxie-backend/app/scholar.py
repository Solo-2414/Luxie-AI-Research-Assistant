from __future__ import annotations

import asyncio
from datetime import datetime
import math
import os
import re
from asyncio import sleep
import xml.etree.ElementTree as ET

import httpx
from dotenv import load_dotenv

from .schemas import Paper

load_dotenv()


class ScholarError(Exception):
    pass


COMPOUND_SUFFIXES = (
    "husbandry",
    "management",
    "making",
    "keeping",
    "ment",
    "ness",
    "ship",
    "tion",
    "ing",
)


def _compound_query_fallback(query: str) -> str | None:
    """Return one conservative spaced variant for a long compound query."""
    if len(query) <= 10 or not re.fullmatch(r"[A-Za-z]+", query):
        return None

    camel_case = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", query)
    if camel_case != query:
        return camel_case

    normalized = query.lower()
    for suffix in COMPOUND_SUFFIXES:
        if normalized.endswith(suffix) and len(query) - len(suffix) >= 3:
            return f"{query[:-len(suffix)]} {query[-len(suffix):]}"
    return None


def _reconstruct_openalex_abstract(inv_index: dict | None) -> str:
    """Reconstructs full text abstract from OpenAlex's inverted index format."""
    if not inv_index:
        return "No abstract available."
    try:
        word_pos = []
        for word, positions in inv_index.items():
            for pos in positions:
                word_pos.append((pos, word))
        word_pos.sort(key=lambda x: x[0])
        return " ".join(w for _, w in word_pos)
    except Exception:
        return "No abstract available."


def _filter_by_year(
    papers: list[Paper], start_year: int | None, end_year: int | None
) -> list[Paper]:
    filtered = []
    for paper in papers:
        if paper.year is None:
            filtered.append(paper)
            continue
        if start_year and paper.year < start_year:
            continue
        if end_year and paper.year > end_year:
            continue
        filtered.append(paper)
    return filtered


async def fetch_openalex(
    client: httpx.AsyncClient,
    query: str,
    limit: int = 4,
    sort_by_recent: bool = False,
) -> list[Paper]:
    """Fetches open-access papers from OpenAlex."""
    sort = "publication_date:desc" if sort_by_recent else "relevance_score:desc"
    url = f"https://api.openalex.org/works?search={query}&per-page={limit}&sort={sort}"
    headers = {"User-Agent": "Luxcie-AI-Research-Assistant/1.0"}
    try:
        response = await client.get(url, headers=headers, timeout=10.0)
        if response.status_code != 200:
            return []

        data = response.json()
        papers: list[Paper] = []
        for item in data.get("results") or []:
            title = (item.get("display_name") or "").strip()
            if not title:
                continue

            authorships = item.get("authorships") or []
            authors = [
                a.get("author", {}).get("display_name", "")
                for a in authorships[:3]
            ]
            authors = [a for a in authors if a] or ["Unknown Author"]

            abstract = _reconstruct_openalex_abstract(
                item.get("abstract_inverted_index")
            )

            papers.append(
                Paper(
                    paper_id=item.get("id"),
                    title=title,
                    authors=authors,
                    summary=abstract,
                    year=item.get("publication_year"),
                    url=item.get("doi") or item.get("id"),
                    citation_count=item.get("cited_by_count"),
                    source="OpenAlex",
                )
            )
        return papers
    except Exception as e:
        print(f"OpenAlex fetch error: {e}")
        return []


async def fetch_arxiv(
    client: httpx.AsyncClient,
    query: str,
    limit: int = 4,
    sort_by_recent: bool = False,
) -> list[Paper]:
    """Fetches open-access papers from ArXiv API."""
    sort_by = "submittedDate" if sort_by_recent else "relevance"
    url = f"http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results={limit}&sortBy={sort_by}&sortOrder=descending"
    try:
        response = await client.get(url, timeout=10.0)
        if response.status_code != 200:
            return []

        root = ET.fromstring(response.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        papers: list[Paper] = []

        for entry in root.findall("atom:entry", ns):
            title_elem = entry.find("atom:title", ns)
            summary_elem = entry.find("atom:summary", ns)
            pub_elem = entry.find("atom:published", ns)
            id_elem = entry.find("atom:id", ns)

            title = (
                title_elem.text.strip().replace("\n", " ")
                if title_elem is not None and title_elem.text
                else ""
            )
            if not title:
                continue

            summary = (
                summary_elem.text.strip().replace("\n", " ")
                if summary_elem is not None and summary_elem.text
                else "No abstract available."
            )

            pub_date = (
                pub_elem.text[:4]
                if pub_elem is not None and pub_elem.text
                else None
            )
            year = int(pub_date) if pub_date and pub_date.isdigit() else None
            url_str = (
                id_elem.text.strip()
                if id_elem is not None and id_elem.text
                else None
            )

            authors = [
                a.find("atom:name", ns).text
                for a in entry.findall("atom:author", ns)
                if a.find("atom:name", ns) is not None
                and a.find("atom:name", ns).text
            ]

            papers.append(
                Paper(
                    paper_id=url_str,
                    title=title,
                    authors=authors[:3] or ["Unknown Author"],
                    summary=summary,
                    year=year,
                    url=url_str,
                    citation_count=None,
                    source="arXiv",
                )
            )
        return papers
    except Exception as e:
        print(f"ArXiv fetch error: {e}")
        return []


async def fetch_from_semantic_scholar(query: str, limit: int = 5) -> list[Paper]:
    """Fetch and normalize papers from Semantic Scholar."""
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "limit": limit,
        "fields": "title,authors,year,abstract,url,citationCount,externalIds",
    }
    api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY", "").strip()
    headers = {"x-api-key": api_key} if api_key else {}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 429:
                print("Semantic Scholar returned HTTP 429; retrying once after 1.2 seconds")
                await sleep(1.2)
                response = await client.get(url, params=params, headers=headers)
        if response.status_code != 200:
            print(f"Semantic Scholar fetch returned HTTP {response.status_code}")
            return []

        papers: list[Paper] = []
        for item in response.json().get("data") or []:
            title = (item.get("title") or "").strip()
            if not title:
                continue

            authors = [
                (author.get("name") or "").strip()
                for author in item.get("authors") or []
            ]
            authors = [author for author in authors if author] or ["Unknown Author"]
            external_ids = item.get("externalIds") or {}
            doi = (external_ids.get("DOI") or "").strip()
            paper_url = (item.get("url") or "").strip() or None
            if doi and not paper_url:
                paper_url = f"https://doi.org/{doi}"

            papers.append(
                Paper(
                    paper_id=doi or item.get("paperId"),
                    title=title,
                    authors=authors[:3],
                    summary=(item.get("abstract") or "No abstract available.").strip(),
                    year=item.get("year"),
                    url=paper_url,
                    citation_count=item.get("citationCount"),
                    source="Semantic Scholar",
                )
            )
        return papers
    except Exception as exc:
        print(f"Semantic Scholar fetch error: {exc}")
        return []


def _paper_identity(paper: Paper) -> tuple[str, str]:
    """Return a DOI identity when available, otherwise a normalized title."""
    candidate = (paper.url or "").strip().lower()
    doi_match = re.search(r"10\.\d{4,9}/[^\s]+", candidate)
    if doi_match:
        return "doi", doi_match.group(0).rstrip(".,;)")
    return "title", re.sub(r"\s+", " ", paper.title.strip().lower())


def _normalize_paper(paper: Paper) -> Paper:
    current_year = datetime.now().year
    try:
        citation_count = int(paper.citation_count or 0)
    except (TypeError, ValueError):
        citation_count = 0
    try:
        year = int(paper.year or current_year)
    except (TypeError, ValueError):
        year = current_year
    return paper.model_copy(update={"citation_count": citation_count, "year": year})


def _sort_papers(papers: list[Paper], query: str, sort_by: str) -> None:
    if sort_by == "citations":
        papers.sort(key=lambda paper: paper.citation_count or 0, reverse=True)
    elif sort_by == "newest":
        papers.sort(key=lambda paper: paper.year or 0, reverse=True)
    elif sort_by == "oldest":
        papers.sort(key=lambda paper: paper.year or 0)
    else:
        current_year = datetime.now().year
        query_terms = re.findall(r"[a-z0-9]+", query.lower())

        def relevance_score(paper: Paper) -> float:
            recency_score = max(0, 10 - (current_year - (paper.year or 0)))
            citation_score = min(10, math.log1p(paper.citation_count or 0))
            title = paper.title.lower()
            title_match = 5 if query_terms and all(term in title for term in query_terms) else 0
            return (recency_score * 0.4) + (citation_score * 0.4) + (title_match * 0.2)

        papers.sort(key=relevance_score, reverse=True)


async def search_papers(
    query: str,
    limit: int = 8,
    start_year: int | None = None,
    end_year: int | None = None,
    sort_by_recent: bool = False,
    sort_by: str = "relevance",
) -> tuple[list[Paper], str | None, dict[str, int]]:
    """Fetches from OpenAlex and ArXiv concurrently, deduplicates, and returns papers."""
    per_source_limit = max(2, limit)

    async def fetch_combined(client: httpx.AsyncClient, search_query: str) -> list[Paper]:
        results = await asyncio.gather(
            fetch_openalex(
                client, search_query, limit=per_source_limit, sort_by_recent=sort_by_recent
            ),
            fetch_arxiv(
                client, search_query, limit=per_source_limit, sort_by_recent=sort_by_recent
            ),
            fetch_from_semantic_scholar(search_query, limit=per_source_limit),
            return_exceptions=True,
        )
        openalex_results = results[0] if isinstance(results[0], list) else []
        arxiv_results = results[1] if isinstance(results[1], list) else []
        semantic_results = results[2] if isinstance(results[2], list) else []
        print(
            f"--- DEBUG: Combined {len(openalex_results)} from OpenAlex, "
            f"{len(arxiv_results)} from arXiv, and "
            f"{len(semantic_results)} from Semantic Scholar ---"
        )
        combined: list[Paper] = []
        for result in results:
            if isinstance(result, list):
                combined.extend(result)
        return combined

    fallback_messages: list[str] = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        combined_papers = await fetch_combined(client, query)
        fallback_query = _compound_query_fallback(query)
        if not combined_papers and fallback_query:
            combined_papers = await fetch_combined(client, fallback_query)
            if combined_papers:
                fallback_messages.append(
                    f'No exact results for "{query}". Retried as "{fallback_query}".'
                )

        if not combined_papers:
            return [], "No papers found for this query. Try adding spaces or using a broader search.", {}

        # Prefer DOI identity, then fall back to normalized title.
        seen_papers: set[tuple[str, str]] = set()
        unique_papers: list[Paper] = []
        for paper in combined_papers:
            paper = _normalize_paper(paper)
            identity = _paper_identity(paper)
            if identity not in seen_papers:
                seen_papers.add(identity)
                unique_papers.append(paper)

        filtered = _filter_by_year(unique_papers, start_year, end_year)
        if len(filtered) < min(4, len(unique_papers)):
            # Keep the end-year constraint, but relax the recent-year constraint
            # when it would leave too few results for a useful response.
            filtered = _filter_by_year(unique_papers, None, end_year)
            fallback_messages.append(
                "Fewer papers matched the recent-year filter. Expanded search to "
                "include older literature."
            )
        _sort_papers(filtered, query, sort_by)
        source_breakdown: dict[str, int] = {}
        for paper in filtered:
            source = paper.source or "Unknown"
            source_breakdown[source] = source_breakdown.get(source, 0) + 1
        return filtered, " ".join(fallback_messages) or None, source_breakdown