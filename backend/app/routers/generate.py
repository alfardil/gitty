from fastapi import APIRouter
from dotenv import load_dotenv
from openai import OpenAI

import os

load_dotenv()  # Load environment variables from .env

router = APIRouter(prefix="/generate", tags=["OpenAI"])

apiKey = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=apiKey)

@router.get("")
async def generate_story():
    response = client.chat.completions.create(
        model="o4-mini-2025-04-16",
        messages=[
            {"role": "user", "content": "Write a one-sentence bedtime story about a unicorn."}
        ]
    )
    print("Generated a sample story for you.")
    return {"output_text": response.choices[0].message.content}