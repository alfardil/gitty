from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import asyncio
from app.services.code_analyzer import CodeAnalyzer
from app.rag.embedder import embed_repo
from app.rag.retriever import get_relevant_chunks
from app.services.o4_mini_service import OpenAIo4Service

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


def get_code_analyzer():
    return CodeAnalyzer()


o4_service = OpenAIo4Service()


@router.post("/analyze")
async def analyze_function(
    request: Request,
    chat_message: ChatMessage,
    code_analyzer: CodeAnalyzer = Depends(get_code_analyzer),
):
    try:

        async def event_generator():
            try:
                # start analysis
                yield f"data: {json.dumps({'status': 'analyzing', 'message': 'Starting function analysis...'})}\n\n"
                await asyncio.sleep(0.1)

                # stream analysis

                async for chunk in code_analyzer.analyze_function_stream(
                    file_content=chat_message.file_content
                ):
                    yield f"data: {json.dumps({'status': 'analysis_chunk', 'chunk': chunk})}\n\n"

                yield f"data: {json.dumps({'status': 'complete'})}\n\n"

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
        raise HTTPException(status_code=500, detail=str(e))


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
                # 1. Selected file content
                selected_file_content = next(
                    (
                        f["content"]
                        for f in rag_request.files
                        if f["path"] == rag_request.selected_file_path
                    ),
                    None,
                )
                # 2. Usages of the query in all file contents
                import re

                usage_chunks = []
                for f in rag_request.files:
                    if re.search(
                        re.escape(rag_request.question), f["content"], re.IGNORECASE
                    ):
                        usage_chunks.append(f["content"])
                # 3. Vector search results
                context_parts = []
                if selected_file_content:
                    context_parts.append(selected_file_content)
                for chunk in usage_chunks:
                    if chunk not in context_parts:
                        context_parts.append(chunk)
                for chunk in relevant_chunks:
                    if chunk.page_content not in context_parts:
                        context_parts.append(chunk.page_content)
                context = "\n\n".join(context_parts)
                yield f"data: {json.dumps({'status': 'retrieved', 'message': 'Relevant chunks and usages retrieved.'})}\n\n"
                await asyncio.sleep(0.1)
                # Call LLM (o4-mini) with context and question
                system_prompt = "You are an expert code assistant. Use the provided context to answer the user's question."
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
        raise HTTPException(status_code=500, detail=str(e))
