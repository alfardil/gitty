"""
Backend cache module for saving READMEs to the database.
"""

import os
import sys
from typing import Optional

# Add the frontend path to access the database
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
sys.path.append(frontend_path)

try:
    from app._actions.cache import cacheReadme as frontend_cache_readme
except ImportError:
    # Fallback if import fails
    frontend_cache_readme = None


async def cache_readme(
    username: str, repo: str, readme: str, instructions: Optional[str] = None
) -> None:
    """
    Cache a README in the database.

    Args:
        username: GitHub username
        repo: Repository name
        readme: README content
        instructions: Optional custom instructions used
    """
    if frontend_cache_readme is None:
        print("Warning: Frontend cache module not available, skipping README cache")
        return

    try:
        import asyncio

        await asyncio.to_thread(
            frontend_cache_readme, username, repo, readme, instructions
        )
        print(f"Successfully cached README for {username}/{repo}")
    except Exception as e:
        print(f"Error caching README for {username}/{repo}: {e}")
