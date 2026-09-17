from __future__ import annotations

import asyncio
from datetime import datetime
import xml.etree.ElementTree as ET

import httpx

from .schemas import Paper


class ScholarError(Exception):
    pass


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
    headers = {"User-Agent": "Luxie-AI-Research-Assistant/1.0"}
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
                )
            )
        return papers
    except Exception as e:
        print(f"ArXiv fetch error: {e}")
        return []


async def search_papers(
    query: str,
    limit: int = 8,
    start_year: int | None = None,
    end_year: int | None = None,
    sort_by_recent: bool = False,
) -> tuple[list[Paper], str | None]:
    """Fetches from OpenAlex and ArXiv concurrently, deduplicates, and returns papers."""
    per_source_limit = max(2, limit)

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Fetch both concurrently for speed
        results = await asyncio.gather(
            fetch_openalex(
                client, query, limit=per_source_limit, sort_by_recent=sort_by_recent
            ),
            fetch_arxiv(
                client, query, limit=per_source_limit, sort_by_recent=sort_by_recent
            ),
            return_exceptions=True,
        )

        combined_papers: list[Paper] = []
        for res in results:
            if isinstance(res, list):
                combined_papers.extend(res)

        if not combined_papers:
            raise ScholarError(
                "Unable to fetch papers from OpenAlex or ArXiv"
            )

        # Deduplicate papers based on title similarity
        seen_titles = set()
        unique_papers: list[Paper] = []
        for paper in combined_papers:
            clean_title = paper.title.strip().lower()
            if clean_title not in seen_titles:
                seen_titles.add(clean_title)
                unique_papers.append(paper)

        filtered = _filter_by_year(unique_papers, start_year, end_year)
        fallback_message: str | None = None
        current_year = datetime.now().year
        if len(filtered) < 4 and start_year is not None:
            fallback_start_year = start_year - 5
            if fallback_start_year <= 0 or fallback_start_year > current_year:
                fallback_start_year = None
            filtered = _filter_by_year(unique_papers, fallback_start_year, end_year)
            fallback_message = (
                "Fewer than 4 recent papers found. Automatically expanded search "
                "to include foundational literature."
            )
        if sort_by_recent:
            filtered.sort(key=lambda paper: paper.year or 0, reverse=True)
        return filtered[:limit], fallback_message