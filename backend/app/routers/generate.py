"""
This FastAPI router handles endpoints related to AI-powered code generation and analysis
based on GitHub repository content. It integrates with OpenAI's o4-mini model to analyze
repository structures, generate explanations, and produce system design diagrams using
Mermaid syntax.

Endpoints:
- GET /generate: A basic test endpoint for validating OpenAI interaction.
- POST /generate/cost: Estimates token usage and cost for analyzing a given GitHub repository.
- POST /generate/stream: Streams multi-phase AI-generated output including:
    1. Repository explanation
    2. Component mapping
    3. Mermaid diagram with interactive GitHub links

Utilities:
- get_github_data: Retrieves default branch, file tree, and README content via GitHub API.
- process_click_events: Enhances Mermaid diagrams by embedding GitHub URLs into diagram nodes.

Dependencies:
- FastAPI
- OpenAIo4Service (custom service for streaming OpenAI completions)
- GitHubService (custom GitHub API wrapper)
- Mermaid-compatible formatting

All streamed endpoints follow Server-Sent Events (SSE) protocol.
"""

import re
import asyncio
import json
from dotenv import load_dotenv
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.o4_mini_service import OpenAIo4Service
from app.services.github import GitHubService
from app.prompts import (
    SYSTEM_FIRST_PROMPT,
    SYSTEM_SECOND_PROMPT,
    SYSTEM_THIRD_PROMPT,
    ADDITIONAL_SYSTEM_INSTRUCTIONS_PROMPT,
)

load_dotenv()

router = APIRouter(prefix="/generate", tags=["OpenAI"])

o4_service = OpenAIo4Service()


@router.get("")
async def test():
    system_prompt: str = """
    You are a friendly chatbot. For now, simply return the data you recieve.
    """

    data: dict = {"file_tree": "Hello World"}

    return o4_service.call_o4_api(system_prompt, data)


def get_github_data(username: str, repo: str, githubAccessToken: str):
    """
    Fetches key metadata from a GitHub repository including the default branch, file tree, and README contents.

    Args:
        username (str): The GitHub username or organization name.
        repo (str): The name of the GitHub repository.
        githubAccessToken (str): A GitHub personal access token for authenticated API access.

    Returns:
        dict: A dictionary containing:
            - "default_branch" (str): The repository's default branch (e.g., "main" or "master").
            - "file_tree" (str): A serialized representation of the repository's file structure.
            - "readme" (str): The contents of the repository's README file as a string.
    """
    github_service = GitHubService()
    default_branch = github_service.get_default_branch(
        username, repo, githubAccessToken
    )
    if not default_branch:
        default_branch = "main"
    file_tree = github_service.get_github_file_paths_as_list(
        username, repo, githubAccessToken
    )
    readme = github_service.get_github_readme(username, repo, githubAccessToken)
    return {"default_branch": default_branch, "file_tree": file_tree, "readme": readme}


class ApiRequest(BaseModel):
    username: str
    repo: str
    githubAccessToken: str
    instructions: str = ""


@router.post("/cost")
async def get_generation_cost(request: Request, body: ApiRequest):
    try:
        # Get file tree and README content
        github_data = get_github_data(body.username, body.repo, body.githubAccessToken)
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


def process_click_events(diagram: str, username: str, repo: str, branch: str) -> str:
    """
    Process click events in Mermaid diagram to include full GitHub URLs.
    Detects if path is file or directory and uses appropriate URL format.
    """

    def replace_path(match):
        # Extract the path from the click event
        path = match.group(2).strip("\"'")

        # Determine if path is likely a file (has extension) or directory
        is_file = "." in path.split("/")[-1]

        # Construct GitHub URL
        base_url = f"https://github.com/{username}/{repo}"
        path_type = "blob" if is_file else "tree"
        full_url = f"{base_url}/{path_type}/{branch}/{path}"

        # Return the full click event with the new URL
        return f'click {match.group(1)} "{full_url}"'

    # Match click events: click ComponentName "path/to/something"
    click_pattern = r'click ([^\s"]+)\s+"([^"]+)"'
    return re.sub(click_pattern, replace_path, diagram)


