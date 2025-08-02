"""
Check the status of the database connection from the backend.
"""

from fastapi import APIRouter
from app.db.db import get_pool

router = APIRouter(prefix="/db", tags=["PostgreSQL"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify the service is running.
    """
    try:

        pool = await get_pool()
        await pool.fetchval("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
