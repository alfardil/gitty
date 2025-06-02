from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import generate

app = FastAPI()
app.include_router(generate.router)

origins = ["http://localhost:3000"]

# Allow CORS for your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Update if deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/repo/{username}/{repo}")
def get_repo(username: str, repo: str):
    return {"username": username, "repo": repo}
