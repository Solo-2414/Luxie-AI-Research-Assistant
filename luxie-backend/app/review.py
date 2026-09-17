from __future__ import annotations

import os
import google.generativeai as genai

from .schemas import Paper

def _format_papers(papers: list[Paper]) -> str:
    blocks: list[str] = []
    for index, paper in enumerate(papers, start=1):
        authors = ", ".join(paper.authors) if paper.authors else "Unknown authors"
        year = paper.year if paper.year is not None else "n.d."
        blocks.append(
            f"[{index}] {paper.title} ({year})\n"
            f"Authors: {authors}\n"
            f"Summary: {paper.summary}"
        )
    return "\n\n".join(blocks)

async def generate_literature_review(query: str, papers: list[Paper]) -> str:
    api_key = (
        os.getenv("GOOGLE_API_KEY", "").strip()
        or os.getenv("GEMINI_API_KEY", "").strip()
    )
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is not set")

    # Initialize native Google SDK
    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash") 

    system_instruction = (
        "You are an academic research assistant. Write a concise, cited literature "
        "review based only on the provided papers. Cite papers inline as [1], [2], "
        "matching the numbered list. Do not invent papers, findings, or citations. "
        "If an abstract is missing, say so rather than guessing. End with a short "
        "synthesis of gaps or open questions."
    )

    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction,
        )
        
        prompt = f"Research query: {query}\n\nPapers:\n{_format_papers(papers)}\n\nWrite a literature review that cites these sources."
        
        # Using start_chat() explicitly prevents the AFC SDK warning
        chat = model.start_chat()
        response = await chat.send_message_async(
            prompt,
            generation_config=genai.GenerationConfig(temperature=0.3)
        )
        return response.text

    except Exception as e:
        # This will expose the REAL error in your terminal
        print(f"\n--- GEMINI ERROR LOG ---\n{str(e)}\n------------------------\n")
        raise RuntimeError(f"Gemini API Error: {str(e)}")