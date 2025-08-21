"""
Simple Mermaid.js syntax validator to catch basic syntax errors.
"""

import re
from typing import List, Tuple


def validate_mermaid_syntax(mermaid_code: str) -> Tuple[bool, List[str]]:
    """
    Validates basic Mermaid.js syntax and returns errors found.

    Args:
        mermaid_code (str): The Mermaid diagram code to validate

    Returns:
        Tuple[bool, List[str]]: (is_valid, list_of_errors)
    """
    errors = []

    # Remove markdown code blocks if present
    code = mermaid_code.strip()
    if code.startswith("```mermaid"):
        code = code[9:]
    if code.endswith("```"):
        code = code[:-3]
    code = code.strip()

    # Basic checks
    if not code:
        errors.append("Empty diagram code")
        return False, errors

    # Check for basic flowchart syntax
    if "flowchart" in code.lower() or "graph" in code.lower():
        # Check for proper node definitions
        lines = code.split("\n")
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith("%") or line.startswith("%%"):
                continue

            # Check for unquoted node names with spaces
            if "[" in line and "]" in line:
                # Extract node content between brackets
                match = re.search(r"\[([^\]]+)\]", line)
                if match:
                    node_content = match.group(1)
                    if " " in node_content and not (
                        node_content.startswith('"') and node_content.endswith('"')
                    ):
                        errors.append(
                            f"Line {i}: Node name with spaces should be quoted: {node_content}"
                        )

            # Check for unclosed quotes
            quote_count = line.count('"')
            if quote_count % 2 != 0:
                errors.append(f"Line {i}: Unclosed quotes")

            # Check for basic arrow syntax
            if "-->" in line or "---" in line:
                # Check if arrows are properly formatted
                if re.search(r"[A-Za-z0-9_]+[^>]--[^>][A-Za-z0-9_]+", line):
                    errors.append(f"Line {i}: Invalid arrow syntax")

    # Check for common syntax issues
    if code.count("{") != code.count("}"):
        errors.append("Mismatched braces")

    if code.count("[") != code.count("]"):
        errors.append("Mismatched brackets")

    if code.count("(") != code.count(")"):
        errors.append("Mismatched parentheses")

    # Check for invalid characters in node names
    invalid_chars = re.findall(r'[^A-Za-z0-9_\s\-\[\]\(\)\{\}"]', code)
    if invalid_chars:
        errors.append(f"Invalid characters found: {set(invalid_chars)}")

    return len(errors) == 0, errors


def quick_fix_mermaid_syntax(mermaid_code: str) -> str:
    """
    Applies quick fixes to common Mermaid syntax issues.

    Args:
        mermaid_code (str): The Mermaid diagram code to fix

    Returns:
        str: Fixed Mermaid code
    """
    code = mermaid_code.strip()

    # Remove markdown code blocks if present
    if code.startswith("```mermaid"):
        code = code[9:]
    if code.endswith("```"):
        code = code[:-3]
    code = code.strip()

    # Fix unquoted node names with spaces
    lines = code.split("\n")
    fixed_lines = []

    for line in lines:
        if "[" in line and "]" in line:
            # Find and quote node names with spaces
            def quote_node_content(match):
                content = match.group(1)
                if " " in content and not (
                    content.startswith('"') and content.endswith('"')
                ):
                    return f'["{content}"]'
                return f"[{content}]"

            line = re.sub(r"\[([^\]]+)\]", quote_node_content, line)

        fixed_lines.append(line)

    return "\n".join(fixed_lines)
