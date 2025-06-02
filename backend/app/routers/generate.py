from fastapi import APIRouter
from dotenv import load_dotenv
from openai import OpenAI
from app.services.o4_mini_service import OpenAIo4Service

import os

load_dotenv()  # Load environment variables from .env

router = APIRouter(prefix="/generate", tags=["OpenAI"])

o4_service = OpenAIo4Service()

@router.get("")
async def test():
    system_prompt: str = """
    You are a friendly chatbot.
    """

    data: dict = {
        "file_tree": "Hello World"
        }
    
    return o4_service.call_o4_api(system_prompt, data)





