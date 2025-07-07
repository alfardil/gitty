"""
Chat router module for handling RAG-based chat functionality.

This module provides endpoints for chat interactions with repository content using
Retrieval-Augmented Generation (RAG). It includes functionality for embedding files,
retrieving relevant chunks, and generating responses using OpenAI's o4 model.

The module supports streaming responses and context-aware chat by combining:
- Selected file content (highest priority)
- Vector similarity search results
- Direct text matches with context extraction
"""

import json
import asyncio
import re
from typing import Optional
import tiktoken
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.rag.embedder_pgvector import embed_repo_pgvector
from app.rag.retriever_pgvector import similar_chunks
from app.services.o4_mini_service import OpenAIo4Service
from app.prompts import CHAT_PROMPT

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    """
    Model for basic chat message requests.

    Attributes:
        question: The user's question or query
        file_content: Optional file content to include in the context
    """

    question: str
    file_content: Optional[str]


class ChatResponse(BaseModel):
    """
    Model for chat response data.

    Attributes:
        response: The generated response text
        error: Optional error message if something went wrong
    """

    response: str
    error: Optional[str] = None


class RAGChatRequest(BaseModel):
    """
    Model for RAG-based chat requests.

    Attributes:
        question: The user's question or query
        files: List of file dictionaries, each containing 'path' and 'content'
        selected_file_path: Path of the file that should be prioritized in context
    """

    question: str
    files: list[dict]  # Each dict should have 'path' and 'content'
    selected_file_path: str


o4_service = OpenAIo4Service()


def estimate_tokens(text: str) -> int:
    """
    Count the number of tokens in a given text string.

    Uses the cl100k_base encoding which is commonly used by OpenAI models
    to provide accurate token counting for API usage estimation.

    Args:
        text: The text string to count tokens for

    Returns:
        The number of tokens in the text
    """
    encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))


def extract_context_around_match(
    content: str, query: str, context_chars: int = 500
) -> list[str]:
    """
    Extract context snippets around text matches instead of entire file content.

    This function searches for the query string in the content and extracts
    surrounding context for each match, making the response more focused and
    relevant while staying within token limits.

    Args:
        content: The full file content to search within
        query: The search query to find matches for
        context_chars: Number of characters to include around each match (default: 500)

    Returns:
        List of context snippets, each containing the match with surrounding text
    """
    chunks = []
    pattern = re.compile(re.escape(query), re.IGNORECASE)

    for match in pattern.finditer(content):
        start = max(0, match.start() - context_chars)
        end = min(len(content), match.end() + context_chars)

        # Get the context snippet
        snippet = content[start:end]

        # Add some indication if we truncated at the beginning or end
        if start > 0:
            snippet = "..." + snippet
        if end < len(content):
            snippet = snippet + "..."

        chunks.append(snippet)

        # Limit to avoid too many matches from same file
        if len(chunks) >= 3:
            break

    return chunks


def truncate_context(context_parts: list[str], max_tokens: int = 8000) -> str:
    """
    Truncate context to stay within token limits while preserving priority order.

    This function processes context parts in order and includes as many as possible
    within the token limit. If a part would exceed the limit, it truncates that part
    to fit the remaining space.

    Args:
        context_parts: List of context sections to include, in priority order
        max_tokens: Maximum number of tokens allowed (default: 8000)

    Returns:
        Concatenated context string that fits within the token limit
    """
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
async def rag_chat(rag_request: RAGChatRequest):
    """
    Handle RAG-based chat requests with streaming responses.

    This endpoint processes chat requests using Retrieval-Augmented Generation:
    1. Embeds the provided files into vector storage
    2. Retrieves relevant chunks based on the question
    3. Extracts context from selected file and direct matches
    4. Generates a response using the o4 model with streaming output

    The response is streamed as Server-Sent Events (SSE) with status updates
    for each step of the process.

    Args:
        request: FastAPI request object
        rag_request: The RAG chat request containing question, files, and selected file

    Returns:
        StreamingResponse with SSE events containing status updates and response chunks

    Raises:
        HTTPException: If an error occurs during processing
    """
    try:

        async def event_generator():
            """
            Generate streaming events for the RAG chat process.

            Yields SSE events for each step of the process:
            - embedding: When files are being embedded
            - embedded: When embedding is complete
            - retrieving: When retrieving relevant chunks
            - retrieved: When retrieval is complete with context summary
            - llm_chunk: Individual response chunks from the LLM
            - complete: Final complete response
            - error: If an error occurs during processing
            """
            try:
                yield f"data: {json.dumps({'status': 'embedding', 'message': 'Embedding files...'})}\n\n"
                await asyncio.sleep(0.1)
                embed_result = await embed_repo_pgvector(rag_request.files)
                yield f"data: {json.dumps({'status': 'embedded', 'message': embed_result})}\n\n"
                await asyncio.sleep(0.1)
                yield f"data: {json.dumps({'status': 'retrieving', 'message': 'Retrieving relevant chunks...'})}\n\n"
                relevant_rows = await similar_chunks(rag_request.question)
                # 1. Selected file content (highest priority)
                selected_file_content = next(
                    (
                        f["content"]
                        for f in rag_request.files
                        if f["path"] == rag_request.selected_file_path
                    ),
                    None,
                )
                vector_chunks = [row["chunk"] for row in relevant_rows]

                # 3. Direct text matches (lowest priority, extract snippets around matches)
                usage_chunks = []
                files_checked = 0
                for f in rag_request.files:
                    # Skip the selected file to avoid duplication
                    if f["path"] == rag_request.selected_file_path:
                        continue

                    if re.search(
                        re.escape(rag_request.question), f["content"], re.IGNORECASE
                    ):
                        # Extract context snippets around matches instead of entire file
                        snippets = extract_context_around_match(
                            f["content"], rag_request.question
                        )
                        for snippet in snippets:
                            usage_chunks.append(f"From {f['path']}:\n{snippet}")

                        files_checked += 1
                        if files_checked >= 2:  # Limit to 2 files with direct matches
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
