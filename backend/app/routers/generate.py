from fastapi import APIRouter, Request
from dotenv import load_dotenv
from openai import OpenAI
from app.services.o4_mini_service import OpenAIo4Service
from pydantic import BaseModel

import os

from app.services.github import GitHubService

load_dotenv()

router = APIRouter(prefix="/generate", tags=["OpenAI"])

o4_service = OpenAIo4Service()

@router.get("")
async def test():
    system_prompt: str = """
    You are a friendly chatbot. For now, simply return the data you recieve.
    """

    data: dict = {
        "file_tree": "Hello World"
        }
    
    return o4_service.call_o4_api(system_prompt, data)

def get_github_data(username: str, repo: str):
    github_service = GitHubService()


    default_branch = github_service.get_default_branch(username, repo)
    if not default_branch:
        default_branch = "main"
    
    file_tree = github_service.get_github_file_paths_as_list(username, repo)
    readme = github_service.get_github_readme(username, repo)

    return {"default_branch": default_branch, "file_tree": file_tree, "readme": readme}

class ApiRequest(BaseModel):
    username: str
    repo: str
    instructions: str = ""


@router.post("/cost")
async def get_generation_cost(request: Request, body: ApiRequest):
    try:
        # Get file tree and README content
        github_data = get_github_data(body.username, body.repo)
        file_tree = github_data["file_tree"]
        readme = github_data["readme"]

        file_tree_tokens = o4_service.count_tokens(file_tree)
        readme_tokens = o4_service.count_tokens(readme)

        # Input cost: $1.1 per 1M tokens ($0.0000011 per token)
        # Output cost: $4.4 per 1M tokens ($0.0000044 per token)
        input_cost = ((file_tree_tokens * 2 + readme_tokens) + 3000) * 0.0000011
        output_cost = (
            8000 * 0.0000044
        )  # 8k just based on what I've seen (reasoning is expensive)
        estimated_cost = input_cost + output_cost

        # Format as currency string
        cost_string = f"${estimated_cost:.2f} USD"
        return {"cost": cost_string}
    except Exception as e:
        return {"error": str(e)}





