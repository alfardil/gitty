import json
import asyncio
import re
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.rag.embedder import embed_repo
from app.rag.retriever import get_relevant_chunks
from app.services.o4_mini_service import OpenAIo4Service
from app.prompts import CHAT_PROMPT

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    question: str
    file_content: Optional[str]


class ChatResponse(BaseModel):
    response: str
    error: Optional[str] = None


class RAGChatRequest(BaseModel):
    question: str
    files: list[dict]  # Each dict should have 'path' and 'content'
    selected_file_path: str


o4_service = OpenAIo4Service()


def estimate_tokens(text: str) -> int:
    """Rough estimate of tokens (4 chars per token)"""
    return len(text) // 4


def truncate_context(context_parts: list[str], max_tokens: int = 8000) -> str:
    """Truncate context to stay within token limits"""
    total_tokens = 0
    selected_parts = []

    for part in context_parts:
        part_tokens = estimate_tokens(part)
        if total_tokens + part_tokens <= max_tokens:
            selected_parts.append(part)
            total_tokens += part_tokens
        else:
            # If this part would exceed the limit, truncate it
            remaining_tokens = max_tokens - total_tokens
            if remaining_tokens > 100:  # Only add if we have meaningful space
                truncated_part = part[
                    : remaining_tokens * 4
                ]  # Rough conversion back to chars
                selected_parts.append(truncated_part + "\n\n[Content truncated...]")
            break

    return "\n\n".join(selected_parts)


@router.post("/rag")
async def rag_chat(request: Request, rag_request: RAGChatRequest):
    try:

        async def event_generator():
            try:
                yield f"data: {json.dumps({'status': 'embedding', 'message': 'Embedding files...'})}\n\n"
                await asyncio.sleep(0.1)
                embed_result = embed_repo(rag_request.files)
                yield f"data: {json.dumps({'status': 'embedded', 'message': embed_result})}\n\n"
                await asyncio.sleep(0.1)
                yield f"data: {json.dumps({'status': 'retrieving', 'message': 'Retrieving relevant chunks...'})}\n\n"
                relevant_chunks = get_relevant_chunks(rag_request.question)

                # 1. Selected file content (highest priority)
                selected_file_content = next(
                    (
                        f["content"]
                        for f in rag_request.files
                        if f["path"] == rag_request.selected_file_path
                    ),
                    None,
                )

                # 2. Vector search results (second priority)
                vector_chunks = [chunk.page_content for chunk in relevant_chunks]

                # 3. Direct text matches (lowest priority, only if not too many)
                usage_chunks = []
                for f in rag_request.files:
                    if re.search(
                        re.escape(rag_request.question), f["content"], re.IGNORECASE
                    ):
                        usage_chunks.append(f["content"])
                        if len(usage_chunks) >= 2:  # Limit to 2 direct matches
                            break

                # Build context with priority order
                context_parts = []
                if selected_file_content:
                    context_parts.append(
                        f"SELECTED FILE ({rag_request.selected_file_path}):\n{selected_file_content}"
                    )

                if vector_chunks:
                    context_parts.append(
                        "RELEVANT CODE CHUNKS:\n" + "\n---\n".join(vector_chunks)
                    )

                if usage_chunks:
                    context_parts.append(
                        "DIRECT MATCHES:\n" + "\n---\n".join(usage_chunks)
                    )

                # Truncate context to stay within token limits
                context = truncate_context(context_parts)

                yield f"data: {json.dumps({'status': 'retrieved', 'message': f'Retrieved {len(context_parts)} context sections ({estimate_tokens(context)} tokens)'})}\n\n"
                await asyncio.sleep(0.1)

                # call the llm
                system_prompt = CHAT_PROMPT
                data = {
                    "context": context,
                    "question": rag_request.question,
                }
                full_answer = ""
                async for chunk in o4_service.call_o4_api_stream(system_prompt, data):
                    full_answer += chunk
                    yield f"data: {json.dumps({'status': 'llm_chunk', 'chunk': chunk})}\n\n"
                yield f"data: {json.dumps({'status': 'complete', 'response': full_answer})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "X-Accel-Buffering": "no",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e).split("\n")) from e