@router.post("/non-stream")
async def generate_non_stream(request: Request, body: ApiRequest):
    try:
        if len(body.instructions) > 1000:
            return {"error": "Instructions exceed maximum length of 1000 characters"}

        # get github data
        github_data = get_github_data(body.username, body.repo, body.githubAccessToken)
        default_branch = github_data["default_branch"]
        file_tree = github_data["file_tree"]
        readme = github_data["readme"]

        combined_content = f"{file_tree}\n{readme}"
        token_count = o4_service.count_tokens(combined_content)

        if 50000 < token_count < 195000:
            return {
                "error": f"File tree and README combined exceeds the token limit of (50,000). Current size: {token_count}"
            }
        elif token_count > 195000:
            return {
                "error": f"Repository is too large (>195k tokens) for analysis. Current size: {token_count}."
            }

        first_system_prompt = SYSTEM_FIRST_PROMPT
        third_system_prompt = SYSTEM_THIRD_PROMPT
        if body.instructions:
            first_system_prompt = (
                first_system_prompt + "\n" + ADDITIONAL_SYSTEM_INSTRUCTIONS_PROMPT
            )
            third_system_prompt = (
                third_system_prompt + "\n" + ADDITIONAL_SYSTEM_INSTRUCTIONS_PROMPT
            )

        # Phase 1: Get explanation
        explanation = o4_service.call_o4_api(
            system_prompt=first_system_prompt,
            data={
                "file_tree": file_tree,
                "readme": readme,
                "instructions": body.instructions,
            },
        )

        if "BAD_INSTRUCTIONS" in explanation:
            return {"error": "Invalid or unclear instructions provided"}

        # Phase 2: Get component mapping
        full_second_response = o4_service.call_o4_api(
            system_prompt=SYSTEM_SECOND_PROMPT,
            data={"explanation": explanation, "file_tree": file_tree},
        )

        # Extract component mapping
        start_tag = "<component_mapping>"
        end_tag = "</component_mapping>"
        component_mapping_text = full_second_response[
            full_second_response.find(start_tag) : full_second_response.find(end_tag)
        ]

        # Phase 3: Generate Mermaid diagram
        mermaid_code = o4_service.call_o4_api(
            system_prompt=third_system_prompt,
            data={
                "explanation": explanation,
                "component_mapping": component_mapping_text,
                "instructions": body.instructions,
            },
        )

        # Process final diagram
        mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "")
        if "BAD_INSTRUCTIONS" in mermaid_code:
            return {"error": "Invalid or unclear instructions provided"}

        processed_diagram = process_click_events(
            mermaid_code, body.username, body.repo, default_branch
        )

        # Return final result
        return {
            "status": "complete",
            "diagram": processed_diagram,
            "explanation": explanation,
            "mapping": component_mapping_text,
        }

    except Exception as e:
        return {"error": str(e)}


