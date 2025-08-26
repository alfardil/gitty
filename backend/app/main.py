"""
Handle CORS, and initialize all API routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import generate, chat, task_analysis, user_insights, status, readme

app = FastAPI()
app.include_router(generate.router)
app.include_router(chat.router)
app.include_router(task_analysis.router)
app.include_router(user_insights.router)
app.include_router(status.router)
app.include_router(readme.router)

origins = [
    "http://localhost:3000",
    "https://www.devboard.ai",
    "https://devboard.ai",
    "https://www.thestral.ai",
    "https://thestral.ai",
    "https://thestral.alfardil.com",
    "https://www.thestral.alfardil.com",
]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to the API for this project.",
        "author": "Authored by Alfardil Alam.",
    }
