from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import generate, chat

app = FastAPI()
app.include_router(generate.router)
app.include_router(chat.router)

origins = ["http://localhost:3000"]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # update when we deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Welcome to the API for this project.",
        "author": "Authored by Alfardil Alam."
        }

