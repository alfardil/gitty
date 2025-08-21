"""
Backend cache utilities for README storage.
"""

import os
import sys
from typing import Optional

# Add the frontend path to access the database
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
sys.path.append(frontend_path)

try:
    from server.src.db import db
    from server.src.db.schema import readmeCache
    from server.src.db.actions import eq, and_
except ImportError:
    db = None
    readmeCache = None
    eq = None
    and_ = None


def get_cached_readme(username: str, repo: str) -> Optional[str]:
    """Get cached README from database."""
    if not all([db, readmeCache, eq, and_]):
        return None

    try:
        cached = (
            db.select()
            .from_(readmeCache)
            .where(and_(eq(readmeCache.username, username), eq(readmeCache.repo, repo)))
            .limit(1)
        )
        return cached[0].readme if cached else None
    except Exception as e:
        print(f"Error fetching cached README: {e}")
        return None


def cache_readme(
    username: str, repo: str, readme: str, instructions: Optional[str] = None
) -> bool:
    """Cache README to database."""
    if not all([db, readmeCache]):
        return False

    try:
        db.insert(readmeCache).values(
            {
                "username": username,
                "repo": repo,
                "readme": readme,
                "instructions": instructions,
                "updatedAt": "now()",
            }
        ).on_conflict_do_update(
            index_elements=["username", "repo"],
            set_={
                "readme": readme,
                "instructions": instructions,
                "updatedAt": "now()",
            },
        ).execute()
        return True
    except Exception as e:
        print(f"Error caching README: {e}")
        return False
