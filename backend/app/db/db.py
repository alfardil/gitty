"""Async connection to the database."""

import os
import asyncpg
from fastapi import APIRouter
from pgvector.asyncpg import register_vector

DB_URI = os.environ["DATABASE_URL"]


async def get_pool():
    """Async connection to the database. We're keeping a minimum
    number of connections open and alive to we don't
    have to establish a new TCP connection.
    """

    pool = await asyncpg.create_pool(
        dsn=DB_URI,
        min_size=1,
        max_size=10,
        init=register_vector,
    )
    return pool
