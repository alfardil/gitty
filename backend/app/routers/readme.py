"""
README generation router module for creating comprehensive README files.

This module provides endpoints for generating README files based on repository content using
RAG (Retrieval-Augmented Generation). It analyzes repository files, understands the project
structure, and creates professional README documentation.

The module supports both streaming and non-streaming responses and uses the o4 model
to generate high-quality documentation.
"""

import json
import asyncio
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.github import GitHubService
from app.services.o4_mini_service import OpenAIo4Service
from app.prompts import SYSTEM_README_GENERATION_PROMPT
from app.cache import cache_readme

router = APIRouter(prefix="/readme", tags=["readme"])

o4_service = OpenAIo4Service()
github_service = GitHubService()


class ReadmeRequest(BaseModel):
    """
    Model for README generation requests.

    Attributes:
        username: The GitHub username or organization name
        repo: The repository name
        githubAccessToken: GitHub access token for authentication
        instructions: Optional custom instructions for README generation
    """

    username: str
    repo: str
    githubAccessToken: str
    instructions: str = ""


class ReadmeResponse(BaseModel):
    """
    Model for README generation response.

    Attributes:
        readme: The generated README content
        error: Optional error message if something went wrong
    """

    readme: str
    error: Optional[str] = None


def format_files_for_prompt(files):
    """
    Format repository files for the AI prompt.

    Args:
        files: List of file dictionaries with 'path' and 'content' keys

    Returns:
        str: Formatted string for the AI prompt
    """
    formatted_files = []
    for file in files:
        formatted_files.append(
            f'<file path="{file["path"]}">\n{file["content"]}\n</file>'
        )

    return "\n\n".join(formatted_files)


@router.post("/generate")
async def generate_readme(request: ReadmeRequest):
    """
    Generate a comprehensive README for a GitHub repository.

    This endpoint fetches important repository files, analyzes their content,
    and generates a professional README.md file using AI.

    Args:
        request: The README generation request

    Returns:
        ReadmeResponse: The generated README content

    Raises:
        HTTPException: If an error occurs during processing
    """
    try:
        # Fetch repository files with contents
        files = github_service.get_repository_files_with_contents(
            request.username,
            request.repo,
            request.githubAccessToken,
            max_files=30,  # Limit to prevent token overflow
        )

        if not files:
            raise HTTPException(status_code=400, detail="No files found in repository")

        # Format files for the AI prompt
        formatted_files = format_files_for_prompt(files)

        # Prepare the prompt with custom instructions if provided
        system_prompt = SYSTEM_README_GENERATION_PROMPT
        if request.instructions:
            system_prompt += f"\n\nAdditional Instructions: {request.instructions}"

        # Generate README using AI
        readme_content = o4_service.call_o4_api(
            system_prompt=system_prompt, data={"files": formatted_files}
        )

        # Save README to database (async, don't wait for it)
        asyncio.create_task(
            cache_readme(
                request.username, request.repo, readme_content, request.instructions
            )
        )

        return ReadmeResponse(readme=readme_content)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/stream")
async def generate_readme_stream(request: ReadmeRequest):
    """
    Generate a comprehensive README for a GitHub repository with streaming response.

    This endpoint provides real-time updates during the README generation process,
    including file fetching, analysis, and content generation.

    Args:
        request: The README generation request

    Returns:
        StreamingResponse: Server-Sent Events with generation progress and content

    Raises:
        HTTPException: If an error occurs during processing
    """
    try:

        async def event_generator():
            """
            Generate streaming events for the README generation process.

            Yields SSE events for each step of the process:
            - started: When generation begins
            - fetching: When fetching repository files
            - fetched: When file fetching is complete
            - analyzing: When analyzing repository content
            - generating: When generating README content
            - llm_chunk: Individual content chunks from the LLM
            - complete: Final complete README
            - error: If an error occurs during processing
            """
            try:
                yield f"data: {json.dumps({'status': 'started', 'message': 'Starting README generation...'})}\n\n"
                await asyncio.sleep(0.1)

                # Fetch repository files
                yield f"data: {json.dumps({'status': 'fetching', 'message': 'Fetching repository files...'})}\n\n"
                await asyncio.sleep(0.1)

                try:
                    files = github_service.get_repository_files_with_contents(
                        request.username,
                        request.repo,
                        request.githubAccessToken,
                        max_files=30,
                    )

                    if not files:
                        yield f"data: {json.dumps({'error': 'No files found in repository'})}\n\n"
                        return
                except Exception as e:
                    yield f"data: {json.dumps({'error': f'Failed to fetch repository files: {str(e)}'})}\n\n"
                    return

                yield f"data: {json.dumps({'status': 'fetched', 'message': f'Fetched {len(files)} files from repository'})}\n\n"
                await asyncio.sleep(0.1)

                # Analyze repository content
                yield f"data: {json.dumps({'status': 'analyzing', 'message': 'Analyzing repository structure and content...'})}\n\n"
                await asyncio.sleep(0.1)

                # Format files for the AI prompt
                formatted_files = format_files_for_prompt(files)

                # Prepare the prompt with custom instructions if provided
                system_prompt = SYSTEM_README_GENERATION_PROMPT
                if request.instructions:
                    system_prompt += (
                        f"\n\nAdditional Instructions: {request.instructions}"
                    )

                # Generate README content with streaming
                yield f"data: {json.dumps({'status': 'generating', 'message': 'Generating README content...'})}\n\n"
                await asyncio.sleep(0.1)

                full_readme = ""
                async for chunk in o4_service.call_o4_api_stream(
                    system_prompt=system_prompt, data={"files": formatted_files}
                ):
                    full_readme += chunk
                    yield f"data: {json.dumps({'status': 'llm_chunk', 'chunk': chunk})}\n\n"

                # Send final complete response
                yield f"data: {json.dumps({'status': 'complete', 'readme': full_readme})}\n\n"

                # Save README to database (async, don't wait for it)
                asyncio.create_task(
                    cache_readme(
                        request.username,
                        request.repo,
                        full_readme,
                        request.instructions,
                    )
                )

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


@router.post("/cost")
async def get_readme_generation_cost(request: ReadmeRequest):
    """
    Estimate the cost for generating a README for a repository.

    Args:
        request: The README generation request

    Returns:
        dict: Estimated cost information
    """
    try:
        # Fetch repository files to estimate token usage
        try:
            files = github_service.get_repository_files_with_contents(
                request.username, request.repo, request.githubAccessToken, max_files=30
            )

            if not files:
                return {"error": "No files found in repository"}

        except Exception as e:
            return {"error": f"Failed to fetch repository files: {str(e)}"}

        # Calculate total tokens from files
        total_tokens = 0
        for file in files:
            total_tokens += o4_service.count_tokens(file["content"])

        # Add tokens for instructions if provided
        if request.instructions:
            total_tokens += o4_service.count_tokens(request.instructions)

        # Estimate output tokens (typical README length)
        estimated_output_tokens = 2000

        # Calculate costs
        # Input cost: $1.1 per 1M tokens ($0.0000011 per token)
        # Output cost: $4.4 per 1M tokens ($0.0000044 per token)
        input_cost = total_tokens * 0.0000011
        output_cost = estimated_output_tokens * 0.0000044
        estimated_cost = input_cost + output_cost

        # Format as currency string
        cost_string = f"${estimated_cost:.2f} USD"

        return {
            "cost": cost_string,
            "input_tokens": total_tokens,
            "estimated_output_tokens": estimated_output_tokens,
        }

    except Exception as e:
        return {"error": str(e)}