@router.post("/stream")
async def generate_stream(request: Request, body: ApiRequest):
    try:
        if len(body.instructions) > 1000:
            return {"error": "Instructions exceed maximum length of 1000 characters"}

        async def event_generator():
            try:
                # get github data
                github_data = get_github_data(
                    body.username, body.repo, body.githubAccessToken
                )
                default_branch = github_data["default_branch"]
                file_tree = github_data["file_tree"]
                readme = github_data["readme"]

                # start
                yield f"data: {json.dumps({'status': 'started', 'message': 'Starting generation process...'})}\n\n"
                await asyncio.sleep(0.1)

                combined_content = f"{file_tree}\n{readme}"
                token_count = o4_service.count_tokens(combined_content)

                if 50000 < token_count < 195000:
                    yield f"data: {json.dumps({'error': f'File tree and README combined exceeds the token limit of (50,000). Current size: {token_count}'})}"
                    return
                elif token_count > 195000:
                    yield f"data: {json.dumps({'error': f'Repoisitory is too large (>195k tokens) for analysis. Current size: {token_count}.'})}\n\n"
                    return

                first_system_prompt = SYSTEM_FIRST_PROMPT
                third_system_prompt = SYSTEM_THIRD_PROMPT
                if body.instructions:
                    first_system_prompt = (
                        first_system_prompt
                        + "\n"
                        + ADDITIONAL_SYSTEM_INSTRUCTIONS_PROMPT
                    )
                    third_system_prompt = (
                        third_system_prompt
                        + "\n"
                        + ADDITIONAL_SYSTEM_INSTRUCTIONS_PROMPT
                    )

                # Phase 1: Get explanation
                yield f"data: {json.dumps({'status': 'explanation_sent', 'message': 'Starting phase 1... Sending explanation request to o4-mini...'})}\n\n"
                await asyncio.sleep(0.1)
                yield f"data: {json.dumps({'status': 'explanation', 'message': 'Analyzing repository structure...'})}\n\n"
                explanation = ""
                async for chunk in o4_service.call_o4_api_stream(
                    system_prompt=first_system_prompt,
                    data={
                        "file_tree": file_tree,
                        "readme": readme,
                        "instructions": body.instructions,
                    },
                ):
                    explanation += chunk
                    yield f"data: {json.dumps({'status': 'explanation_chunk', 'chunk': chunk})}\n\n"

                if "BAD_INSTRUCTIONS" in explanation:
                    yield f"data: {json.dumps({'error': 'Invalid or unclear instructions provided'})}\n\n"
                    return

                # Phase 2: Get component mapping
                yield f"data: {json.dumps({'status': 'mapping_sent', 'message': 'Starting phase 2... Sending component mapping request to o4-mini...'})}\n\n"
                await asyncio.sleep(0.1)
                yield f"data: {json.dumps({'status': 'mapping', 'message': 'Creating component mapping...'})}\n\n"
                full_second_response = ""
                async for chunk in o4_service.call_o4_api_stream(
                    system_prompt=SYSTEM_SECOND_PROMPT,
                    data={"explanation": explanation, "file_tree": file_tree},
                ):
                    full_second_response += chunk
                    yield f"data: {json.dumps({'status': 'mapping_chunk', 'chunk': chunk})}\n\n"

                # i dont think i need this anymore? but keep it here for now
                # Extract component mapping
                start_tag = "<component_mapping>"
                end_tag = "</component_mapping>"
                component_mapping_text = full_second_response[
                    full_second_response.find(start_tag) : full_second_response.find(
                        end_tag
                    )
                ]

                # Phase 3: Generate Mermaid diagram
                yield f"data: {json.dumps({'status': 'diagram_sent', 'message': 'Starting phase 3... Sending diagram generation request to o4-mini...'})}\n\n"
                await asyncio.sleep(0.1)
                yield f"data: {json.dumps({'status': 'diagram', 'message': 'Generating diagram...'})}\n\n"
                mermaid_code = ""
                async for chunk in o4_service.call_o4_api_stream(
                    system_prompt=third_system_prompt,
                    data={
                        "explanation": explanation,
                        "component_mapping": component_mapping_text,
                        "instructions": body.instructions,
                    },
                ):
                    mermaid_code += chunk
                    yield f"data: {json.dumps({'status': 'diagram_chunk', 'chunk': chunk})}\n\n"

                # Process final diagram
                mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "")
                if "BAD_INSTRUCTIONS" in mermaid_code:
                    yield f"data: {json.dumps({'error': 'Invalid or unclear instructions provided'})}\n\n"
                    return

                processed_diagram = process_click_events(
                    mermaid_code, body.username, body.repo, default_branch
                )

                # Send final result
                final_data = {
                    "status": "complete",
                    "diagram": processed_diagram,
                    "explanation": explanation,
                    "mapping": component_mapping_text,
                }

                safe_json = json.dumps(final_data, ensure_ascii=False)
                yield f"data: {safe_json}\n\n"

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
        return {"error": str(e)}
