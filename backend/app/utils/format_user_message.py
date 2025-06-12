def format_user_message(data: dict[str, str]) -> str:
    """
    Formats a dictionary of data into a structured user message with XML-style tags.

    Args:
        data (dict[str, str]): Dictionary of key-value pairs to format

    Returns:
        str: Formatted message with each key-value pair wrapped in appropriate tags
    """
    parts = []
    for key, value in data.items():
        # Map keys to their XML-style tags
        if key == "file_tree":
            parts.append(f"<file_tree>\n{value}\n</file_tree>")
        elif key == "readme":
            parts.append(f"<readme>\n{value}\n</readme>")
        elif key == "explanation":
            parts.append(f"<explanation>\n{value}\n</explanation>")
        elif key == "component_mapping":
            parts.append(f"<component_mapping>\n{value}\n</component_mapping>")
        elif key == "instructions":
            parts.append(f"<instructions>\n{value}\n</instructions>")
        elif key == "diagram":
            parts.append(f"<diagram>\n{value}\n</diagram>")
        elif key == "user_question":
            parts.append(f"<user_question>\n{value}\n</user_question>")
        elif key == "function_name":
            parts.append(f"<function_name>\n{value}\n</function_name>")
        elif key == "file_content":
            parts.append(f"<file_content>\n{value}\n</file_content>")
        else:
            # For any other keys, use a generic format
            parts.append(f"<{key}>\n{value}\n</{key}>")

    return "\n\n".join(parts)
