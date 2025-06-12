from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import asyncio
from app.services.code_analyzer import CodeAnalyzer

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

class ChatMessage(BaseModel):
    question: str
    file_content: Optional[str]  

class ChatResponse(BaseModel):
    response: str
    error: Optional[str] = None

def get_code_analyzer():
    return CodeAnalyzer()

@router.post("/analyze")
async def analyze_function(
    request: Request,
    chat_message: ChatMessage,
    code_analyzer: CodeAnalyzer = Depends(get_code_analyzer)
):
    try:
        async def event_generator():
            try:
                
                yield f"data: {json.dumps({'status': 'extracting', 'message': 'Extracting function name from question...'})}\n\n"
                await asyncio.sleep(0.1)
                
                try:
                    function_name = await code_analyzer.extract_function_name(chat_message.question)
                    yield f"data: {json.dumps({'status': 'extracted', 'function_name': function_name})}\n\n"
                except ValueError as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
                    return

                # start analysis
                yield f"data: {json.dumps({'status': 'analyzing', 'message': 'Starting function analysis...'})}\n\n"
                await asyncio.sleep(0.1)

                # stream analysis
                async for chunk in code_analyzer.analyze_function_stream(
                    function_name=function_name,
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