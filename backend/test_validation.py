#!/usr/bin/env python3
"""
Simple test script to verify the validation prompt works correctly.
"""

import asyncio
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.services.o4_mini_service import OpenAIo4Service
from app.prompts import SYSTEM_VALIDATION_PROMPT


async def test_validation():
    """Test the validation prompt with sample Mermaid code."""

    # Sample Mermaid code with syntax errors
    sample_diagram = """
flowchart TD
    A[Frontend] --> B[Backend]
    B --> C[(Database)]
    click A "frontend/index.html"
    click B "backend/server.js"
    click C "database/schema.sql"
    classDef frontend fill:#D0E8FF,stroke:#1F78B4,color:#000
    classDef backend fill:#D8F5D3,stroke:#33A02C,color:#000
    classDef database fill:#A7FFF2,stroke:#00A08A,color:#000
    class A,B frontend
    class C database
    """

    # Sample Mermaid code with syntax errors (missing quotes, invalid syntax)
    problematic_diagram = """
flowchart TD
    A[Frontend App] --> B[API Server]
    B --> C[(PostgreSQL DB)]
    click A frontend/index.html
    click B backend/server.js
    click C database/schema.sql
    classDef frontend fill:#D0E8FF,stroke:#1F78B4,color:#000
    classDef backend fill:#D8F5D3,stroke:#33A02C,color:#000
    classDef database fill:#A7FFF2,stroke:#00A08A,color:#000
    class A,B frontend
    class C database
    """

    o4_service = OpenAIo4Service()

    print("Testing validation with correct Mermaid code...")
    try:
        result = o4_service.call_o4_api(
            system_prompt=SYSTEM_VALIDATION_PROMPT, data={"diagram": sample_diagram}
        )
        print("✅ Validation successful for correct code")
        print(f"Result: {result[:200]}...")
    except Exception as e:
        print(f"❌ Error validating correct code: {e}")

    print("\nTesting validation with problematic Mermaid code...")
    try:
        result = o4_service.call_o4_api(
            system_prompt=SYSTEM_VALIDATION_PROMPT,
            data={"diagram": problematic_diagram},
        )
        print("✅ Validation completed for problematic code")
        print(f"Result: {result[:200]}...")
    except Exception as e:
        print(f"❌ Error validating problematic code: {e}")


if __name__ == "__main__":
    asyncio.run(test_validation())
