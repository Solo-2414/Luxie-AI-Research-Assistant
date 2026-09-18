from __future__ import annotations

import os
import time
from collections.abc import AsyncGenerator
from inspect import isawaitable
from typing import Any

import google.generativeai as genai
from google.api_core.exceptions import NotFound, ResourceExhausted
from dotenv import load_dotenv

from .schemas import Paper

load_dotenv()

_cached_flash_models: list[Any] | None = None
_last_cache_time = 0.0
_last_cache_key: str | None = None
MODEL_CACHE_TTL_SECONDS = 60 * 60
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

def _get_api_keys() -> list[str]:
    keys = [key.strip() for key in os.getenv("GOOGLE_API_KEYS", "").split(",") if key.strip()]
    if keys:
        return keys

    single_key = os.getenv("GOOGLE_API_KEY", "").strip()
    return [single_key] if single_key else []

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


async def get_cached_models(api_key: str) -> list[Any]:
    global _cached_flash_models, _last_cache_time, _last_cache_key

    now = time.monotonic()
    if (
        _cached_flash_models is not None
        and _last_cache_key == api_key
        and now - _last_cache_time < MODEL_CACHE_TTL_SECONDS
    ):
        return _cached_flash_models

    genai.configure(api_key=api_key)
    models = [
        model
        for model in genai.list_models()
        if "generateContent" in (model.supported_generation_methods or [])
        and model.name.rsplit("/", 1)[-1].lower() == GEMINI_MODEL.lower()
    ]
    _cached_flash_models = models
    _last_cache_time = now
    _last_cache_key = api_key
    return models

async def generate_literature_review(
    query: str, papers: list[Paper]
) -> AsyncGenerator[str, None]:
    api_keys = _get_api_keys()
    if not api_keys:
        yield "Literature review is temporarily unavailable. Please view the sources below."
        return

    system_instruction = (
        "You are an academic research assistant. Write a concise, cited literature "
        "review based only on the provided papers. Cite papers inline as [1], [2], "
        "matching the numbered list. Do not invent papers, findings, or citations. "
        "If an abstract is missing, say so rather than guessing. End with a short "
        "synthesis of gaps or open questions."
    )

    prompt = f"Research query: {query}\n\nPapers:\n{_format_papers(papers)}\n\nWrite a literature review that cites these sources."
    for key_index, current_key in enumerate(api_keys, start=1):
        try:
            available_models = await get_cached_models(current_key)
        except Exception as error:
            print(f"Gemini key {key_index} could not list models; trying the next key: {error}")
            continue

        for model in available_models:
            try:
                model_client = genai.GenerativeModel(
                    model_name=model.name,
                    system_instruction=system_instruction,
                )
                generation_config = genai.GenerationConfig(temperature=0.3)
                stream_method = getattr(model_client, "generate_content_stream_async", None)
                if stream_method is not None:
                    stream = stream_method(prompt, generation_config=generation_config)
                else:
                    stream = await model_client.generate_content_async(
                        prompt,
                        generation_config=generation_config,
                        stream=True,
                    )
                if isawaitable(stream):
                    stream = await stream
                async for response in stream:
                    text = getattr(response, "text", "")
                    if text:
                        yield text
                return
            except (ResourceExhausted, NotFound) as error:
                print(f"Model {model.name} failed on Key {key_index}, trying next: {error}")
                continue
            except Exception as error:
                status_code = getattr(error, "status_code", None)
                message = str(error).lower()
                if status_code not in (404, 429) and "404" not in message and "429" not in message:
                    print(f"Model {model.name} failed on Key {key_index}, trying next: {error}")
                continue

    yield "Literature review is temporarily unavailable due to high API demand. Please view the sources below."